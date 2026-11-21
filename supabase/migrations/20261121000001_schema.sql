-- ════════════════════════════════════════════════════════════════════
-- DAFWA | دَفوة — core schema
-- Money is stored as INTEGER halalas (1 SAR = 100 halalas) to avoid
-- floating-point errors. All business times use Asia/Riyadh.
-- ════════════════════════════════════════════════════════════════════

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ───────────── Admins ─────────────
create table public.admin_roles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  role       text not null default 'owner' check (role in ('owner', 'staff')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_roles where user_id = auth.uid());
$$;

-- ───────────── Catalogue ─────────────
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  name_ar     text not null check (length(name_ar) between 1 and 80),
  name_en     text check (name_en is null or length(name_en) <= 80),
  slug        text not null unique check (slug ~ '^[a-z0-9-]{1,80}$'),
  description text,
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger categories_updated before update on public.categories
  for each row execute function public.set_updated_at();

create table public.products (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique check (slug ~ '^[a-z0-9-]{1,100}$'),
  name_ar            text not null check (length(name_ar) between 1 and 120),
  name_en            text check (name_en is null or length(name_en) <= 120),
  short_description  text check (short_description is null or length(short_description) <= 300),
  description        text check (description is null or length(description) <= 5000),
  category_id        uuid references public.categories(id) on delete set null,
  price_halalas      int not null check (price_halalas > 0),
  sale_price_halalas int check (sale_price_halalas is null or sale_price_halalas > 0),
  is_active          boolean not null default true,   -- published in the store
  is_archived        boolean not null default false,
  is_available       boolean not null default true,   -- can be ordered right now
  is_featured        boolean not null default false,
  is_bestseller      boolean not null default false,
  stock_quantity     int check (stock_quantity is null or stock_quantity >= 0), -- null = not tracked
  ingredients        text,
  allergens          text,
  show_ingredients   boolean not null default true,
  show_allergens     boolean not null default true,
  allow_notes        boolean not null default false,
  min_quantity       int not null default 1 check (min_quantity >= 1),
  max_quantity       int not null default 50 check (max_quantity >= 1),
  sort_order         int not null default 0,
  seo_title          text,
  seo_description    text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint sale_below_price check (sale_price_halalas is null or sale_price_halalas < price_halalas),
  constraint qty_range check (max_quantity >= min_quantity)
);
create index products_category_idx on public.products(category_id);
create index products_listing_idx on public.products(is_active, is_archived, sort_order);
create trigger products_updated before update on public.products
  for each row execute function public.set_updated_at();

create table public.product_images (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  url          text not null,
  alt          text,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);
create index product_images_product_idx on public.product_images(product_id, sort_order);

