# Deployment & Configuration Guide

Follow these steps in order. Total time is about 1–2 hours. Steps marked 💳 involve a third-party account that may need billing details.

---

## 0. Costs and billing prerequisites (read first)

| Service | Free tier | When you pay |
|---|---|---|
| **Supabase** | Free plan: 500 MB DB, 1 GB storage. **Free projects pause after ~1 week of inactivity.** | Pro plan (~US$25/mo) is recommended for a real store (no pausing, daily backups). |
| **Netlify** | Free plan covers a small store (bandwidth and function limits). Scheduled functions are included. | If traffic grows past the free limits. |
| **Resend** 💳 | Free: 3,000 emails/month, 100/day. | Higher volume. Each order sends ~3 emails (2 owner + 1 customer), plus status emails. |
| **Google Maps Platform** 💳 | **A billing account (credit card) is required** even to use the free monthly usage. Dynamic Maps and Places Autocomplete have free monthly quotas. | Above the free quota. Set budget alerts (step 10). |

Prices change, so confirm on each provider's pricing page.

---

## 1. Create the Supabase project

1. Sign up at https://supabase.com → **New project**.
2. Name it `dafwa`, pick a strong DB password (store it safely), region **Middle East (e.g. `me-central-1`)** if offered, otherwise the closest EU region.
3. When ready, open **Project Settings → API** and copy:
   - `Project URL` → `VITE_SUPABASE_URL` **and** `SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (**secret, server only, never put it in a `VITE_` variable**)
4. **Project Settings → Data API**: make sure the `public` schema is exposed. On newer projects, also check that "automatically expose new tables" or the default grants are enabled. All tables are protected by RLS either way.

## 2–3. Configure the database (run migrations)

**Option A: SQL Editor (no tools needed).** In the Supabase dashboard → **SQL Editor**, run each file **in this order**, pasting the full contents:

1. `supabase/migrations/20261121000001_schema.sql`
2. `supabase/migrations/20261121000002_functions.sql`
3. `supabase/migrations/20261121000003_security.sql`
4. `supabase/migrations/20261121000004_storage.sql`

**Option B: Supabase CLI.**
```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

Check: **Table Editor** shows `products`, `orders` and so on, and `store_settings` has one row. The owner notification emails are pre-filled in `store_private_settings` with amelebari06@gmail.com and dsamimelebari@gmail.com.

## 4. Storage

Migration 4 creates two **public-read** buckets, `product-images` and `site-assets` (5 MB per file, images only). Only admins can upload, replace or delete. Check under **Storage**. Nothing else is required.

## 5–6. Admin authentication and the first admin user

1. **Authentication → Providers → Email**: enabled. Turn **off** "Allow new users to sign up" (**Authentication → Sign In / Providers**) so nobody can self-register. Admin access also requires a row in `admin_roles`, so even a self-registered user could not see orders.
2. **Authentication → URL Configuration**: set **Site URL** to your production URL (e.g. `https://dafwa.sa`) and add `https://YOUR-SITE/admin` to **Redirect URLs** (used by "forgot password").
3. **Authentication → Users → Add user → Create new user**: owner email + a strong password (12+ characters), tick **Auto Confirm**.
4. **SQL Editor**: run `supabase/snippets/create-admin.sql` with that email filled in.
5. Repeat for each person who should manage the store.

## 7–9. Resend (email) 💳

1. Sign up at https://resend.com.
2. **Domains → Add domain**. Use a domain you own (e.g. `dafwa.sa`, or a subdomain like `mail.dafwa.sa`). Add the DNS records Resend shows (SPF, DKIM, optionally DMARC) at your DNS provider. Wait until the status is **Verified**.
   - Without a verified domain, Resend only sends to your own account email, so **customer emails will fail**. A verified domain is required for launch.
3. **API Keys → Create API key** (permission: *Sending access*) → `RESEND_API_KEY`.
4. Set `RESEND_FROM`, e.g. `دَفوة DAFWA <orders@dafwa.sa>` (must use the verified domain).
5. Owner recipients: already set to both owner addresses. You can change them any time in **Admin → إعدادات المتجر → مستلمو إشعارات الطلبات الجديدة**.
6. Optional: `EMAIL_LOGO_URL=https://YOUR-SITE/brand/logo.png` to show the logo in emails. Without it, emails use an elegant text wordmark.

## 10. Google Maps 💳

1. https://console.cloud.google.com → create a project `dafwa`, then **attach a billing account**.
2. **APIs & Services → Library**, enable:
   - **Maps JavaScript API** (map + delivery zone drawing)
   - **Places API (New)** (address search box; optional but recommended)
