# Architecture & Decisions

## Overview

```
Browser (React SPA, RTL)                         Netlify Functions (Node, server-only secrets)
 ├─ public pages ── anon key ──► Supabase REST   ├─ POST /api/create-order  ─► rpc dafwa_create_order (service role)
 │    (RLS: published catalogue, settings,       │                            └─► processOutbox() → Resend
 │     active zones/slots only)                  ├─ POST /api/order-receipt ─► rpc dafwa_order_receipt(id, key)
 ├─ rpc dafwa_get_availability / dafwa_quote     ├─ POST /api/email-dispatch (admin JWT) ─► processOutbox()
 └─ /admin ── Supabase Auth JWT ──► REST + RLS   ├─ email-scheduled (cron */5) ─► processOutbox()
      (is_admin() on every policy)               └─ GET /sitemap.xml
```

### Key decisions

1. **Business rules live in PostgreSQL** (`20261121000002_functions.sql`), so pricing, zone detection, the lead-time rule, slot and day capacity, promotions, stock and order creation run in **one transaction** with trusted `now()`. The browser and the function cannot disagree with the database, and concurrency is handled where the data lives.
   - `dafwa_price_cart` is the *single* pricing implementation, used both for live quotes (read-only) and for order creation (with `FOR UPDATE` on the promotion row).
   - Capacity: `pg_advisory_xact_lock(hash('dafwa-day:'||date))` serialises checkouts for the same delivery date, so two simultaneous orders cannot both take the last slot.
   - Idempotency: the browser generates an `idempotency_key` per checkout (kept in `sessionStorage` until success). It is `UNIQUE` on `orders` and guarded by an advisory lock, so double-clicks, retries and network replays return the same order.
2. **Money is integer halalas** everywhere (`*_halalas int`). Constraints enforce `total = subtotal − discount + delivery_fee` and `discount ≤ subtotal`, so a total can never be negative.
3. **Immutable snapshots**: `order_items` stores product and variant names, category, unit price and line total. A trigger forbids changing an order's monetary fields, number, coordinates or key after creation.
4. **Makkah-only is enforced three times**: (a) a hard bounding box `dafwa_in_makkah_bounds` (lat 21.15–21.75, lng 39.55–40.15) that zone polygons cannot leave (trigger); (b) the point must be inside an **active, owner-drawn** zone polygon (`dafwa_point_in_polygon`); (c) the frontend shows the same check live. Nothing is serviceable until the owner draws and activates zones.
5. **Orders are only created by the server**: `dafwa_create_order` is executable only by `service_role`. Anonymous users have no table access to orders or customers at all.
6. **Email outbox**: order creation inserts `email_notifications` rows **inside the same transaction** (2 owner rows + 1 customer row). Status changes enqueue customer emails via trigger. Sending happens afterwards (inline attempt + 5-minute cron), with:
   - `FOR UPDATE SKIP LOCKED` claiming (no double sends between workers),
   - a `dedupe_key` unique per order/kind/recipient (no duplicate notifications), plus Resend's `Idempotency-Key`,
   - exponential backoff (2, 4, 8, 16, 32 min), at most 6 attempts → `dead`, retriable from the dashboard,
   - `sent` meaning *accepted by Resend*; the UI says this explicitly.
   If email fails, the order is already committed.
7. **WhatsApp**: the confirmation page builds a `wa.me/966501131470?text=…` link with the Arabic summary (order number, name, items, quantities, total, neighbourhood, date/time, Google Maps link). The order is never marked confirmed or paid automatically.
8. **Receipt privacy**: the confirmation page re-fetches its data only with *both* the order UUID and the secret idempotency key from the same browser session. There is no public order lookup.
9. **Admin bundle split**: `/admin` (and Recharts) are lazy-loaded chunks; customers never download them.

## Security model

| Data | anon | authenticated non-admin | admin | service role (functions) |
|---|---|---|---|---|
| Published products, images, variants, categories, banners, active zones/slots, public settings | read | read | full | full |
| Promotions (codes) | — | — | full | full |
| Orders / items / customers / history / emails | — | — | read + update workflow columns only | full |
| `store_private_settings` (owner emails) | — | — | read/update | full |
| Delete orders | — | — | **no** | yes |

- `revoke execute on all functions … from anon, authenticated`, then explicit grants (Supabase grants EXECUTE by default).
- Column-level `GRANT UPDATE` on `orders` limits admins to status, payment and notes fields; triggers keep money immutable.
- Storage: public read; insert, update and delete require `is_admin()`. Buckets enforce 5 MB and image MIME types.
- Rate limits (Postgres-backed, IP hashed with `RATE_LIMIT_SALT`): 10 checkout attempts / 10 min / IP, 6 / hour / phone; receipts 60 / 10 min. Plus a honeypot field.
- Logs contain event codes and order numbers only, no names, phones, emails or addresses.
- Security headers in `netlify.toml` (frame deny, nosniff, referrer policy, geolocation self). `/admin` is `noindex`.
- CSV exports escape formula-leading cells (`= + - @`) against spreadsheet injection.
- Admin search sanitises PostgREST filter characters.

## Analytics definitions (`dafwa_sales_report`)

| Metric | Definition |
|---|---|
| Period basis | Order **creation** time in Asia/Riyadh (the orders page can also filter by delivery date) |
| Orders (total) | All orders in range matching filters |
| Successful orders | `status <> 'cancelled'` |
| Units sold | Σ quantity of order items in successful orders (restricted to the category when filtered) |
| Gross sales | Σ subtotal (successful) |
| Discounts | Σ discount (successful) |
| **Net sales** | Gross − discounts (excludes delivery fees) |
| Delivery charges | Σ delivery fee (successful) |
| Total billed | Net sales + delivery |
| **Collected** | Σ `amount_paid` of successful orders with payment *paid* / *partially paid* |
| Unpaid value | Σ (total − amount_paid) of successful orders with payment *pending* / *partially paid* |
| Average order value | mean total of successful orders |
| Weeks | Start on **Sunday** (Saudi week) |

`amount_paid_halalas` is set automatically: *paid* → total, *pending*/*refunded* → 0, *partially paid* → the amount the admin enters (must be between 0 and total, and requires the setting).

## Testing approach

`tests/sql/*` loads the **real migrations** into PGlite (Postgres 16 compiled to WASM) with minimal stubs for Supabase's `auth`, `storage` and roles, then exercises the functions and RLS by switching roles (`anon`, `authenticated` with a JWT `sub`). PGlite is single-connection, so true parallel transactions are not exercised. The capacity and idempotency guarantees rely on Postgres advisory locks and unique constraints, which behave identically on Supabase.
