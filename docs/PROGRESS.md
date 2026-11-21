# Implementation Status

_Last updated: 2026-11-21_

## Phases

| Phase | Status |
|---|---|
| 1 Foundation: Vite/React/TS/Tailwind, design system (cocoa/cream/caramel, Alexandria + IBM Plex Sans Arabic + Cormorant), routing, responsive nav, logo slot | ✅ |
| 2 Customer site: Home (announcement bar, hero, featured, story, how-to-order, bestsellers, banners, delivery, FAQ, WhatsApp/Instagram), Shop (search, categories, sort, filters), Product (gallery, variants, qty, ingredients/allergens, notes), Cart (drawer + page), About, Contact, Privacy, 404 | ✅ |
| 3 Supabase: schema, migrations, RLS, grants, storage buckets/policies, admin roles | ✅ |
| 4 Ordering: checkout, Google Maps picker (fixed-pin, search, geolocation, fallback), zone validation, 24 h rule, slots/holidays/closure/capacity, transactional idempotent order creation, WhatsApp hand-off | ✅ |
| 5 Email: Resend templates (owner, customer receipt, confirmed, out for delivery, cancelled), durable outbox, retries, dedupe, logging, admin view | ✅ |
| 6 Admin: overview + setup checklist, products (photos upload/order/replace/delete, variants, stock, archive), categories, orders (filters, CSV, detail, status/payment, history, maps, WhatsApp), customers, promotions + banners, delivery (zone drawing, slots, dates, capacity, pause), emails, settings | ✅ |
| 7 Analytics: SQL report (summary, time series by day/week/month/year, products, categories), filters, charts, data table, CSV | ✅ |
| 8 Production readiness: security review, tests, perf (code-split admin/charts), SEO (meta, OG, JSON-LD, sitemap, robots), Netlify config, docs | ✅ |

## Verified in this environment

- `npm run build` (TypeScript strict + Vite production build): **passes**.
- `npm test`: **59 tests pass**.
  - 31 database tests on the real migrations (PGlite Postgres): pricing from DB, sale/variant prices, promo codes (percentage, expired, unknown, minimum, max-uses, no negative totals), zone detection incl. Jeddah rejection and out-of-zone-in-Makkah rejection, 24 h lead time, unavailable dates, booking window, slot and daily capacity, customer field validation, idempotency, price snapshots surviving price changes, stock decrement/restore, closed store, status history, status emails queued once, money immutability, partial-payment rules, cancelled-is-final, outbox claim/backoff, RLS for anon / non-admin / admin, privileged-function grants, analytics correctness (cancelled excluded, unpaid not collected).
  - 28 unit tests: Saudi phone normalisation (incl. Arabic digits), point-in-polygon, Google Maps link format, coordinate parsing, SAR formatting, checkout schema (Arabic messages, honeypot), error mapping, WhatsApp message content and link, email templates (subjects, maps link, admin link, HTML escaping, RTL, receipt ≠ confirmation wording).
- All 5 Netlify functions bundle with esbuild.
- Visual check (Playwright, desktop 1440 px and mobile 390 px, with **test-only fixture responses**): home, shop, product, cart drawer, checkout (incl. validation errors), admin overview/orders/analytics/login. No console errors, no horizontal overflow. Fixed during this check: hero cookie positioning, RTL off-canvas drawer causing horizontal scroll, nested form, a `useEffect` returning a Promise.

## Not testable here (needs your credentials)

- Real Supabase project (migrations are tested on PGlite with Supabase-shaped stubs; run them on your project per DEPLOYMENT.md).
- Real email delivery via Resend (both owner inboxes, customer emails).
- Google Maps rendering, Places search, and zone drawing with a real API key.
- Netlify production deploy, scheduled function execution.
- Real WhatsApp hand-off on a phone.
- True concurrent requests against a multi-connection Postgres (logic relies on advisory locks + unique constraints).
- Admin photo upload to Supabase Storage.

## Known limitations

- **No real logo yet**: the official logo was not attached. A typographic wordmark is shown until `public/brand/logo.png` is added.
- **No product data**, by design (no invented products, prices, fees, ingredients or policies). Delivery zones and slots must be configured before checkout opens.
- SEO: the SPA sets per-page titles, meta and JSON-LD client-side. Google renders JS, but some social crawlers only see the default `index.html` meta for product pages.
- The marketing text "24 ساعة" in the announcement bar is editable but does not auto-update if the lead time changes (a warning shows in Delivery settings).
- One promotion per order (no stacking), by design.
- Hero and illustrations are SVG artwork, not photography. Upload real photos via the dashboard.
- No Content-Security-Policy header yet (Google Maps requires a carefully tuned CSP). Recommended after launch.
- Customers cannot track an order online. Status updates arrive by email and WhatsApp (a tracking page could be added later).
