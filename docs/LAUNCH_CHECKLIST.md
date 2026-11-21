# Production Launch Checklist

### Brand & content
- [ ] Put the **official logo** at `public/brand/logo.png` (and optional `logo-light.png` for the dark footer). See `public/brand/README.md`.
- [ ] Add `public/brand/og-image.png` (1200×630) for WhatsApp/social previews; optionally replace `public/favicon.svg`.
- [ ] Set `EMAIL_LOGO_URL` so emails show the logo.
- [ ] Upload a real hero photo (Admin → إعدادات المتجر → صورة الواجهة), or keep the illustrated default.
- [ ] Add real products: names, **real prices**, photos, and **real ingredients and allergens**.
- [ ] Review the FAQ text (Admin → الإعدادات).
- [ ] Add the Instagram link if you have one.
- [ ] **Privacy policy (`/privacy`) must be reviewed by the owner**, ideally with legal advice under the Saudi PDPL. It is marked as a draft on the page; remove the yellow notice in `src/pages/Privacy.tsx` after review.

### Operations
- [ ] Draw and **activate delivery zones** inside Makkah with your **real delivery fees**.
- [ ] Add delivery time slots, daily and per-slot capacity, and upcoming holidays.
- [ ] Confirm the lead time (24 h) and booking window.
- [ ] Confirm the owner notification emails (both pre-filled).

### Infrastructure
- [ ] Supabase: migrations applied, **sign-ups disabled**, admin user(s) added via `create-admin.sql`, Site URL and Redirect URLs set.
- [ ] Supabase: consider the Pro plan (no pausing, backups).
- [ ] Resend: domain **verified**; `RESEND_FROM` uses it.
- [ ] Google Maps: billing attached, key restricted (referrers + 2 APIs), budget alert set.
- [ ] Netlify: all env variables set (secrets marked secret), deploy green, `email-scheduled` listed as a scheduled function.
- [ ] Custom domain and HTTPS; all URLs updated (see DEPLOYMENT §14).

### Verification (DEPLOYMENT §15–20)
- [ ] Test order end-to-end on a phone.
- [ ] Both owners received the email (check spam; mark "not spam").
- [ ] Customer acknowledgment + confirmed / out-for-delivery / cancelled emails.
- [ ] WhatsApp message opens correctly with the full summary.
- [ ] Map links open the right location.
- [ ] Analytics numbers match the test orders.
- [ ] Clean up test orders and reset numbering (`alter sequence order_number_seq restart with 1;`).
- [ ] Submit `https://YOUR-DOMAIN/sitemap.xml` to Google Search Console.
