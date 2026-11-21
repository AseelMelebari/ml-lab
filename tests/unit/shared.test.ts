import { describe, it, expect } from 'vitest';
import { normalizeSaudiMobile, formatSaudiMobileLocal } from '../../shared/phone';
import { pointInPolygon, googleMapsLink, inMakkahBounds, circlePolygon, MAKKAH_CENTER, parseCoordinates } from '../../shared/geo';
import { formatSAR, sarToHalalas } from '../../shared/money';
import { checkoutSchema } from '../../shared/checkout-schema';
import { buildOrderWhatsAppMessage, whatsappLink } from '../../shared/whatsapp';
import { errorMessageAr, errorCode } from '../../shared/labels';
import { renderEmail, type EmailOrder } from '../../netlify/functions/_lib/email-templates';

describe('Saudi phone numbers', () => {
  it.each([
    ['0501131470', '+966501131470'],
    ['501131470', '+966501131470'],
    ['+966501131470', '+966501131470'],
    ['00966501131470', '+966501131470'],
    ['966 50 113 1470', '+966501131470'],
    ['٠٥٠١١٣١٤٧٠', '+966501131470'],
  ])('%s → %s', (input, out) => expect(normalizeSaudiMobile(input)).toBe(out));
  it.each(['0401131470', '05011314', '+971501131470', 'abc', ''])('rejects %s', (input) => expect(normalizeSaudiMobile(input)).toBeNull());
  it('formats for local display', () => expect(formatSaudiMobileLocal('+966501131470')).toBe('0501131470'));
});

describe('geo', () => {
  const square = [{ lat: 21.44, lng: 39.8 }, { lat: 21.44, lng: 39.86 }, { lat: 21.4, lng: 39.86 }, { lat: 21.4, lng: 39.8 }];
  it('point in polygon', () => {
    expect(pointInPolygon(MAKKAH_CENTER, square)).toBe(true);
    expect(pointInPolygon({ lat: 21.5, lng: 39.83 }, square)).toBe(false);
  });
  it('makkah bounds exclude Jeddah', () => {
    expect(inMakkahBounds(MAKKAH_CENTER)).toBe(true);
    expect(inMakkahBounds({ lat: 21.5433, lng: 39.1728 })).toBe(false);
  });
  it('builds the Google Maps link with coordinates', () => {
    expect(googleMapsLink(21.4225, 39.8262)).toBe('https://www.google.com/maps/search/?api=1&query=21.422500,39.826200');
  });
  it('circle polygon contains its centre', () => {
    expect(pointInPolygon(MAKKAH_CENTER, circlePolygon(MAKKAH_CENTER, 2))).toBe(true);
  });
  it('parses coordinates from links and text', () => {
    expect(parseCoordinates('https://www.google.com/maps/@21.4225,39.8262,15z')).toEqual({ lat: 21.4225, lng: 39.8262 });
    expect(parseCoordinates('https://maps.google.com/?q=21.4225,39.8262')).toEqual({ lat: 21.4225, lng: 39.8262 });
    expect(parseCoordinates('21.4225, 39.8262')).toEqual({ lat: 21.4225, lng: 39.8262 });
    expect(parseCoordinates('hello')).toBeNull();
  });
});

describe('money', () => {
  it('formats halalas as SAR', () => {
    expect(formatSAR(1550)).toBe('15.5 ر.س');
    expect(formatSAR(4500)).toBe('45 ر.س');
  });
  it('converts without float drift', () => {
    expect(sarToHalalas('19.99')).toBe(1999);
    expect(sarToHalalas(0.1 + 0.2)).toBe(30);
  });
});

describe('checkout validation', () => {
  const valid = {
    idempotency_key: 'ck_abcdefghijklmnop',
    customer: { name: 'سارة', phone: '0551234567', email: 'Sara@Example.com' },
    location: { lat: 21.42, lng: 39.82, neighborhood: 'العزيزية' },
    delivery: { date: '2026-12-01', slot_id: '7a0b1d6c-6f1f-4f7a-9a52-0d6c1b1a2b3c' },
    items: [{ product_id: '7a0b1d6c-6f1f-4f7a-9a52-0d6c1b1a2b3c', quantity: 2 }],
  };
  it('accepts and normalises a valid payload', () => {
    const r = checkoutSchema.parse(valid);
    expect(r.customer.phone).toBe('+966551234567');
    expect(r.customer.email).toBe('sara@example.com');
    expect(r.promo_code).toBeNull();
  });
  it('rejects bad phone / email / missing location with Arabic messages', () => {
    const bad = checkoutSchema.safeParse({ ...valid, customer: { ...valid.customer, phone: '123', email: 'x' } });
    expect(bad.success).toBe(false);
    const msgs = bad.success ? [] : bad.error.issues.map((i) => i.message);
    expect(msgs).toContain('رقم الجوال غير صحيح. مثال: 05XXXXXXXX');
    expect(msgs).toContain('البريد الإلكتروني غير صحيح');
    const noLoc = checkoutSchema.safeParse({ ...valid, location: { neighborhood: 'x' } });
    expect(noLoc.success).toBe(false);
  });
  it('rejects empty cart and honeypot', () => {
    expect(checkoutSchema.safeParse({ ...valid, items: [] }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...valid, website: 'spam' }).success).toBe(false);
  });
});

