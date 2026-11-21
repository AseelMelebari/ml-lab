-- ════════════════════════════════════════════════════════════════════
-- DAFWA | دَفوة — trusted business logic
-- Errors are raised as 'DAFWA:<CODE>' and translated to Arabic by the API.
-- ════════════════════════════════════════════════════════════════════

create or replace function public.dafwa_riyadh_today()
returns date language sql stable as $$
  select (now() at time zone 'Asia/Riyadh')::date;
$$;

-- Hard safety boundary: no delivery zone may extend outside the Makkah area,
-- whatever is configured in the dashboard. (Generous box around the city.)
create or replace function public.dafwa_in_makkah_bounds(p_lat double precision, p_lng double precision)
returns boolean language sql immutable as $$
  select p_lat between 21.15 and 21.75 and p_lng between 39.55 and 40.15;
$$;

-- Ray-casting point-in-polygon. Polygon = jsonb array of {lat,lng}.
create or replace function public.dafwa_point_in_polygon(p_lat double precision, p_lng double precision, p_poly jsonb)
returns boolean language plpgsql immutable as $$
declare
  n int := jsonb_array_length(p_poly);
  i int; j int;
  yi double precision; xi double precision; yj double precision; xj double precision;
  inside boolean := false;
begin
  if n < 3 then return false; end if;
  j := n - 1;
  for i in 0 .. n - 1 loop
    yi := (p_poly -> i ->> 'lat')::double precision; xi := (p_poly -> i ->> 'lng')::double precision;
    yj := (p_poly -> j ->> 'lat')::double precision; xj := (p_poly -> j ->> 'lng')::double precision;
    if (yi > p_lat) <> (yj > p_lat) then
      if p_lng < (xj - xi) * (p_lat - yi) / (yj - yi) + xi then
        inside := not inside;
      end if;
    end if;
    j := i;
  end loop;
  return inside;
end $$;

create or replace function public.dafwa_validate_zone_polygon()
returns trigger language plpgsql as $$
declare pt jsonb;
begin
  for pt in select * from jsonb_array_elements(new.polygon) loop
    if (pt ->> 'lat') is null or (pt ->> 'lng') is null then
      raise exception 'DAFWA:ZONE_INVALID_POLYGON';
    end if;
    if not public.dafwa_in_makkah_bounds((pt ->> 'lat')::double precision, (pt ->> 'lng')::double precision) then
      raise exception 'DAFWA:ZONE_OUTSIDE_MAKKAH';
    end if;
  end loop;
  return new;
end $$;
create trigger delivery_zones_validate before insert or update of polygon on public.delivery_zones
  for each row execute function public.dafwa_validate_zone_polygon();

create or replace function public.dafwa_find_zone(p_lat double precision, p_lng double precision)
returns public.delivery_zones language sql stable as $$
  select z.* from public.delivery_zones z
  where z.is_active
    and public.dafwa_in_makkah_bounds(p_lat, p_lng)
    and public.dafwa_point_in_polygon(p_lat, p_lng, z.polygon)
  order by z.sort_order, z.created_at
  limit 1;
$$;

-- ───────────── Rate limiting (service role only) ─────────────
create or replace function public.dafwa_rate_limit_hit(p_key text, p_window_seconds int, p_max int)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  w timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  h int;
begin
  insert into public.rate_limits (key, window_start, hits) values (p_key, w, 1)
  on conflict (key, window_start) do update set hits = rate_limits.hits + 1
  returning hits into h;
  delete from public.rate_limits where window_start < now() - interval '1 day';
  return h <= p_max;
end $$;

-- ───────────── Delivery availability (public) ─────────────
create or replace function public.dafwa_get_availability()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  s public.store_settings;
  today date := public.dafwa_riyadh_today();
  earliest timestamptz;
  d date;
  day_count int;
  day_full boolean;
  days jsonb := '[]'::jsonb;
  slots jsonb;
  sl record;
  slot_count int;
  slot_start timestamptz;
  v_reason text;
  blocked text;
  has_zone boolean;
  has_slot boolean;
