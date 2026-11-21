-- ════════════════════════════════════════════════════════════════════
-- DAFWA | دَفوة — Row Level Security, grants and storage
-- Public visitors (anon) can only READ published catalogue data and public
-- settings. All order/customer data is admin-only. Orders are created only
-- by the server (service role) through dafwa_create_order().
-- ════════════════════════════════════════════════════════════════════

alter table public.admin_roles            enable row level security;
alter table public.categories             enable row level security;
alter table public.products               enable row level security;
alter table public.product_images         enable row level security;
alter table public.product_variants       enable row level security;
alter table public.delivery_zones         enable row level security;
alter table public.delivery_slots         enable row level security;
alter table public.unavailable_dates      enable row level security;
alter table public.store_settings         enable row level security;
alter table public.store_private_settings enable row level security;
alter table public.banners                enable row level security;
alter table public.promotions             enable row level security;
alter table public.customers              enable row level security;
alter table public.orders                 enable row level security;
alter table public.order_items            enable row level security;
alter table public.promotion_redemptions  enable row level security;
alter table public.order_status_history   enable row level security;
alter table public.email_notifications    enable row level security;
alter table public.rate_limits            enable row level security;

-- Admin roles: an admin can see who the admins are; nobody writes from the client.
create policy admin_roles_read on public.admin_roles for select to authenticated using (public.is_admin());

-- Catalogue: public reads published rows, admins manage everything.
create policy categories_public_read on public.categories for select to anon, authenticated using (is_active or public.is_admin());
create policy categories_admin_write on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy products_public_read on public.products for select to anon, authenticated
  using ((is_active and not is_archived) or public.is_admin());
create policy products_admin_write on public.products for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy product_images_public_read on public.product_images for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.is_active and not p.is_archived) or public.is_admin());
create policy product_images_admin_write on public.product_images for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy product_variants_public_read on public.product_variants for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.is_active and not p.is_archived) or public.is_admin());
create policy product_variants_admin_write on public.product_variants for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Delivery configuration: active zones/slots are public (needed to show the service area).
create policy delivery_zones_public_read on public.delivery_zones for select to anon, authenticated using (is_active or public.is_admin());
create policy delivery_zones_admin_write on public.delivery_zones for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy delivery_slots_public_read on public.delivery_slots for select to anon, authenticated using (is_active or public.is_admin());
create policy delivery_slots_admin_write on public.delivery_slots for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy unavailable_dates_public_read on public.unavailable_dates for select to anon, authenticated using (true);
create policy unavailable_dates_admin_write on public.unavailable_dates for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Settings
create policy store_settings_public_read on public.store_settings for select to anon, authenticated using (true);
create policy store_settings_admin_update on public.store_settings for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy store_private_settings_admin on public.store_private_settings for select to authenticated using (public.is_admin());
create policy store_private_settings_admin_update on public.store_private_settings for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy banners_public_read on public.banners for select to anon, authenticated
  using ((is_active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now())) or public.is_admin());
create policy banners_admin_write on public.banners for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Promotions: never listed publicly (codes are secret); validated via dafwa_quote().
create policy promotions_admin on public.promotions for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy promotion_redemptions_admin on public.promotion_redemptions for select to authenticated using (public.is_admin());

-- Customer & order data: admins only. No delete policies → orders can't be deleted from the app.
create policy customers_admin_read on public.customers for select to authenticated using (public.is_admin());
create policy customers_admin_update on public.customers for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy orders_admin_read on public.orders for select to authenticated using (public.is_admin());
create policy orders_admin_update on public.orders for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy order_items_admin_read on public.order_items for select to authenticated using (public.is_admin());
create policy order_status_history_admin_read on public.order_status_history for select to authenticated using (public.is_admin());
create policy email_notifications_admin_read on public.email_notifications for select to authenticated using (public.is_admin());
-- rate_limits: no policies → inaccessible to anon/authenticated.

-- Column-level hardening: admins may only change workflow fields on orders.
revoke update on public.orders from anon, authenticated;
grant update (status, payment_status, amount_paid_halalas, admin_notes, neighborhood, building, apartment, floor,
              delivery_instructions, customer_name, customer_email, customer_whatsapp) on public.orders to authenticated;
revoke insert, delete on public.orders, public.order_items, public.customers, public.order_status_history,
                         public.email_notifications, public.promotion_redemptions from anon, authenticated;
revoke all on public.rate_limits from anon, authenticated;
revoke all on public.store_private_settings from anon;

-- ───────────── Function privileges ─────────────
-- Supabase grants EXECUTE to anon/authenticated by default; lock everything down
-- and grant back only what each role needs.
revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.dafwa_get_availability() to anon, authenticated;
grant execute on function public.dafwa_quote(jsonb, text, double precision, double precision) to anon, authenticated;
grant execute on function public.dafwa_sales_report(date, date, text[], text[], uuid, text) to authenticated;
grant execute on function public.dafwa_admin_overview() to authenticated;
grant execute on function public.dafwa_retry_email(uuid) to authenticated;

grant execute on function public.dafwa_create_order(jsonb) to service_role;
grant execute on function public.dafwa_order_receipt(uuid, text) to service_role;
grant execute on function public.dafwa_rate_limit_hit(text, int, int) to service_role;
grant execute on function public.dafwa_claim_emails(int, uuid) to service_role;
grant execute on function public.dafwa_complete_email(uuid, boolean, text, text, boolean) to service_role;
grant execute on function public.dafwa_price_cart(jsonb, text, uuid, text, boolean) to service_role;
