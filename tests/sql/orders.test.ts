import { describe, it, expect, beforeAll } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import { createDb, asRole } from './db';

// Polygon roughly around central Makkah (Al-Haram area)
const ZONE = [
  { lat: 21.44, lng: 39.80 },
  { lat: 21.44, lng: 39.86 },
  { lat: 21.40, lng: 39.86 },
  { lat: 21.40, lng: 39.80 },
];
const INSIDE = { lat: 21.4225, lng: 39.8262 };
const OUTSIDE_ZONE_IN_MAKKAH = { lat: 21.35, lng: 39.95 };
const JEDDAH = { lat: 21.5433, lng: 39.1728 };

let db: PGlite;
let productId: string;
let saleProductId: string;
let variantProductId: string;
let variantId: string;
let stockProductId: string;
let slotId: string;
let fullSlotId: string;
let adminId = '11111111-1111-1111-1111-111111111111';
let k = 0;

async function q<T = any>(sql: string, params: any[] = []) {
  return (await db.query<T>(sql, params)).rows;
}
async function dayOffset(n: number) {
  return (await q<{ d: string }>(`select (dafwa_riyadh_today() + $1::int)::text as d`, [n]))[0].d;
}
function key() {
  return `test-idempotency-key-${Date.now()}-${++k}`;
}
async function order(overrides: Record<string, any> = {}, dateOffset = 3) {
  const payload = {
    idempotency_key: key(),
    customer: { name: 'سارة محمد', phone: '+966551234567', email: 'Sara@Example.com' },
    location: { ...INSIDE, neighborhood: 'العزيزية', instructions: 'بجوار المسجد' },
    delivery: { date: await dayOffset(dateOffset), slot_id: slotId },
    items: [{ product_id: productId, quantity: 2 }],
    ...overrides,
  };
  const rows = await q<{ r: any }>(`select dafwa_create_order($1::jsonb) as r`, [JSON.stringify(payload)]);
  return { result: rows[0].r, payload };
}
async function expectError(p: Promise<unknown>, code: string) {
  await expect(p).rejects.toThrow(`DAFWA:${code}`);
}

beforeAll(async () => {
  db = await createDb();
  await q(`insert into auth.users (id, email) values ($1, 'owner@test')`, [adminId]);
  await q(`insert into admin_roles (user_id) values ($1)`, [adminId]);
  const [cat] = await q(`insert into categories (name_ar, slug) values ('كلاسيك', 'classic') returning id`);
  [{ id: productId }] = await q(
    `insert into products (slug, name_ar, price_halalas, category_id) values ('p1', 'كوكيز تجريبي', 1500, $1) returning id`, [cat.id]);
  [{ id: saleProductId }] = await q(
    `insert into products (slug, name_ar, price_halalas, sale_price_halalas) values ('p2', 'منتج مخفض', 2000, 1600) returning id`);
  [{ id: variantProductId }] = await q(
    `insert into products (slug, name_ar, price_halalas) values ('p3', 'بوكس', 5000) returning id`);
  [{ id: variantId }] = await q(
    `insert into product_variants (product_id, name_ar, price_halalas) values ($1, 'بوكس 12', 9000) returning id`, [variantProductId]);
  [{ id: stockProductId }] = await q(
    `insert into products (slug, name_ar, price_halalas, stock_quantity) values ('p4', 'كمية محدودة', 1000, 3) returning id`);
  await q(`insert into delivery_zones (name_ar, polygon, fee_halalas, is_active) values ('وسط مكة', $1::jsonb, 1500, true)`, [JSON.stringify(ZONE)]);
  [{ id: slotId }] = await q(
    `insert into delivery_slots (label_ar, weekdays, start_time, end_time, capacity) values ('العصر', '{0,1,2,3,4,5,6}', '16:00', '20:00', 50) returning id`);
  [{ id: fullSlotId }] = await q(
    `insert into delivery_slots (label_ar, weekdays, start_time, end_time, capacity) values ('الليل', '{0,1,2,3,4,5,6}', '20:00', '23:00', 1) returning id`);
  await q(`insert into promotions (name, code, kind, value) values ('خصم 10', 'SAVE10', 'percentage', 10)`);
  await q(`insert into promotions (name, code, kind, value, ends_at) values ('منتهي', 'OLD', 'fixed', 500, now() - interval '1 day')`);
  await q(`insert into promotions (name, code, kind, value, max_uses) values ('مرة', 'ONCE', 'fixed', 300, 1)`);
  await q(`insert into promotions (name, code, kind, value) values ('كبير', 'HUGE', 'fixed', 999999)`);
  await q(`insert into promotions (name, code, kind, value, min_order_halalas) values ('حد أدنى', 'MIN', 'fixed', 100, 100000)`);
});

