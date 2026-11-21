# DAFWA | دَفوة — Premium Cookie Store (Makkah)

Arabic-first (RTL) e-commerce platform for **دَفوة DAFWA**, a premium cookie brand in Makkah.
Customers order online (Makkah only, at least 24 h ahead) and complete confirmation and payment on **WhatsApp**.
The owner runs the whole business from a private dashboard at **`/admin`**: products, photos, prices, promotions, orders, delivery zones and schedules, emails, and sales analytics. No code edits are needed for day-to-day changes.

| | |
|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS, Lucide icons, Recharts (admin only) |
| Database / Auth / Files | Supabase (PostgreSQL + Row Level Security, Auth, Storage) |
| Server logic | Postgres functions (pricing, zones, 24 h rule, capacity, order creation) + Netlify Functions (API, email) |
| Email | Resend (durable outbox + retries) |
| Maps | Google Maps JavaScript API + Places API (New) |
| Hosting | Netlify |

## Quick start (local)

```bash
npm install
cp .env.example .env    # fill in values — see docs/DEPLOYMENT.md
npm run dev             # customer site + admin UI on http://localhost:5173 (no Netlify Functions)
npx netlify dev         # full stack incl. /api/* functions on http://localhost:8888
npm test                # 59 tests: business rules on a real embedded Postgres + shared logic
npm run build           # type-check + production build
```

## Documentation

- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**: step-by-step setup for Supabase, Resend, Google Maps and Netlify, the domain, and live testing
- **[docs/ADMIN_GUIDE.md](docs/ADMIN_GUIDE.md)**: daily use of the dashboard (Arabic + English)
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**: design decisions, security model, analytics definitions
- **[docs/LAUNCH_CHECKLIST.md](docs/LAUNCH_CHECKLIST.md)**: what must be done before going live
- **[docs/PROGRESS.md](docs/PROGRESS.md)**: implementation status, test results, known limitations

## Project structure

```
index.html, netlify.toml, vite.config.ts, tailwind.config.js, .env.example
public/                 robots.txt, favicon.svg, brand/ (← put the official logo here)
shared/                 code used by BOTH browser and server: phone, geo, money, dates, labels, WhatsApp, checkout schema
src/
  components/           Layout (announcement bar, header, footer), CartDrawer, ProductCard, MapPicker, Logo, CookieArt, ui
  context/              Store (settings/catalogue), Cart (localStorage), Toast
  lib/                  supabase client, api, types, seo, maps loader, image optimisation
  pages/                Home, Shop, ProductPage, Cart, Checkout, OrderReceived, About, Contact, Privacy, NotFound
  admin/                AdminApp (auth gate + layout) and pages/: Overview, Orders, OrderDetail, Products, ProductEditor,
                        Categories, Customers, Promotions (+banners), Delivery, Analytics, Emails, Settings
netlify/functions/      create-order, order-receipt, email-dispatch, email-scheduled (cron), sitemap, _lib/ (email templates, outbox)
supabase/migrations/    schema → business functions → RLS & grants → storage
supabase/snippets/      create-admin.sql
tests/                  sql/ (PGlite real-Postgres tests of migrations) and unit/
```