begin
  select * into s from public.store_settings where id;
  earliest := now() + make_interval(hours => s.lead_time_hours);
  select exists (select 1 from public.delivery_zones where is_active) into has_zone;
  select exists (select 1 from public.delivery_slots where is_active) into has_slot;

  for d in select generate_series(today, today + s.booking_window_days, interval '1 day')::date loop
    select u.reason into blocked from public.unavailable_dates u where u.date = d;
    select count(*) into day_count from public.orders where delivery_date = d and status <> 'cancelled';
    day_full := s.max_orders_per_day is not null and day_count >= s.max_orders_per_day;
    slots := '[]'::jsonb;
    for sl in
      select * from public.delivery_slots
      where is_active and extract(dow from d)::smallint = any (weekdays)
      order by start_time, sort_order
    loop
      slot_start := (d + sl.start_time) at time zone 'Asia/Riyadh';
      select count(*) into slot_count from public.orders
        where delivery_date = d and slot_id = sl.id and status <> 'cancelled';
      v_reason := case
        when exists (select 1 from public.unavailable_dates u where u.date = d) then 'unavailable'
        when slot_start < earliest then 'lead_time'
        when day_full then 'full'
        when sl.capacity is not null and slot_count >= sl.capacity then 'full'
        else null end;
      slots := slots || jsonb_build_object(
        'slot_id', sl.id, 'label', sl.label_ar,
        'start', to_char(sl.start_time, 'HH24:MI'), 'end', to_char(sl.end_time, 'HH24:MI'),
        'available', v_reason is null, 'reason', v_reason);
    end loop;
    if jsonb_array_length(slots) > 0 then
      days := days || jsonb_build_object('date', d, 'slots', slots);
    end if;
  end loop;

  return jsonb_build_object(
    'now', now(),
    'earliest', earliest,
    'lead_time_hours', s.lead_time_hours,
    'accepting_orders', s.accepting_orders,
    'closure_message', s.closure_message,
    'checkout_configured', has_zone and has_slot,
    'days', days);
end $$;