describe('zones', () => {
  it('rejects zone polygons outside Makkah', async () => {
    await expectError(
      q(`insert into delivery_zones (name_ar, polygon) values ('جدة', $1::jsonb)`,
        [JSON.stringify([JEDDAH, { lat: 21.55, lng: 39.18 }, { lat: 21.53, lng: 39.19 }])]),
      'ZONE_OUTSIDE_MAKKAH');
  });
  it('finds active zone by coordinates', async () => {
    const r = await q(`select (dafwa_find_zone($1, $2)).name_ar as n`, [INSIDE.lat, INSIDE.lng]);
    expect(r[0].n).toBe('وسط مكة');
    const r2 = await q(`select (dafwa_find_zone($1, $2)).id as id`, [OUTSIDE_ZONE_IN_MAKKAH.lat, OUTSIDE_ZONE_IN_MAKKAH.lng]);
    expect(r2[0].id).toBeNull();
  });
});

describe('pricing', () => {
  it('prices from the database, ignoring any client price', async () => {
    const r = await q(`select dafwa_quote($1::jsonb) as r`,
      [JSON.stringify([{ product_id: productId, quantity: 3, unit_price_halalas: 1 }])]);
    expect(r[0].r.subtotal_halalas).toBe(4500);
    expect(r[0].r.total_halalas).toBe(4500);
  });
  it('uses sale price and variant price', async () => {
    const r = await q(`select dafwa_quote($1::jsonb) as r`, [JSON.stringify([
      { product_id: saleProductId, quantity: 1 },
      { product_id: variantProductId, variant_id: variantId, quantity: 1 },
    ])]);
    expect(r[0].r.subtotal_halalas).toBe(1600 + 9000);
  });
  it('requires a variant when the product has variants', async () => {
    await expectError(q(`select dafwa_quote($1::jsonb)`, [JSON.stringify([{ product_id: variantProductId, quantity: 1 }])]), 'VARIANT_REQUIRED');
  });
  it('applies percentage code, excluding sale items by default', async () => {
    const r = await q(`select dafwa_quote($1::jsonb, 'save10') as r`, [JSON.stringify([
      { product_id: productId, quantity: 2 }, { product_id: saleProductId, quantity: 1 }])]);
    expect(r[0].r.discount_halalas).toBe(300); // 10% of 3000, sale item excluded
    expect(r[0].r.promotion.code).toBe('SAVE10');
  });
  it('never produces a negative total', async () => {
    const r = await q(`select dafwa_quote($1::jsonb, 'HUGE') as r`, [JSON.stringify([{ product_id: productId, quantity: 1 }])]);
    expect(r[0].r.discount_halalas).toBe(1500);
    expect(r[0].r.total_halalas).toBe(0);
  });
  it('rejects expired, unknown and below-minimum codes', async () => {
    const items = JSON.stringify([{ product_id: productId, quantity: 1 }]);
    await expectError(q(`select dafwa_quote($1::jsonb, 'OLD')`, [items]), 'PROMO_EXPIRED');
    await expectError(q(`select dafwa_quote($1::jsonb, 'NOPE')`, [items]), 'PROMO_INVALID');
    await expectError(q(`select dafwa_quote($1::jsonb, 'MIN')`, [items]), 'PROMO_MIN_ORDER');
  });
  it('rejects quantities outside allowed range', async () => {
    await expectError(q(`select dafwa_quote($1::jsonb)`, [JSON.stringify([{ product_id: productId, quantity: 0 }])]), 'INVALID_QUANTITY');
    await expectError(q(`select dafwa_quote($1::jsonb)`, [JSON.stringify([{ product_id: productId, quantity: 51 }])]), 'INVALID_QUANTITY');
  });
  it('adds zone delivery fee from coordinates and rejects out-of-zone', async () => {
    const items = JSON.stringify([{ product_id: productId, quantity: 1 }]);
    const r = await q(`select dafwa_quote($1::jsonb, null, $2, $3) as r`, [items, INSIDE.lat, INSIDE.lng]);
    expect(r[0].r.delivery_fee_halalas).toBe(1500);
    expect(r[0].r.total_halalas).toBe(3000);
    await expectError(q(`select dafwa_quote($1::jsonb, null, $2, $3)`, [items, JEDDAH.lat, JEDDAH.lng]), 'OUT_OF_ZONE');
  });
});