describe('error mapping', () => {
  it('maps database errors to Arabic', () => {
    expect(errorCode('DAFWA:LEAD_TIME')).toBe('LEAD_TIME');
    expect(errorMessageAr('DAFWA:OUT_OF_ZONE')).toContain('خارج نطاق التوصيل');
    expect(errorMessageAr('weird')).toContain('خطأ غير متوقع');
  });
});

const receipt = {
  order_number: 'DF-0007', customer_name: 'سارة محمد',
  items: [{ name: 'كوكيز', variant: 'بوكس 6', quantity: 2, line_total_halalas: 9000 }],
  subtotal_halalas: 9000, discount_halalas: 900, delivery_fee_halalas: 1500, total_halalas: 9600,
  neighborhood: 'العزيزية', delivery_date: '2026-12-01', slot_label: 'العصر', slot_start: '16:00', slot_end: '20:00',
  latitude: 21.4225, longitude: 39.8262,
};

describe('WhatsApp message', () => {
  it('contains all required order details', () => {
    const m = buildOrderWhatsAppMessage(receipt);
    for (const s of ['DF-0007', 'سارة محمد', 'كوكيز', 'بوكس 6', '× 2', '96 ر.س', 'العزيزية', 'العصر', 'https://www.google.com/maps/search/?api=1&query=21.422500,39.826200']) expect(m).toContain(s);
  });
  it('builds an encoded wa.me link to the business number', () => {
    const l = whatsappLink('966501131470', 'مرحبا\nسطر');
    expect(l.startsWith('https://wa.me/966501131470?text=')).toBe(true);
    expect(decodeURIComponent(l.split('text=')[1])).toBe('مرحبا\nسطر');
  });
});

describe('email templates', () => {
  const order: EmailOrder = {
    id: 'o1', order_number: 'DF-0007', customer_name: 'سارة <script>', customer_phone: '+966551234567', customer_email: 's@x.com', customer_whatsapp: null,
    neighborhood: 'العزيزية', zone_name: 'وسط مكة', building: '12', apartment: null, floor: '2', delivery_instructions: 'بجوار المسجد', notes: null,
    latitude: 21.4225, longitude: 39.8262, delivery_date: '2026-12-01', slot_label: 'العصر', delivery_start: '2026-12-01T13:00:00Z', delivery_end: '2026-12-01T17:00:00Z',
    status: 'pending_confirmation', payment_status: 'pending_payment', subtotal_halalas: 9000, discount_halalas: 900, delivery_fee_halalas: 1500, total_halalas: 9600,
    promo_code: 'SAVE10', created_at: '2026-11-21T10:00:00Z',
    items: [{ product_name_ar: 'كوكيز', variant_name: 'بوكس 6', quantity: 2, unit_price_halalas: 4500, line_total_halalas: 9000, notes: null }],
  };
  const ctx = { siteUrl: 'https://dafwa.example', whatsappDigits: '966501131470', storeName: 'دَفوة' };
  it('owner email has subject, maps link, secure admin link and escapes HTML', () => {
    const e = renderEmail('owner_new_order', order, ctx);
    expect(e.subject).toBe('🍪 طلب جديد في دفوة | Order #DF-0007');
    expect(e.html).toContain('https://www.google.com/maps/search/?api=1&amp;query=21.422500,39.826200');
    expect(e.html).toContain('فتح الموقع في خرائط Google');
    expect(e.html).toContain('https://dafwa.example/admin/orders/o1');
    expect(e.html).toContain('0551234567');
    expect(e.html).not.toContain('<script>');
    expect(e.html).toContain('dir="rtl"');
    expect(e.text).toContain('96 ر.س');
  });
  it('customer acknowledgment distinguishes receipt from confirmation', () => {
    const e = renderEmail('customer_received', order, ctx);
    expect(e.subject).toBe('دفوة | استلمنا طلبك بنجاح 🍪');
    expect(e.html).toContain('بانتظار التأكيد');
    expect(e.html).toContain('ليست تأكيدًا');
    expect(e.html).toContain('https://wa.me/966501131470');
  });
  it('renders status emails', () => {
    for (const k of ['customer_confirmed', 'customer_out_for_delivery', 'customer_cancelled']) expect(renderEmail(k, order, ctx).html).toContain('DF-0007');
  });
});