-- ───────────── Pricing (single source of truth) ─────────────
-- p_items: [{"product_id": uuid, "variant_id": uuid|null, "quantity": int, "notes": text|null}]
create or replace function public.dafwa_price_cart(
  p_items jsonb, p_promo_code text, p_zone_id uuid, p_phone text, p_lock boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  s public.store_settings;
  it jsonb;
  p public.products;
  v public.product_variants;
  cat public.categories;
  qty int;
  unit int;
  on_sale boolean;
  has_variants boolean;
  lines jsonb := '[]'::jsonb;
  subtotal int := 0;
  total_qty int := 0;
  promo public.promotions;
  best_promo public.promotions;
  best_discount int := 0;
  discount int := 0;
  eligible int;
  fee int := 0;
  z public.delivery_zones;
  v_code text := nullif(upper(btrim(coalesce(p_promo_code, ''))), '');
  used int;
begin
  select * into s from public.store_settings where id;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'DAFWA:CART_EMPTY';
  end if;
  if jsonb_array_length(p_items) > 50 then
    raise exception 'DAFWA:CART_TOO_LARGE';
  end if;

  for it in select * from jsonb_array_elements(p_items) loop
    begin
      qty := (it ->> 'quantity')::int;
    exception when others then
      raise exception 'DAFWA:INVALID_QUANTITY';
    end;
    select * into p from public.products where id = (it ->> 'product_id')::uuid;
    if not found or not p.is_active or p.is_archived then
      raise exception 'DAFWA:PRODUCT_NOT_FOUND' using detail = coalesce(it ->> 'product_id', '');
    end if;
    if not p.is_available then
      raise exception 'DAFWA:PRODUCT_UNAVAILABLE' using detail = p.name_ar;
    end if;
    if qty is null or qty < p.min_quantity or qty > p.max_quantity then
      raise exception 'DAFWA:INVALID_QUANTITY' using detail = p.name_ar;
    end if;

    select exists (select 1 from public.product_variants where product_id = p.id) into has_variants;
    v := null;
    if nullif(it ->> 'variant_id', '') is not null then
      select * into v from public.product_variants
        where id = (it ->> 'variant_id')::uuid and product_id = p.id;
      if not found then raise exception 'DAFWA:VARIANT_NOT_FOUND' using detail = p.name_ar; end if;
      if not v.is_available then raise exception 'DAFWA:PRODUCT_UNAVAILABLE' using detail = p.name_ar || ' - ' || v.name_ar; end if;
      if v.stock_quantity is not null and v.stock_quantity < qty then
        raise exception 'DAFWA:OUT_OF_STOCK' using detail = p.name_ar || ' - ' || v.name_ar;
      end if;
    elsif has_variants then
      raise exception 'DAFWA:VARIANT_REQUIRED' using detail = p.name_ar;
    end if;
    if p.stock_quantity is not null and p.stock_quantity < qty then
      raise exception 'DAFWA:OUT_OF_STOCK' using detail = p.name_ar;
    end if;

    if v.id is not null and v.price_halalas is not null then
      unit := coalesce(v.sale_price_halalas, v.price_halalas);
      on_sale := v.sale_price_halalas is not null and v.sale_price_halalas < v.price_halalas;
    else
      unit := coalesce(p.sale_price_halalas, p.price_halalas);
      on_sale := p.sale_price_halalas is not null;
    end if;

    cat := null;
    if p.category_id is not null then select * into cat from public.categories where id = p.category_id; end if;

    lines := lines || jsonb_build_object(
      'product_id', p.id, 'variant_id', v.id,
      'product_name_ar', p.name_ar, 'product_name_en', p.name_en,
      'variant_name', v.name_ar,
      'category_id', p.category_id, 'category_name', cat.name_ar,
      'unit_price_halalas', unit, 'quantity', qty,
      'line_total_halalas', unit * qty, 'on_sale', on_sale,
      'notes', case when p.allow_notes then left(nullif(btrim(it ->> 'notes'), ''), 300) else null end);
    subtotal := subtotal + unit * qty;
    total_qty := total_qty + qty;
  end loop;

  if total_qty > s.max_items_per_order then
    raise exception 'DAFWA:CART_TOO_LARGE';
  end if;

  -- Promotions: at most ONE per order (no stacking). A code takes precedence;
  -- otherwise the best eligible automatic offer is applied.
  for promo in
    select * from public.promotions pr
    where pr.is_active
      and (case when v_code is not null then pr.code = v_code else pr.code is null end)
    order by pr.created_at
  loop
    if p_lock then
      select * into promo from public.promotions where id = promo.id for update;
    end if;
    if (promo.starts_at is not null and now() < promo.starts_at) or (promo.ends_at is not null and now() >= promo.ends_at) then
      if v_code is not null then raise exception 'DAFWA:PROMO_EXPIRED'; end if;
      continue;
    end if;
    if promo.max_uses is not null and promo.uses_count >= promo.max_uses then
      if v_code is not null then raise exception 'DAFWA:PROMO_EXHAUSTED'; end if;
      continue;
    end if;
    if promo.per_customer_limit is not null and p_phone is not null then
      select count(*) into used from public.promotion_redemptions r
        join public.orders o on o.id = r.order_id
        where r.promotion_id = promo.id and r.customer_phone = p_phone and o.status <> 'cancelled';
      if used >= promo.per_customer_limit then
        if v_code is not null then raise exception 'DAFWA:PROMO_CUSTOMER_LIMIT'; end if;
        continue;
      end if;
    end if;
    if subtotal < promo.min_order_halalas then
      if v_code is not null then raise exception 'DAFWA:PROMO_MIN_ORDER' using detail = promo.min_order_halalas::text; end if;
      continue;
    end if;

    select coalesce(sum((l ->> 'line_total_halalas')::int), 0) into eligible
    from jsonb_array_elements(lines) l
    where not (promo.exclude_sale_items and (l ->> 'on_sale')::boolean)
      and (promo.applies_to = 'order'
        or (promo.applies_to = 'products' and (l ->> 'product_id')::uuid = any (promo.product_ids))
        or (promo.applies_to = 'categories' and (l ->> 'category_id') is not null
            and (l ->> 'category_id')::uuid = any (promo.category_ids)));

    if eligible <= 0 then
      if v_code is not null then raise exception 'DAFWA:PROMO_NOT_APPLICABLE'; end if;
      continue;
    end if;

    discount := case when promo.kind = 'percentage' then (eligible * promo.value) / 100
                     else least(promo.value, eligible) end;
    if promo.max_discount_halalas is not null then discount := least(discount, promo.max_discount_halalas); end if;
    discount := greatest(0, least(discount, subtotal));

    if best_promo.id is null or discount > best_discount then
      best_promo := promo; best_discount := discount;
    end if;
  end loop;

  if v_code is not null and best_promo.id is null then
    raise exception 'DAFWA:PROMO_INVALID';
  end if;

  if p_zone_id is not null then
    select * into z from public.delivery_zones where id = p_zone_id and is_active;
    if not found then raise exception 'DAFWA:OUT_OF_ZONE'; end if;
    if subtotal < z.min_order_halalas then
      raise exception 'DAFWA:ZONE_MIN_ORDER' using detail = z.min_order_halalas::text;
    end if;
    fee := z.fee_halalas;
  end if;

  return jsonb_build_object(
    'lines', lines,
    'subtotal_halalas', subtotal,
    'discount_halalas', best_discount,
    'delivery_fee_halalas', fee,
    'total_halalas', subtotal - best_discount + fee,
    'total_quantity', total_qty,
    'promotion', case when best_promo.id is null then null else jsonb_build_object(
      'id', best_promo.id, 'name', best_promo.name, 'code', best_promo.code) end,
    'zone', case when z.id is null then null else jsonb_build_object('id', z.id, 'name', z.name_ar) end);
end $$;

-- Public quote: prices + zone detection, without creating anything.
create or replace function public.dafwa_quote(
  p_items jsonb, p_promo_code text default null, p_lat double precision default null, p_lng double precision default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  z public.delivery_zones;
begin
  if p_lat is not null and p_lng is not null then
    z := public.dafwa_find_zone(p_lat, p_lng);
    if z.id is null then raise exception 'DAFWA:OUT_OF_ZONE'; end if;
  end if;
  return public.dafwa_price_cart(p_items, p_promo_code, z.id, null, false);
end $$;

-- ───────────── Order creation (service role only, transactional) ─────────────
create or replace function public.dafwa_create_order(p jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  s public.store_settings;
  ps public.store_private_settings;
  key text := p ->> 'idempotency_key';
  existing public.orders;
  c jsonb := p -> 'customer';
  loc jsonb := p -> 'location';
  dl jsonb := p -> 'delivery';
  v_name text := btrim(c ->> 'name');
  v_phone text := btrim(c ->> 'phone');
  v_email text := lower(btrim(c ->> 'email'));
  v_lat double precision;
  v_lng double precision;
  v_date date;
  z public.delivery_zones;
  sl public.delivery_slots;
  slot_start timestamptz;
  slot_end timestamptz;
  cnt int;
  priced jsonb;
  line jsonb;
  cust_id uuid;
  ord public.orders;
  promo_id uuid;
  rcpt text;
begin
  if key is null or length(key) < 16 or length(key) > 100 then
    raise exception 'DAFWA:INVALID_REQUEST';
  end if;

  -- Serialise duplicate submissions of the same checkout.
  perform pg_advisory_xact_lock(hashtext('dafwa-idem:' || key));
  select * into existing from public.orders where idempotency_key = key;
  if found then
    return jsonb_build_object('duplicate', true, 'order_id', existing.id, 'order_number', existing.order_number);
  end if;

  select * into s from public.store_settings where id;
  select * into ps from public.store_private_settings where id;
  if not s.accepting_orders then raise exception 'DAFWA:ORDERS_CLOSED'; end if;
  if not exists (select 1 from public.delivery_zones where is_active)
     or not exists (select 1 from public.delivery_slots where is_active) then
    raise exception 'DAFWA:CHECKOUT_NOT_CONFIGURED';
  end if;

  -- Customer fields
  if v_name is null or length(v_name) < 2 or length(v_name) > 100 then raise exception 'DAFWA:INVALID_NAME'; end if;
  if v_phone is null or v_phone !~ '^\+9665[0-9]{8}$' then raise exception 'DAFWA:INVALID_PHONE'; end if;
  if v_email is null or length(v_email) > 254 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$' then raise exception 'DAFWA:INVALID_EMAIL'; end if;
  if nullif(c ->> 'whatsapp', '') is not null and (c ->> 'whatsapp') !~ '^\+9665[0-9]{8}$' then raise exception 'DAFWA:INVALID_PHONE'; end if;
  if coalesce(length(btrim(loc ->> 'neighborhood')), 0) < 2 then raise exception 'DAFWA:INVALID_NEIGHBORHOOD'; end if;

  -- Location → approved zone
  begin
    v_lat := (loc ->> 'lat')::double precision;
    v_lng := (loc ->> 'lng')::double precision;
  exception when others then raise exception 'DAFWA:INVALID_LOCATION'; end;
  if v_lat is null or v_lng is null then raise exception 'DAFWA:INVALID_LOCATION'; end if;
  z := public.dafwa_find_zone(v_lat, v_lng);
  if z.id is null then raise exception 'DAFWA:OUT_OF_ZONE'; end if;

  -- Delivery date / slot / lead time
  begin
    v_date := (dl ->> 'date')::date;
    select * into sl from public.delivery_slots where id = (dl ->> 'slot_id')::uuid and is_active;
  exception when others then raise exception 'DAFWA:INVALID_SLOT'; end;
  if v_date is null or sl.id is null then raise exception 'DAFWA:INVALID_SLOT'; end if;
  if not (extract(dow from v_date)::smallint = any (sl.weekdays)) then raise exception 'DAFWA:INVALID_SLOT'; end if;
  if exists (select 1 from public.unavailable_dates where date = v_date) then raise exception 'DAFWA:DATE_UNAVAILABLE'; end if;
  if v_date > public.dafwa_riyadh_today() + s.booking_window_days then raise exception 'DAFWA:DATE_TOO_FAR'; end if;
  slot_start := (v_date + sl.start_time) at time zone 'Asia/Riyadh';
  slot_end := (v_date + sl.end_time) at time zone 'Asia/Riyadh';
  if slot_start < now() + make_interval(hours => s.lead_time_hours) then
    raise exception 'DAFWA:LEAD_TIME' using detail = s.lead_time_hours::text;
  end if;

  -- Capacity: one lock per delivery date serialises concurrent checkouts for that day,
  -- so the counts below cannot be bypassed by simultaneous requests.
  perform pg_advisory_xact_lock(hashtext('dafwa-day:' || v_date::text));
  if s.max_orders_per_day is not null then
    select count(*) into cnt from public.orders where delivery_date = v_date and status <> 'cancelled';
    if cnt >= s.max_orders_per_day then raise exception 'DAFWA:SLOT_FULL'; end if;
  end if;
  if sl.capacity is not null then
    select count(*) into cnt from public.orders where delivery_date = v_date and slot_id = sl.id and status <> 'cancelled';
    if cnt >= sl.capacity then raise exception 'DAFWA:SLOT_FULL'; end if;
  end if;

  -- Server-side pricing (prices always read from the database)
  priced := public.dafwa_price_cart(p -> 'items', p ->> 'promo_code', z.id, v_phone, true);

  -- Stock (only where tracked); conditional updates are race-safe.
  for line in select * from jsonb_array_elements(priced -> 'lines') loop
    update public.products set stock_quantity = stock_quantity - (line ->> 'quantity')::int
      where id = (line ->> 'product_id')::uuid and stock_quantity is not null
        and stock_quantity >= (line ->> 'quantity')::int;
    get diagnostics cnt = row_count;
    if cnt = 0 and exists (select 1 from public.products
                           where id = (line ->> 'product_id')::uuid and stock_quantity is not null) then
      raise exception 'DAFWA:OUT_OF_STOCK' using detail = line ->> 'product_name_ar';
    end if;
    if (line ->> 'variant_id') is not null then
      update public.product_variants set stock_quantity = stock_quantity - (line ->> 'quantity')::int
        where id = (line ->> 'variant_id')::uuid and stock_quantity is not null
          and stock_quantity >= (line ->> 'quantity')::int;
      get diagnostics cnt = row_count;
      if cnt = 0 and exists (select 1 from public.product_variants
                             where id = (line ->> 'variant_id')::uuid and stock_quantity is not null) then
        raise exception 'DAFWA:OUT_OF_STOCK' using detail = line ->> 'product_name_ar';
      end if;
    end if;
  end loop;

  -- Customer record (keyed by normalised phone)
  insert into public.customers as cu (full_name, phone, email, whatsapp, orders_count, first_order_at, last_order_at)
  values (v_name, v_phone, v_email, nullif(c ->> 'whatsapp', ''), 1, now(), now())
  on conflict (phone) do update set
    full_name = excluded.full_name, email = excluded.email,
    whatsapp = coalesce(excluded.whatsapp, cu.whatsapp),
    orders_count = cu.orders_count + 1, last_order_at = now()
  returning id into cust_id;

  promo_id := nullif(priced -> 'promotion' ->> 'id', '')::uuid;

  insert into public.orders (
    order_number, customer_id, customer_name, customer_phone, customer_email, customer_whatsapp,
    zone_id, zone_name, neighborhood, latitude, longitude, building, apartment, floor,
    delivery_instructions, notes, delivery_date, slot_id, slot_label, delivery_start, delivery_end,
    subtotal_halalas, discount_halalas, delivery_fee_halalas, total_halalas,
    promotion_id, promo_code, idempotency_key)
  values (
    'DF-' || lpad(nextval('public.order_number_seq')::text, 4, '0'), cust_id, v_name, v_phone, v_email, nullif(c ->> 'whatsapp', ''),
    z.id, z.name_ar, left(btrim(loc ->> 'neighborhood'), 80), round(v_lat::numeric, 6), round(v_lng::numeric, 6),
    left(nullif(btrim(loc ->> 'building'), ''), 40), left(nullif(btrim(loc ->> 'apartment'), ''), 40), left(nullif(btrim(loc ->> 'floor'), ''), 20),
    left(nullif(btrim(loc ->> 'instructions'), ''), 500), left(nullif(btrim(p ->> 'notes'), ''), 1000),
    v_date, sl.id, sl.label_ar, slot_start, slot_end,
    (priced ->> 'subtotal_halalas')::int, (priced ->> 'discount_halalas')::int,
    (priced ->> 'delivery_fee_halalas')::int, (priced ->> 'total_halalas')::int,
    promo_id, priced -> 'promotion' ->> 'code', key)
  returning * into ord;

  insert into public.order_items (order_id, product_id, variant_id, category_id, category_name, product_name_ar, product_name_en,
                                  variant_name, unit_price_halalas, quantity, line_total_halalas, notes)
  select ord.id, (l ->> 'product_id')::uuid, nullif(l ->> 'variant_id', '')::uuid, nullif(l ->> 'category_id', '')::uuid,
         l ->> 'category_name', l ->> 'product_name_ar', l ->> 'product_name_en', l ->> 'variant_name',
         (l ->> 'unit_price_halalas')::int, (l ->> 'quantity')::int, (l ->> 'line_total_halalas')::int, l ->> 'notes'
  from jsonb_array_elements(priced -> 'lines') l;

  if promo_id is not null then
    update public.promotions set uses_count = uses_count + 1
      where id = promo_id and (max_uses is null or uses_count < max_uses);
    if not found then raise exception 'DAFWA:PROMO_EXHAUSTED'; end if;
    insert into public.promotion_redemptions (promotion_id, order_id, customer_phone, discount_halalas)
    values (promo_id, ord.id, v_phone, ord.discount_halalas);
  end if;

  insert into public.order_status_history (order_id, field, from_value, to_value, note)
  values (ord.id, 'status', null, ord.status, 'order_created'),
         (ord.id, 'payment_status', null, ord.payment_status, 'order_created');

  -- Durable email outbox (sent by Netlify Functions, retried on failure)
  foreach rcpt in array ps.owner_notification_emails loop
    insert into public.email_notifications (order_id, kind, recipient, dedupe_key)
    values (ord.id, 'owner_new_order', lower(rcpt), 'order:' || ord.id || ':owner_new_order:' || lower(rcpt))
    on conflict (dedupe_key) do nothing;
  end loop;
  insert into public.email_notifications (order_id, kind, recipient, dedupe_key)
  values (ord.id, 'customer_received', v_email, 'order:' || ord.id || ':customer_received')
  on conflict (dedupe_key) do nothing;

  return jsonb_build_object(
    'duplicate', false,
    'order_id', ord.id,
    'order_number', ord.order_number);
end $$;

-- Public-safe order summary for the confirmation page / WhatsApp message,
-- only retrievable with BOTH the order id and the idempotency key the browser used.
create or replace function public.dafwa_order_receipt(p_order_id uuid, p_key text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'order_id', o.id, 'order_number', o.order_number, 'created_at', o.created_at,
    'customer_name', o.customer_name, 'customer_email', o.customer_email,
    'neighborhood', o.neighborhood, 'zone_name', o.zone_name,
    'latitude', o.latitude, 'longitude', o.longitude,
    'delivery_date', o.delivery_date, 'slot_label', o.slot_label,
    'delivery_start', o.delivery_start, 'delivery_end', o.delivery_end,
    'status', o.status, 'payment_status', o.payment_status,
    'subtotal_halalas', o.subtotal_halalas, 'discount_halalas', o.discount_halalas,
    'delivery_fee_halalas', o.delivery_fee_halalas, 'total_halalas', o.total_halalas,
    'promo_code', o.promo_code,
    'items', (select coalesce(jsonb_agg(jsonb_build_object(
        'name', i.product_name_ar, 'variant', i.variant_name, 'quantity', i.quantity,
        'unit_price_halalas', i.unit_price_halalas, 'line_total_halalas', i.line_total_halalas) order by i.created_at), '[]'::jsonb)
      from public.order_items i where i.order_id = o.id))
  from public.orders o
  where o.id = p_order_id and o.idempotency_key = p_key;
$$;

-- ───────────── Order lifecycle (admin updates) ─────────────
create or replace function public.dafwa_orders_before_update()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  allow_partial boolean;
  it record;
begin
  -- Financial snapshot and identity are immutable after creation.
  if new.order_number <> old.order_number or new.idempotency_key <> old.idempotency_key
     or new.subtotal_halalas <> old.subtotal_halalas or new.discount_halalas <> old.discount_halalas
     or new.delivery_fee_halalas <> old.delivery_fee_halalas or new.total_halalas <> old.total_halalas
     or new.created_at <> old.created_at or new.customer_id is distinct from old.customer_id
     or new.latitude <> old.latitude or new.longitude <> old.longitude then
    raise exception 'DAFWA:ORDER_IMMUTABLE';
  end if;

  if new.status is distinct from old.status then
    if old.status = 'cancelled' then raise exception 'DAFWA:ORDER_CANCELLED_FINAL'; end if;
    if new.status = 'confirmed' and old.confirmed_at is null then new.confirmed_at := now(); end if;
    if new.status = 'delivered' then new.delivered_at := now(); end if;
    if new.status = 'cancelled' then
      new.cancelled_at := now();
      -- Return tracked stock
      for it in select * from public.order_items where order_id = new.id loop
        update public.products set stock_quantity = stock_quantity + it.quantity
          where id = it.product_id and stock_quantity is not null;
        update public.product_variants set stock_quantity = stock_quantity + it.quantity
          where id = it.variant_id and stock_quantity is not null;
      end loop;
    end if;
  end if;

  if new.payment_status is distinct from old.payment_status or new.amount_paid_halalas <> old.amount_paid_halalas then
    case new.payment_status
      when 'paid' then new.amount_paid_halalas := new.total_halalas;
      when 'pending_payment' then new.amount_paid_halalas := 0;
      when 'refunded' then new.amount_paid_halalas := 0;
      when 'partially_paid' then
        select allow_partial_payment into allow_partial from public.store_settings where id;
        if not allow_partial then raise exception 'DAFWA:PARTIAL_DISABLED'; end if;
        if new.amount_paid_halalas <= 0 or new.amount_paid_halalas >= new.total_halalas then
          raise exception 'DAFWA:INVALID_PARTIAL_AMOUNT';
        end if;
    end case;
  end if;
  return new;
end $$;
create trigger orders_lifecycle before update on public.orders
  for each row execute function public.dafwa_orders_before_update();

create or replace function public.dafwa_orders_after_update()
returns trigger language plpgsql security definer set search_path = public as $$
declare k text;
begin
  if new.status is distinct from old.status then
    insert into public.order_status_history (order_id, field, from_value, to_value, changed_by)
    values (new.id, 'status', old.status, new.status, auth.uid());
    k := case new.status
      when 'confirmed' then 'customer_confirmed'
      when 'out_for_delivery' then 'customer_out_for_delivery'
      when 'cancelled' then 'customer_cancelled'
      else null end;
    if k is not null then
      insert into public.email_notifications (order_id, kind, recipient, dedupe_key)
      values (new.id, k, new.customer_email, 'order:' || new.id || ':' || k)
      on conflict (dedupe_key) do nothing;
    end if;
  end if;
  if new.payment_status is distinct from old.payment_status then
    insert into public.order_status_history (order_id, field, from_value, to_value, changed_by)
    values (new.id, 'payment_status', old.payment_status, new.payment_status, auth.uid());
  end if;
  return null;
end $$;
create trigger orders_history after update on public.orders
  for each row execute function public.dafwa_orders_after_update();

-- ───────────── Email outbox worker helpers (service role only) ─────────────
-- Atomically claims due emails so parallel workers never send the same one twice.
create or replace function public.dafwa_claim_emails(p_limit int default 20, p_order_id uuid default null)
returns setof public.email_notifications language plpgsql security definer set search_path = public as $$
begin
  -- Recover rows stuck in 'sending' (worker crashed mid-send)
  update public.email_notifications set status = 'failed', last_error = 'worker_timeout'
    where status = 'sending' and updated_at < now() - interval '10 minutes';
  return query
  update public.email_notifications e set status = 'sending', attempts = e.attempts + 1
  where e.id in (
    select id from public.email_notifications
    where status in ('pending', 'failed') and next_attempt_at <= now()
      and (p_order_id is null or order_id = p_order_id)
    order by created_at
    limit p_limit
    for update skip locked)
  returning e.*;
end $$;

create or replace function public.dafwa_complete_email(p_id uuid, p_ok boolean, p_provider_id text, p_error text, p_permanent boolean default false)
returns void language plpgsql security definer set search_path = public as $$
declare a int;
begin
  select attempts into a from public.email_notifications where id = p_id;
  if p_ok then
    update public.email_notifications set status = 'sent', provider_message_id = p_provider_id,
      sent_at = now(), last_error = null where id = p_id;
  else
    update public.email_notifications set
      status = case when p_permanent or a >= 6 then 'dead' else 'failed' end,
      last_error = left(p_error, 500),
      -- exponential backoff: 2, 4, 8, 16, 32 minutes
      next_attempt_at = now() + make_interval(mins => (2 ^ least(a, 6))::int)
    where id = p_id;
  end if;
end $$;

-- Admin: re-queue a failed/dead email
create or replace function public.dafwa_retry_email(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'DAFWA:FORBIDDEN'; end if;
  update public.email_notifications set status = 'pending', next_attempt_at = now(), attempts = 0
    where id = p_id and status in ('failed', 'dead');
end $$;

-- ───────────── Analytics (admin only) ─────────────
-- Definitions (documented in docs/ANALYTICS.md):
--  • period basis: order creation time in Asia/Riyadh
--  • successful = status <> 'cancelled'
--  • gross_sales = Σ subtotal (successful)      • discounts = Σ discount (successful)
--  • net_sales   = gross_sales − discounts       • delivery_fees = Σ delivery fee (successful)
--  • total_billed = net_sales + delivery_fees
--  • collected   = Σ amount_paid of successful orders (paid / partially paid)
--  • unpaid      = Σ (total − amount_paid) of successful orders not fully paid / refunded
create or replace function public.dafwa_sales_report(
  p_from date, p_to date,
  p_statuses text[] default null, p_payments text[] default null,
  p_category uuid default null, p_grain text default 'day')
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  result jsonb;
  g text := case when p_grain in ('day', 'week', 'month', 'year') then p_grain else 'day' end;
begin
  if not public.is_admin() then raise exception 'DAFWA:FORBIDDEN'; end if;

  with o as (
    select o.*, (o.created_at at time zone 'Asia/Riyadh') as local_ts
    from public.orders o
    where (o.created_at at time zone 'Asia/Riyadh')::date between p_from and p_to
      and (p_statuses is null or o.status = any (p_statuses))
      and (p_payments is null or o.payment_status = any (p_payments))
      and (p_category is null or exists (select 1 from public.order_items i where i.order_id = o.id and i.category_id = p_category))
  ),
  ok as (select * from o where status <> 'cancelled'),
  items as (
    select i.*, ok.local_ts from public.order_items i join ok on ok.id = i.order_id
    where p_category is null or i.category_id = p_category
  ),
  buckets as (
    select generate_series(
      case when g = 'week' then date_trunc('week', p_from::timestamp + interval '1 day') - interval '1 day'
           else date_trunc(g, p_from::timestamp) end,
      p_to::timestamp, ('1 ' || g)::interval) as b
  ),
  bucketed as (
    select case when g = 'week' then date_trunc('week', local_ts + interval '1 day') - interval '1 day'
                else date_trunc(g, local_ts) end as b, *
    from o
  )
  select jsonb_build_object(
    'summary', (select jsonb_build_object(
        'orders_total', (select count(*) from o),
        'orders_successful', (select count(*) from ok),
        'orders_cancelled', (select count(*) from o where status = 'cancelled'),
        'orders_pending', (select count(*) from o where status = 'pending_confirmation'),
        'units_sold', (select coalesce(sum(quantity), 0) from items),
        'gross_sales', (select coalesce(sum(subtotal_halalas), 0) from ok),
        'discounts', (select coalesce(sum(discount_halalas), 0) from ok),
        'net_sales', (select coalesce(sum(subtotal_halalas - discount_halalas), 0) from ok),
        'delivery_fees', (select coalesce(sum(delivery_fee_halalas), 0) from ok),
        'total_billed', (select coalesce(sum(total_halalas), 0) from ok),
        'collected', (select coalesce(sum(amount_paid_halalas), 0) from ok where payment_status in ('paid', 'partially_paid')),
        'unpaid', (select coalesce(sum(total_halalas - amount_paid_halalas), 0) from ok where payment_status in ('pending_payment', 'partially_paid')),
        'average_order_value', (select coalesce(round(avg(total_halalas)), 0) from ok))),
    'series', (select coalesce(jsonb_agg(row_to_json(x) order by x.bucket), '[]'::jsonb) from (
        select to_char(bk.b, 'YYYY-MM-DD') as bucket,
          count(bd.id) filter (where bd.status <> 'cancelled') as orders,
          count(bd.id) filter (where bd.status = 'cancelled') as cancelled,
          coalesce(sum(bd.subtotal_halalas - bd.discount_halalas) filter (where bd.status <> 'cancelled'), 0) as net_sales,
          coalesce(sum(bd.total_halalas) filter (where bd.status <> 'cancelled'), 0) as total_billed,
          coalesce(sum(bd.amount_paid_halalas) filter (where bd.status <> 'cancelled' and bd.payment_status in ('paid', 'partially_paid')), 0) as collected,
          coalesce((select sum(i.quantity) from items i join bucketed b2 on b2.id = i.order_id where b2.b = bk.b), 0) as units
        from buckets bk left join bucketed bd on bd.b = bk.b
        group by bk.b) x),
    'products', (select coalesce(jsonb_agg(row_to_json(x) order by x.units desc, x.revenue desc), '[]'::jsonb) from (
        select coalesce(product_id::text, product_name_ar) as key, max(product_name_ar) as name,
               sum(quantity) as units, sum(line_total_halalas) as revenue, count(distinct order_id) as orders
        from items group by 1 order by units desc limit 20) x),
    'categories', (select coalesce(jsonb_agg(row_to_json(x) order by x.units desc), '[]'::jsonb) from (
        select coalesce(category_name, 'بدون تصنيف') as name, sum(quantity) as units, sum(line_total_halalas) as revenue
        from items group by 1) x),
    'statuses', (select coalesce(jsonb_object_agg(status, n), '{}'::jsonb) from (select status, count(*) n from o group by status) x),
    'payments', (select coalesce(jsonb_object_agg(payment_status, n), '{}'::jsonb) from (select payment_status, count(*) n from o group by payment_status) x)
  ) into result;
  return result;
end $$;

create or replace function public.dafwa_admin_overview()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  today date := public.dafwa_riyadh_today();
  week_start date := (date_trunc('week', today::timestamp + interval '1 day') - interval '1 day')::date; -- Sunday
begin
  if not public.is_admin() then raise exception 'DAFWA:FORBIDDEN'; end if;
  return (
    with o as (select *, (created_at at time zone 'Asia/Riyadh')::date as d from public.orders where status <> 'cancelled')
    select jsonb_build_object(
      'today', (select count(*) from o where d = today),
      'week', (select count(*) from o where d >= week_start),
      'month', (select count(*) from o where d >= date_trunc('month', today)::date),
      'year', (select count(*) from o where d >= date_trunc('year', today)::date),
      'pending_confirmation', (select count(*) from public.orders where status = 'pending_confirmation'),
      'pending_payment_value', (select coalesce(sum(total_halalas - amount_paid_halalas), 0) from o where payment_status in ('pending_payment', 'partially_paid')),
      'deliveries_today', (select count(*) from o where delivery_date = today),
      'deliveries_tomorrow', (select count(*) from o where delivery_date = today + 1),
      'emails_failed', (select count(*) from public.email_notifications where status in ('failed', 'dead')),
      'active_zones', (select count(*) from public.delivery_zones where is_active),
      'active_slots', (select count(*) from public.delivery_slots where is_active),
      'active_products', (select count(*) from public.products where is_active and not is_archived)
    ));
end $$;