3. **Credentials → Create credentials → API key** → **Edit**:
   - **Application restrictions → Websites**: add `https://YOUR-DOMAIN/*`, `https://*.netlify.app/*` (or your exact Netlify URL) and `http://localhost:*/*` for development.
   - **API restrictions → Restrict key** → choose *Maps JavaScript API* and *Places API (New)* only.
4. Put the key in `VITE_GOOGLE_MAPS_API_KEY`. This key is visible in the browser by design; the referrer and API restrictions are what protect it.
5. **Billing → Budgets & alerts**: create a monthly budget (e.g. US$10) with email alerts.

Without a key the site still works. Checkout falls back to **"use my current location"** or pasting a Google Maps link, and the server still validates the delivery zone. The admin zone editor then offers a circle/coordinates tool instead of map drawing.

## 11. Netlify environment variables

Netlify → **Site configuration → Environment variables** → add:

| Variable | Scope | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | Builds | public |
| `VITE_SUPABASE_ANON_KEY` | Builds | public (RLS-protected) |
| `VITE_GOOGLE_MAPS_API_KEY` | Builds | public, referrer-restricted |
| `VITE_SITE_URL` | Builds | e.g. `https://dafwa.sa` |
| `SUPABASE_URL` | Functions | |
| `SUPABASE_SERVICE_ROLE_KEY` | Functions | **secret** |
| `RESEND_API_KEY` | Functions | **secret** |
| `RESEND_FROM` | Functions | verified sender |
| `SITE_URL` | Functions | used in email links |
| `RATE_LIMIT_SALT` | Functions | any long random string |
| `EMAIL_LOGO_URL` | Functions | optional |

Mark secrets as **"Contains secret values"**. `VITE_*` variables are compiled into the build, so redeploy after changing them.

## 12–13. Build and deploy

1. Push this repository to GitHub.
2. Netlify → **Add new site → Import an existing project** → choose the repo.
3. Build settings come from `netlify.toml` (`npm run build`, publish `dist`, functions `netlify/functions`, Node 20).
4. Deploy. Then check **Logs → Functions**: you should see `create-order`, `order-receipt`, `email-dispatch`, `email-scheduled` (marked *Scheduled*, every 5 minutes) and `sitemap`.

Local full-stack: `npx netlify dev` (reads `.env`) → http://localhost:8888.

## 14. Custom domain (optional)

Netlify → **Domain management → Add a domain** → follow the DNS instructions. HTTPS is automatic. Then update: `VITE_SITE_URL`, `SITE_URL`, Supabase **Site URL / Redirect URLs**, and the Google Maps key **Website restrictions**. Redeploy.

## 15–20. Live testing (do all before announcing)

First, in the admin dashboard: add 1 product, 1 **active** delivery zone (with its fee), and at least 1 delivery slot. Until then checkout shows "الطلب عبر الموقع غير متاح بعد".

| # | Test | Expected |
|---|---|---|
| 15 | Place an order on your phone (Makkah location in zone, date ≥ 24 h ahead) | Order-received page with number `DF-0001`; order appears in **Admin → الطلبات** with status *بانتظار التأكيد* / *بانتظار الدفع* |
| 15b | Choose a location outside the zone | Red "خارج نطاق التوصيل" message; server refuses |
| 15c | Try a slot < 24 h away | Disabled ("أقل من 24 ساعة"); server refuses if forced |
| 16 | Check **both** owner inboxes (and spam folders) | "🍪 طلب جديد في دفوة \| Order #DF-0001" with Google Maps button and admin link |
| 17 | Check customer inbox | "دفوة \| استلمنا طلبك بنجاح 🍪" |
| 17b | In admin, set the order to **مؤكد**, then **في الطريق إليك**, then **ملغي** | Customer receives each status email; **Admin → إشعارات البريد** shows them as "قُبل للإرسال" |
| 18 | Tap **المتابعة عبر واتساب** | WhatsApp opens to 0501131470 with the full Arabic summary pre-filled |
| 19 | Tap the map links (email, WhatsApp message, admin) | Google Maps opens exactly at the chosen pin |
| 20 | **Admin → تحليلات المبيعات** | Counts match; cancelled order excluded from sales; collected = 0 until you mark *مدفوع* |

Delete test orders? Orders are intentionally not deletable from the app. Cancel them instead (they are excluded from sales), or remove them in the Supabase Table Editor before launch, together with their `order_items`, `email_notifications` and `order_status_history` rows (they cascade when the order is deleted). To restart numbering at DF-0001: `alter sequence order_number_seq restart with 1;`.
