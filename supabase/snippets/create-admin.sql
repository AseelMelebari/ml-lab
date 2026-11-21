-- Grant store-admin access to an existing Supabase Auth user.
-- 1) Create the user first: Supabase Dashboard → Authentication → Users → "Add user"
--    (email + strong password, tick "Auto Confirm User").
-- 2) Replace the email below and run this in the SQL Editor.
insert into public.admin_roles (user_id, role)
select id, 'owner' from auth.users where email = 'REPLACE_WITH_ADMIN_EMAIL'
on conflict (user_id) do nothing;

-- Check:
select u.email, r.role from public.admin_roles r join auth.users u on u.id = r.user_id;

-- To remove an admin:
-- delete from public.admin_roles where user_id = (select id from auth.users where email = '...');