create table public.product_variants (
  id                 uuid primary key default gen_random_uuid(),
  product_id         uuid not null references public.products(id) on delete cascade,
  name_ar            text not null check (length(name_ar) between 1 and 80),
  name_en            text,
  price_halalas      int check (price_halalas is null or price_halalas > 0),      -- null = product price
  sale_price_halalas int check (sale_price_halalas is null or sale_price_halalas > 0),
  is_available       boolean not null default true,
  stock_quantity     int check (stock_quantity is null or stock_quantity >= 0),
  sort_order         int not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index product_variants_product_idx on public.product_variants(product_id, sort_order);
create trigger product_variants_updated before update on public.product_variants
  for each row execute function public.set_updated_at();

-- ───────────── Delivery ─────────────
create table public.delivery_zones (
  id                uuid primary key default gen_random_uuid(),
  name_ar           text not null check (length(name_ar) between 1 and 80),
  -- polygon: JSON array of {"lat": number, "lng": number}, at least 3 points
  polygon           jsonb not null check (jsonb_typeof(polygon) = 'array' and jsonb_array_length(polygon) >= 3),
  fee_halalas       int not null default 0 check (fee_halalas >= 0),
  min_order_halalas int not null default 0 check (min_order_halalas >= 0),
  is_active         boolean not null default false,
  sort_order        int not null default 0,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create trigger delivery_zones_updated before update on public.delivery_zones
  for each row execute function public.set_updated_at();

create table public.delivery_slots (
  id         uuid primary key default gen_random_uuid(),
  label_ar   text not null check (length(label_ar) between 1 and 60),
  weekdays   smallint[] not null check (array_length(weekdays, 1) >= 1 and weekdays <@ array[0,1,2,3,4,5,6]::smallint[]), -- 0 = Sunday
  start_time time not null,
  end_time   time not null,
  capacity   int check (capacity is null or capacity >= 0),  -- max orders per slot per date; null = unlimited
  is_active  boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint slot_time_order check (end_time > start_time)
);
create trigger delivery_slots_updated before update on public.delivery_slots
  for each row execute function public.set_updated_at();

create table public.unavailable_dates (
  id         uuid primary key default gen_random_uuid(),
  date       date not null unique,
  reason     text,
  created_at timestamptz not null default now()
);

-- ───────────── Settings ─────────────
create table public.store_settings (
  id                     boolean primary key default true check (id),
  store_name_ar          text not null default 'دَفوة',
  store_name_en          text not null default 'DAFWA',
  description            text not null default 'كوكيز طازج، بطعم يضيف دفوة لكل لحظة.',
  phone                  text not null default '0501131470',
  whatsapp_number        text not null default '966501131470',  -- international digits only, used in wa.me links
  contact_email          text,
  instagram_url          text,
  accepting_orders       boolean not null default true,
  closure_message        text not null default 'نستقبل الطلبات قريبًا بإذن الله.',
  lead_time_hours        int not null default 24 check (lead_time_hours between 1 and 720),
  booking_window_days    int not null default 21 check (booking_window_days between 1 and 120),
  max_orders_per_day     int check (max_orders_per_day is null or max_orders_per_day >= 0),
  max_items_per_order    int not null default 100 check (max_items_per_order >= 1),
  allow_partial_payment  boolean not null default false,
  announcement_primary   text not null default 'التوصيل داخل مكة المكرمة فقط',
  announcement_secondary text not null default 'الدفع والتأكيد عبر واتساب | الطلب قبل التسليم بـ 24 ساعة',
  hero_title             text not null default 'دفوة... لكل لحظة حلوة',
  hero_subtitle          text not null default 'كوكيز طازج، بطعم يضيف دفوة لكل لحظة.',
  hero_image_url         text,
  brand_story            text not null default E'بدأت حكايتنا من حبّ التفاصيل البسيطة؛ ريحة الخَبز، قطعة كوكيز مع القهوة، ولمّة ناس نحبّهم.\nومن هالشعور جت «دفوة»…\nكوكيز نطمح يكون له مكان في لحظاتكم الحلوة، ويصير جزء من جمعتكم.',
  delivery_info          text not null default 'نوصّل داخل مكة المكرمة فقط، وللأحياء المعتمدة في نطاق التوصيل. يتم تحديد رسوم التوصيل حسب المنطقة وتظهر لك قبل إرسال الطلب.',
  faqs                   jsonb not null default '[]'::jsonb check (jsonb_typeof(faqs) = 'array'),
  updated_at             timestamptz not null default now()
);
create trigger store_settings_updated before update on public.store_settings
  for each row execute function public.set_updated_at();

-- Security-sensitive settings: admin-only (never exposed publicly)
create table public.store_private_settings (
  id                        boolean primary key default true check (id),
  owner_notification_emails text[] not null default array['amelebari06@gmail.com', 'dsamimelebari@gmail.com'],
  updated_at                timestamptz not null default now()
);
create trigger store_private_settings_updated before update on public.store_private_settings
  for each row execute function public.set_updated_at();

create table public.banners (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  subtitle   text,
  image_url  text,
  link_url   text,
  cta_label  text,
  is_active  boolean not null default true,
  starts_at  timestamptz,
  ends_at    timestamptz,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger banners_updated before update on public.banners
  for each row execute function public.set_updated_at();

-- ───────────── Promotions ─────────────
create table public.promotions (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null,
  code                 text unique check (code is null or code ~ '^[A-Z0-9_-]{3,30}$'),  -- null = automatic offer
  kind                 text not null check (kind in ('percentage', 'fixed')),
  value                int not null check (value > 0),          -- percent (1-100) or halalas
  applies_to           text not null default 'order' check (applies_to in ('order', 'products', 'categories')),
  product_ids          uuid[] not null default '{}',
  category_ids         uuid[] not null default '{}',
  exclude_sale_items   boolean not null default true,           -- prevents stacking with product sale prices
  min_order_halalas    int not null default 0 check (min_order_halalas >= 0),
  max_discount_halalas int check (max_discount_halalas is null or max_discount_halalas > 0),
  max_uses             int check (max_uses is null or max_uses >= 0),
  per_customer_limit   int check (per_customer_limit is null or per_customer_limit >= 1),
  uses_count           int not null default 0 check (uses_count >= 0),
  starts_at            timestamptz,
  ends_at              timestamptz,
  is_active            boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint pct_range check (kind <> 'percentage' or value between 1 and 100),
  constraint date_order check (starts_at is null or ends_at is null or ends_at > starts_at)
);
create trigger promotions_updated before update on public.promotions
  for each row execute function public.set_updated_at();

-- ───────────── Customers & orders ─────────────
create table public.customers (
  id             uuid primary key default gen_random_uuid(),
  full_name      text not null,
  phone          text not null unique check (phone ~ '^\+9665[0-9]{8}$'),
  email          text not null,
  whatsapp       text,
  orders_count   int not null default 0,
  first_order_at timestamptz,
  last_order_at  timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create trigger customers_updated before update on public.customers
  for each row execute function public.set_updated_at();

create sequence public.order_number_seq start 1;

create table public.orders (
  id                    uuid primary key default gen_random_uuid(),
  order_number          text not null unique,
  customer_id           uuid references public.customers(id) on delete set null,
  customer_name         text not null,
  customer_phone        text not null,
  customer_email        text not null,
  customer_whatsapp     text,
  zone_id               uuid references public.delivery_zones(id) on delete set null,
  zone_name             text not null,
  neighborhood          text not null,
  latitude              numeric(9, 6) not null check (latitude between -90 and 90),
  longitude             numeric(9, 6) not null check (longitude between -180 and 180),
  building              text,
  apartment             text,
  floor                 text,
  delivery_instructions text,
  notes                 text,
  delivery_date         date not null,
  slot_id               uuid references public.delivery_slots(id) on delete set null,
  slot_label            text not null,
  delivery_start        timestamptz not null,
  delivery_end          timestamptz not null,
  status                text not null default 'pending_confirmation' check (status in
                          ('pending_confirmation', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled')),
  payment_status        text not null default 'pending_payment' check (payment_status in
                          ('pending_payment', 'paid', 'partially_paid', 'refunded')),
  amount_paid_halalas   int not null default 0 check (amount_paid_halalas >= 0),
  subtotal_halalas      int not null check (subtotal_halalas >= 0),
  discount_halalas      int not null default 0 check (discount_halalas >= 0),
  delivery_fee_halalas  int not null default 0 check (delivery_fee_halalas >= 0),
  total_halalas         int not null check (total_halalas >= 0),
  promotion_id          uuid references public.promotions(id) on delete set null,
  promo_code            text,
  idempotency_key       text not null unique check (length(idempotency_key) between 16 and 100),
  admin_notes           text,
  confirmed_at          timestamptz,
  cancelled_at          timestamptz,
  delivered_at          timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint total_consistent check (total_halalas = subtotal_halalas - discount_halalas + delivery_fee_halalas),
  constraint discount_le_subtotal check (discount_halalas <= subtotal_halalas)
);
create index orders_created_idx on public.orders(created_at desc);
create index orders_status_idx on public.orders(status);
create index orders_payment_idx on public.orders(payment_status);
create index orders_delivery_idx on public.orders(delivery_date, slot_id);
create index orders_customer_idx on public.orders(customer_id);
create index orders_phone_idx on public.orders(customer_phone);
create trigger orders_updated before update on public.orders
  for each row execute function public.set_updated_at();

-- Immutable snapshot of what was ordered and at what price
create table public.order_items (
  id                 uuid primary key default gen_random_uuid(),
  order_id           uuid not null references public.orders(id) on delete cascade,
  product_id         uuid references public.products(id) on delete set null,
  variant_id         uuid references public.product_variants(id) on delete set null,
  category_id        uuid references public.categories(id) on delete set null,
  category_name      text,
  product_name_ar    text not null,
  product_name_en    text,
  variant_name       text,
  unit_price_halalas int not null check (unit_price_halalas >= 0),
  quantity           int not null check (quantity > 0),
  line_total_halalas int not null check (line_total_halalas >= 0),
  notes              text,
  created_at         timestamptz not null default now(),
  constraint line_total_consistent check (line_total_halalas = unit_price_halalas * quantity)
);
create index order_items_order_idx on public.order_items(order_id);
create index order_items_product_idx on public.order_items(product_id);

create table public.promotion_redemptions (
  id               uuid primary key default gen_random_uuid(),
  promotion_id     uuid not null references public.promotions(id) on delete cascade,
  order_id         uuid not null references public.orders(id) on delete cascade,
  customer_phone   text not null,
  discount_halalas int not null check (discount_halalas >= 0),
  created_at       timestamptz not null default now(),
  unique (promotion_id, order_id)
);
create index promotion_redemptions_lookup on public.promotion_redemptions(promotion_id, customer_phone);

create table public.order_status_history (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders(id) on delete cascade,
  field      text not null check (field in ('status', 'payment_status')),
  from_value text,
  to_value   text not null,
  changed_by uuid,
  note       text,
  created_at timestamptz not null default now()
);
create index order_status_history_order_idx on public.order_status_history(order_id, created_at);

-- ───────────── Email outbox ─────────────
create table public.email_notifications (
  id                  uuid primary key default gen_random_uuid(),
  order_id            uuid references public.orders(id) on delete cascade,
  kind                text not null check (kind in
                        ('owner_new_order', 'customer_received', 'customer_confirmed', 'customer_out_for_delivery', 'customer_cancelled')),
  recipient           text not null,
  dedupe_key          text not null unique,        -- prevents duplicate notifications
  status              text not null default 'pending' check (status in ('pending', 'sending', 'sent', 'failed', 'dead')),
  attempts            int not null default 0,
  next_attempt_at     timestamptz not null default now(),
  last_error          text,
  provider_message_id text,                        -- Resend id = accepted by API, not proof of inbox delivery
  sent_at             timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index email_notifications_queue_idx on public.email_notifications(status, next_attempt_at);
create index email_notifications_order_idx on public.email_notifications(order_id);
create trigger email_notifications_updated before update on public.email_notifications
  for each row execute function public.set_updated_at();

-- ───────────── Anti-abuse ─────────────
create table public.rate_limits (
  key          text not null,
  window_start timestamptz not null,
  hits         int not null default 0,
  primary key (key, window_start)
);

-- Singleton rows
insert into public.store_settings (id, faqs) values (true, $json$[
  {"q": "هل توصلون خارج مكة؟", "a": "لا، التوصيل حاليًا داخل مكة المكرمة فقط، وللمناطق المعتمدة في نطاق التوصيل."},
  {"q": "كم لازم أطلب قبل موعد التسليم؟", "a": "الطلب قبل موعد التسليم بـ 24 ساعة على الأقل، عشان نخبز لك كل شي طازج."},
  {"q": "كيف أدفع؟", "a": "بعد إرسال الطلب، تتم ترتيبات الدفع والتأكيد معك عبر واتساب. الطلب لا يُعتبر مؤكدًا حتى نؤكده لك."},
  {"q": "هل الطلب يتأكد مباشرة بعد إرساله؟", "a": "لا، يوصلك بريد باستلام الطلب، وبعدها نتواصل معك عبر واتساب لتأكيد الطلب والدفع والتوصيل."}
]$json$::jsonb);
insert into public.store_private_settings (id) values (true);