describe('order creation', () => {
  it('creates an order with snapshots, number, statuses, history and email outbox', async () => {
    const { result } = await order({ promo_code: 'SAVE10' });
    expect(result.duplicate).toBe(false);
    expect(result.order_number).toMatch(/^DF-\d{4,}$/);
    const [o] = await q(`select * from orders where id = $1`, [result.order_id]);
    expect(o.status).toBe('pending_confirmation');
    expect(o.payment_status).toBe('pending_payment');
    expect(o.subtotal_halalas).toBe(3000);
    expect(o.discount_halalas).toBe(300);
    expect(o.delivery_fee_halalas).toBe(1500);
    expect(o.total_halalas).toBe(4200);
    expect(o.customer_email).toBe('sara@example.com');
    expect(o.zone_name).toBe('وسط مكة');
    const items = await q(`select * from order_items where order_id = $1`, [result.order_id]);
    expect(items).toHaveLength(1);
    expect(items[0].product_name_ar).toBe('كوكيز تجريبي');
    expect(items[0].unit_price_halalas).toBe(1500);
    expect(items[0].category_name).toBe('كلاسيك');
    const emails = await q(`select kind, recipient from email_notifications where order_id = $1 order by recipient`, [result.order_id]);
    expect(emails).toEqual([
      { kind: 'owner_new_order', recipient: 'amelebari06@gmail.com' },
      { kind: 'owner_new_order', recipient: 'dsamimelebari@gmail.com' },
      { kind: 'customer_received', recipient: 'sara@example.com' },
    ]);
    const hist = await q(`select count(*)::int as n from order_status_history where order_id = $1`, [result.order_id]);
    expect(hist[0].n).toBe(2);
    const red = await q(`select uses_count from promotions where code = 'SAVE10'`);
    expect(red[0].uses_count).toBe(1);
  });

  it('keeps historical prices when product price changes later', async () => {
    const { result } = await order();
    await q(`update products set price_halalas = 9999 where id = $1`, [productId]);
    const [o] = await q(`select subtotal_halalas from orders where id = $1`, [result.order_id]);
    const [i] = await q(`select unit_price_halalas from order_items where order_id = $1`, [result.order_id]);
    expect(o.subtotal_halalas).toBe(3000);
    expect(i.unit_price_halalas).toBe(1500);
    await q(`update products set price_halalas = 1500 where id = $1`, [productId]);
  });

  it('is idempotent: the same key returns the same order', async () => {
    const payload = {
      idempotency_key: key(),
      customer: { name: 'علي', phone: '+966551112222', email: 'ali@example.com' },
      location: { ...INSIDE, neighborhood: 'العزيزية' },
      delivery: { date: await dayOffset(4), slot_id: slotId },
      items: [{ product_id: productId, quantity: 1 }],
    };
    const a = (await q(`select dafwa_create_order($1::jsonb) as r`, [JSON.stringify(payload)]))[0].r;
    const b = (await q(`select dafwa_create_order($1::jsonb) as r`, [JSON.stringify(payload)]))[0].r;
    expect(b.duplicate).toBe(true);
    expect(b.order_id).toBe(a.order_id);
    const n = await q(`select count(*)::int as n from orders where idempotency_key = $1`, [payload.idempotency_key]);
    expect(n[0].n).toBe(1);
  });

  it('rejects delivery less than the lead time away (24h)', async () => {
    await expectError(order({}, 0), 'LEAD_TIME');
  });
  it('rejects out-of-zone and outside-Makkah locations', async () => {
    await expectError(order({ location: { ...OUTSIDE_ZONE_IN_MAKKAH, neighborhood: 'حي' } }), 'OUT_OF_ZONE');
    await expectError(order({ location: { ...JEDDAH, neighborhood: 'جدة' } }), 'OUT_OF_ZONE');
  });
  it('rejects unavailable dates', async () => {
    const d = await dayOffset(5);
    await q(`insert into unavailable_dates (date, reason) values ($1, 'إجازة')`, [d]);
    await expectError(order({}, 5), 'DATE_UNAVAILABLE');
    const av = (await q(`select dafwa_get_availability() as a`))[0].a;
    const day = av.days.find((x: any) => x.date === d);
    expect(day.slots.every((s: any) => !s.available && s.reason === 'unavailable')).toBe(true);
  });
  it('rejects dates beyond booking window', async () => {
    await expectError(order({}, 40), 'DATE_TOO_FAR');
  });
  it('enforces slot capacity', async () => {
    const date = await dayOffset(6);
    await order({ delivery: { date, slot_id: fullSlotId } });
    await expectError(order({ delivery: { date, slot_id: fullSlotId } }), 'SLOT_FULL');
    const av = (await q(`select dafwa_get_availability() as a`))[0].a;
    const s = av.days.find((x: any) => x.date === date).slots.find((s: any) => s.slot_id === fullSlotId);
    expect(s).toMatchObject({ available: false, reason: 'full' });
  });
  it('enforces daily capacity', async () => {
    await q(`update store_settings set max_orders_per_day = 1`);
    const date = await dayOffset(7);
    await order({ delivery: { date, slot_id: slotId } });
    await expectError(order({ delivery: { date, slot_id: slotId } }), 'SLOT_FULL');
    await q(`update store_settings set max_orders_per_day = null`);
  });
  it('validates customer fields server-side', async () => {
    await expectError(order({ customer: { name: 'س', phone: '+966551234567', email: 'a@b.co' } }), 'INVALID_NAME');
    await expectError(order({ customer: { name: 'سارة', phone: '0551234567', email: 'a@b.co' } }), 'INVALID_PHONE');
    await expectError(order({ customer: { name: 'سارة', phone: '+966551234567', email: 'not-an-email' } }), 'INVALID_EMAIL');
  });
  it('enforces max promo uses', async () => {
    await order({ promo_code: 'ONCE', customer: { name: 'أحمد', phone: '+966553334444', email: 'a@x.com' } });
    await expectError(order({ promo_code: 'ONCE' }), 'PROMO_EXHAUSTED');
  });
  it('tracks stock and restores it on cancellation', async () => {
    const { result } = await order({ items: [{ product_id: stockProductId, quantity: 3 }] });
    expect((await q(`select stock_quantity from products where id = $1`, [stockProductId]))[0].stock_quantity).toBe(0);
    await expectError(order({ items: [{ product_id: stockProductId, quantity: 1 }] }), 'OUT_OF_STOCK');
    await q(`update orders set status = 'cancelled' where id = $1`, [result.order_id]);
    expect((await q(`select stock_quantity from products where id = $1`, [stockProductId]))[0].stock_quantity).toBe(3);
  });
  it('refuses orders when the store is closed', async () => {
    await q(`update store_settings set accepting_orders = false`);
    await expectError(order(), 'ORDERS_CLOSED');
    await q(`update store_settings set accepting_orders = true`);
  });
});

