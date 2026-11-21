-- ════════════════════════════════════════════════════════════════════
-- DAFWA | دَفوة — Supabase Storage buckets & policies
-- Images are publicly readable (they appear in the store), but only
-- admins can upload, replace or delete them. Size + type limited.
-- ════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('site-assets',    'site-assets',    true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml'])
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "dafwa images public read" on storage.objects for select to anon, authenticated
  using (bucket_id in ('product-images', 'site-assets'));

create policy "dafwa images admin insert" on storage.objects for insert to authenticated
  with check (bucket_id in ('product-images', 'site-assets') and public.is_admin());

create policy "dafwa images admin update" on storage.objects for update to authenticated
  using (bucket_id in ('product-images', 'site-assets') and public.is_admin())
  with check (bucket_id in ('product-images', 'site-assets') and public.is_admin());

create policy "dafwa images admin delete" on storage.objects for delete to authenticated
  using (bucket_id in ('product-images', 'site-assets') and public.is_admin());