describe('order lifecycle', () => {
  it('records history, queues status emails once, and protects money fields', async () => {
    const { result } = await order();
    const id = result.order_id;
    await q(`update orders set status = 'confirmed' where id = $1`, [id]);
    await q(`update orders set status = 'preparing' where id = $1`, [id]);
    await q(`update orders set status = 'confirmed' where id = $1`, [id]);
    await q(`update orders set status = 'out_for_delivery' where id = $1`, [id]);
    const kinds = await q(`select kind from email_notifications where order_id = $1 and kind like 'customer_%' order by created_at`, [id]);
    expect(kinds.map((r: any) => r.kind).sort()).toEqual(['customer_confirmed', 'customer_out_for_delivery', 'customer_received']);
    await expectError(q(`update orders set total_halalas = 1 where id = $1`, [id]), 'ORDER_IMMUTABLE');
    await q(`update orders set payment_status = 'paid' where id = $1`, [id]);
    const [o] = await q(`select amount_paid_halalas, total_halalas, confirmed_at from orders where id = $1`, [id]);
    expect(o.amount_paid_halalas).toBe(o.total_halalas);
    expect(o.confirmed_at).not.toBeNull();
    await expectError(q(`update orders set payment_status = 'partially_paid', amount_paid_halalas = 100 where id = $1`, [id]), 'PARTIAL_DISABLED');
    await q(`update orders set status = 'cancelled' where id = $1`, [id]);
    await expectError(q(`update orders set status = 'confirmed' where id = $1`, [id]), 'ORDER_CANCELLED_FINAL');
  });
});

describe('email outbox', () => {
  it('claims each email once and applies backoff on failure', async () => {
    const claimed = await q(`select * from dafwa_claim_emails(100)`);
    expect(claimed.length).toBeGreaterThan(0);
    const again = await q(`select * from dafwa_claim_emails(100)`);
    expect(again).toHaveLength(0);
    await q(`select dafwa_complete_email($1, true, 'msg_1', null)`, [claimed[0].id]);
    await q(`select dafwa_complete_email($1, false, null, 'timeout')`, [claimed[1].id]);
    const [a] = await q(`select status, provider_message_id from email_notifications where id = $1`, [claimed[0].id]);
    const [b] = await q(`select status, next_attempt_at > now() as later from email_notifications where id = $1`, [claimed[1].id]);
    expect(a).toEqual({ status: 'sent', provider_message_id: 'msg_1' });
    expect(b).toEqual({ status: 'failed', later: true });
  });
});

describe('security (RLS & grants)', () => {
  it('anonymous visitors cannot read orders, customers, promotions or private settings', async () => {
    await asRole(db, 'anon', null, async () => {
      expect(await q(`select * from orders`)).toHaveLength(0);
      expect(await q(`select * from customers`)).toHaveLength(0);
      expect(await q(`select * from promotions`)).toHaveLength(0);
      expect(await q(`select * from email_notifications`)).toHaveLength(0);
      await expect(q(`select * from store_private_settings`)).rejects.toThrow();
    });
  });
  it('anonymous visitors cannot create orders directly or call privileged functions', async () => {
    await asRole(db, 'anon', null, async () => {
      await expect(q(`insert into orders (order_number) values ('x')`)).rejects.toThrow();
      await expect(q(`select dafwa_create_order('{}'::jsonb)`)).rejects.toThrow(/permission denied/);
      await expect(q(`select dafwa_sales_report(current_date, current_date)`)).rejects.toThrow(/permission denied/);
      await expect(q(`update products set price_halalas = 1`)).resolves.toBeDefined(); // no rows visible to update
    });
    expect((await q(`select price_halalas from products where id = $1`, [productId]))[0].price_halalas).toBe(1500);
  });
  it('anonymous visitors can read the published catalogue and availability', async () => {
    await q(`update products set is_active = false where id = $1`, [saleProductId]);
    await asRole(db, 'anon', null, async () => {
      const rows = await q(`select slug from products order by slug`);
      expect(rows.map((r: any) => r.slug)).not.toContain('p2');
      expect(rows.map((r: any) => r.slug)).toContain('p1');
      const av = await q(`select dafwa_get_availability() as a`);
      expect(av[0].a.checkout_configured).toBe(true);
    });
    await q(`update products set is_active = true where id = $1`, [saleProductId]);
  });
  it('a logged-in non-admin user sees no orders', async () => {
    const uid = '22222222-2222-2222-2222-222222222222';
    await q(`insert into auth.users (id) values ($1)`, [uid]);
    await asRole(db, 'authenticated', uid, async () => {
      expect(await q(`select * from orders`)).toHaveLength(0);
      await expect(q(`select dafwa_sales_report(current_date, current_date)`)).rejects.toThrow('DAFWA:FORBIDDEN');
    });
  });
  it('admins can read orders, update workflow fields and run analytics', async () => {
    await asRole(db, 'authenticated', adminId, async () => {
      const orders = await q(`select id from orders`);
      expect(orders.length).toBeGreaterThan(0);
      await q(`update orders set status = 'confirmed' where id = $1`, [orders[0].id]);
      await expect(q(`update orders set subtotal_halalas = 1 where id = $1`, [orders[0].id])).rejects.toThrow(/permission denied/);
      await expect(q(`delete from orders where id = $1`, [orders[0].id])).rejects.toThrow(/permission denied/);
      const ov = await q(`select dafwa_admin_overview() as o`);
      expect(ov[0].o.active_zones).toBe(1);
    });
  });
});

describe('analytics', () => {
  it('excludes cancelled orders from sales and unpaid from collected revenue', async () => {
    const today = await dayOffset(0);
    const report = await asRole(db, 'authenticated', adminId, async () =>
      (await q(`select dafwa_sales_report($1::date, $1::date) as r`, [today]))[0].r);
    const s = report.summary;
    const [truth] = await q(`
      select count(*) filter (where status <> 'cancelled')::int as ok,
             count(*) filter (where status = 'cancelled')::int as cancelled,
             coalesce(sum(subtotal_halalas - discount_halalas) filter (where status <> 'cancelled'), 0)::int as net,
             coalesce(sum(amount_paid_halalas) filter (where status <> 'cancelled' and payment_status in ('paid','partially_paid')), 0)::int as collected,
             coalesce(sum(total_halalas - amount_paid_halalas) filter (where status <> 'cancelled' and payment_status in ('pending_payment','partially_paid')), 0)::int as unpaid
      from orders`);
    expect(s.orders_successful).toBe(truth.ok);
    expect(s.orders_cancelled).toBe(truth.cancelled);
    expect(Number(s.net_sales)).toBe(truth.net);
    expect(Number(s.collected)).toBe(truth.collected);
    expect(Number(s.unpaid)).toBe(truth.unpaid);
    expect(Number(s.net_sales)).toBe(Number(s.gross_sales) - Number(s.discounts));
    expect(report.series).toHaveLength(1);
    expect(report.products.length).toBeGreaterThan(0);
  });
});
