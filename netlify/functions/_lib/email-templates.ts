import { formatSAR } from '../../../shared/money';
import { formatDateAr, formatDateTimeAr } from '../../../shared/dates';
import { googleMapsLink } from '../../../shared/geo';
import { ORDER_STATUS_AR, PAYMENT_STATUS_AR, type OrderStatus, type PaymentStatus } from '../../../shared/labels';
import { formatSaudiMobileLocal } from '../../../shared/phone';
import { whatsappLink } from '../../../shared/whatsapp';

export interface EmailOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_whatsapp: string | null;
  neighborhood: string;
  zone_name: string;
  building: string | null;
  apartment: string | null;
  floor: string | null;
  delivery_instructions: string | null;
  notes: string | null;
  latitude: number;
  longitude: number;
  delivery_date: string;
  slot_label: string;
  delivery_start: string;
  delivery_end: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  subtotal_halalas: number;
  discount_halalas: number;
  delivery_fee_halalas: number;
  total_halalas: number;
  promo_code: string | null;
  created_at: string;
  items: { product_name_ar: string; variant_name: string | null; quantity: number; unit_price_halalas: number; line_total_halalas: number; notes: string | null }[];
}

export interface EmailContext {
  siteUrl: string;
  logoUrl?: string;
  whatsappDigits: string;
  storeName: string;
}

const C = {
  cocoa: '#60351F', espresso: '#422417', cream: '#F7F0E3', beige: '#E8D9C3', caramel: '#BC8965', off: '#FFFCF7', muted: '#8A6E5C',
};

const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const timeRange = (o: EmailOrder) => {
  const f = (ts: string) => new Intl.DateTimeFormat('ar-SA-u-nu-latn', { timeZone: 'Asia/Riyadh', hour: 'numeric', minute: '2-digit' }).format(new Date(ts));
  return `${o.slot_label} (${f(o.delivery_start)} – ${f(o.delivery_end)})`;
};

function button(href: string, label: string, primary = true) {
  return `<a href="${esc(href)}" style="display:inline-block;background:${primary ? C.cocoa : C.off};color:${primary ? '#ffffff' : C.cocoa};border:1px solid ${C.cocoa};text-decoration:none;font-weight:700;font-size:15px;padding:13px 26px;border-radius:999px;margin:4px">${esc(label)}</a>`;
}

function row(label: string, value: string, strong = false) {
  return `<tr><td style="padding:7px 0;color:${C.muted};font-size:14px;white-space:nowrap;vertical-align:top">${esc(label)}</td><td style="padding:7px 12px 7px 0;color:${C.espresso};font-size:14px;${strong ? 'font-weight:700;' : ''}text-align:left">${value}</td></tr>`;
}

function itemsTable(o: EmailOrder) {
  const rows = o.items
    .map(
      (i) => `<tr>
  <td style="padding:10px 0;border-bottom:1px solid ${C.beige};color:${C.espresso};font-size:14px">
    <strong>${esc(i.product_name_ar)}</strong>${i.variant_name ? `<span style="color:${C.muted}"> — ${esc(i.variant_name)}</span>` : ''}
    ${i.notes ? `<div style="color:${C.muted};font-size:12px;margin-top:3px">ملاحظة: ${esc(i.notes)}</div>` : ''}
  </td>
  <td style="padding:10px 8px;border-bottom:1px solid ${C.beige};color:${C.muted};font-size:14px;text-align:center;white-space:nowrap">× ${i.quantity}</td>
  <td style="padding:10px 0;border-bottom:1px solid ${C.beige};color:${C.espresso};font-size:14px;text-align:left;white-space:nowrap">${formatSAR(i.line_total_halalas)}</td>
</tr>`,
    )
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${rows}</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px">
  ${row('المجموع', formatSAR(o.subtotal_halalas))}
  ${o.discount_halalas > 0 ? row(`الخصم${o.promo_code ? ` (${esc(o.promo_code)})` : ''}`, `- ${formatSAR(o.discount_halalas)}`) : ''}
  ${row('رسوم التوصيل', formatSAR(o.delivery_fee_halalas))}
  <tr><td colspan="2" style="border-top:1px solid ${C.beige};padding-top:6px"></td></tr>
  ${row('الإجمالي', `<span style="font-size:17px;color:${C.cocoa}">${formatSAR(o.total_halalas)}</span>`, true)}
</table>`;
}

function card(inner: string, title?: string) {
  return `<tr><td style="padding:0 24px 18px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid ${C.beige};border-radius:18px">
    <tr><td style="padding:20px 22px">
      ${title ? `<div style="font-size:13px;letter-spacing:.3px;color:${C.caramel};font-weight:700;margin-bottom:10px">${esc(title)}</div>` : ''}
      ${inner}
    </td></tr>
  </table></td></tr>`;
}

function layout(ctx: EmailContext, preheader: string, body: string) {
  const header = ctx.logoUrl
    ? `<img src="${esc(ctx.logoUrl)}" alt="دَفوة DAFWA" width="120" style="display:block;margin:0 auto;max-width:120px;height:auto;border:0">`
    : `<div style="font-size:30px;font-weight:800;color:${C.cocoa};line-height:1">دَفوة</div><div style="font-family:Georgia,serif;letter-spacing:6px;font-size:12px;color:${C.caramel};margin-top:6px">DAFWA</div>`;
  return `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only"><title>${esc(ctx.storeName)}</title></head>
<body style="margin:0;padding:0;background:${C.cream};font-family:Tahoma,'Segoe UI',Arial,sans-serif;direction:rtl">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.cream}">
<tr><td align="center" style="padding:28px 12px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:${C.off};border-radius:26px;overflow:hidden;border:1px solid ${C.beige}" dir="rtl">
    <tr><td align="center" style="padding:30px 24px 18px;border-bottom:1px solid ${C.beige}">${header}</td></tr>
    ${body}
    <tr><td align="center" style="padding:18px 24px 28px;color:${C.muted};font-size:12px;line-height:1.8">
      دَفوة — كوكيز طازج في مكة المكرمة<br>
      التوصيل داخل مكة المكرمة فقط · الدفع والتأكيد عبر واتساب<br>
      <a href="${esc(ctx.siteUrl)}" style="color:${C.cocoa}">${esc(ctx.siteUrl.replace(/^https?:\/\//, ''))}</a>
    </td></tr>
  </table>
</td></tr></table></body></html>`;
}

function intro(title: string, text: string) {
  return `<tr><td style="padding:26px 28px 18px;text-align:right">
    <h1 style="margin:0 0 10px;font-size:22px;color:${C.espresso};line-height:1.5">${title}</h1>
    <p style="margin:0;font-size:15px;line-height:1.9;color:${C.espresso}">${text}</p>
  </td></tr>`;
}

function deliveryBlock(o: EmailOrder) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    ${row('تاريخ التوصيل', esc(formatDateAr(o.delivery_date, { year: true })))}
    ${row('الوقت المطلوب', esc(timeRange(o)))}
    ${row('الحي', esc(o.neighborhood))}
    ${row('حالة الطلب', esc(ORDER_STATUS_AR[o.status]))}
    ${row('حالة الدفع', esc(PAYMENT_STATUS_AR[o.payment_status]))}
  </table>`;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export function renderEmail(kind: string, o: EmailOrder, ctx: EmailContext): RenderedEmail {
  const wa = whatsappLink(ctx.whatsappDigits, `السلام عليكم، بخصوص طلبي رقم ${o.order_number}`);
  const maps = googleMapsLink(o.latitude, o.longitude);
  const firstName = o.customer_name.split(' ')[0];

  switch (kind) {
    case 'owner_new_order': {
      const adminLink = `${ctx.siteUrl}/admin/orders/${o.id}`;
      const customerWa = whatsappLink((o.customer_whatsapp ?? o.customer_phone).replace(/\D/g, ''), `السلام عليكم ${firstName}، معك دفوة بخصوص طلبك رقم ${o.order_number} 🍪`);
      const address = [o.building && `مبنى ${o.building}`, o.floor && `دور ${o.floor}`, o.apartment && `شقة ${o.apartment}`].filter(Boolean).join(' · ');
      const body =
        intro(`🍪 طلب جديد ${esc(o.order_number)}`, `وصل طلب جديد بتاريخ ${esc(formatDateTimeAr(o.created_at))}. الطلب <strong>بانتظار التأكيد</strong> والدفع <strong>بانتظار الدفع</strong> — لم يتم أي دفع بعد.`) +
        card(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${row('الاسم', esc(o.customer_name), true)}
          ${row('الجوال', `<a href="tel:${esc(o.customer_phone)}" style="color:${C.cocoa}" dir="ltr">${esc(formatSaudiMobileLocal(o.customer_phone))}</a>`)}
          ${o.customer_whatsapp ? row('واتساب', `<span dir="ltr">${esc(formatSaudiMobileLocal(o.customer_whatsapp))}</span>`) : ''}
          ${row('البريد', `<a href="mailto:${esc(o.customer_email)}" style="color:${C.cocoa}">${esc(o.customer_email)}</a>`)}
        </table>`, 'العميل') +
        card(itemsTable(o), 'المنتجات') +
        card(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${row('التاريخ', esc(formatDateAr(o.delivery_date, { year: true })), true)}
          ${row('الوقت', esc(timeRange(o)))}
          ${row('الحي', esc(o.neighborhood))}
          ${row('منطقة التوصيل', esc(o.zone_name))}
          ${address ? row('العنوان', esc(address)) : ''}
          ${o.delivery_instructions ? row('تعليمات التوصيل', esc(o.delivery_instructions)) : ''}
          ${o.notes ? row('ملاحظات الطلب', esc(o.notes)) : ''}
          ${row('حالة الدفع', esc(PAYMENT_STATUS_AR[o.payment_status]))}
        </table>
        <div style="text-align:center;margin-top:14px">${button(maps, 'فتح الموقع في خرائط Google', false)}</div>`, 'التوصيل') +
        `<tr><td align="center" style="padding:4px 24px 22px">${button(adminLink, 'عرض الطلب في لوحة التحكم')}${button(customerWa, 'مراسلة العميل واتساب', false)}
        <div style="color:${C.muted};font-size:12px;margin-top:10px">رابط لوحة التحكم يتطلب تسجيل الدخول.</div></td></tr>`;
      const text = [
        `طلب جديد ${o.order_number}`,
        `العميل: ${o.customer_name} — ${formatSaudiMobileLocal(o.customer_phone)} — ${o.customer_email}`,
        ...o.items.map((i) => `- ${i.product_name_ar}${i.variant_name ? ` (${i.variant_name})` : ''} × ${i.quantity} = ${formatSAR(i.line_total_halalas)}`),
        `المجموع: ${formatSAR(o.subtotal_halalas)} | الخصم: ${formatSAR(o.discount_halalas)} | التوصيل: ${formatSAR(o.delivery_fee_halalas)} | الإجمالي: ${formatSAR(o.total_halalas)}`,
        `حالة الدفع: ${PAYMENT_STATUS_AR[o.payment_status]}`,
        `التوصيل: ${formatDateAr(o.delivery_date)} — ${timeRange(o)} — ${o.neighborhood}`,
        o.delivery_instructions ? `تعليمات: ${o.delivery_instructions}` : '',
        `الموقع: ${maps}`,
        `تفاصيل الطلب: ${adminLink}`,
      ].filter(Boolean).join('\n');
      return { subject: `🍪 طلب جديد في دفوة | Order #${o.order_number}`, html: layout(ctx, `طلب جديد من ${o.customer_name} — ${formatSAR(o.total_halalas)}`, body), text };
    }

    case 'customer_received': {
      const body =
        intro(`أهلًا بك في دفوة 🤎`, `أهلًا ${esc(firstName)}، استلمنا طلبك بنجاح، وشكرًا لاختيارك لنا!<br>طلبك الآن <strong>بانتظار التأكيد</strong>، وراح يتم التنسيق معك عبر واتساب بخصوص الدفع والتوصيل.`) +
        card(`<div style="text-align:center;font-size:13px;color:${C.muted}">رقم الطلب</div><div style="text-align:center;font-size:26px;font-weight:800;color:${C.cocoa};letter-spacing:1px;margin-top:4px" dir="ltr">${esc(o.order_number)}</div>`) +
        card(itemsTable(o), 'ملخص الطلب') +
        card(deliveryBlock(o), 'التوصيل') +
        card(`<p style="margin:0;font-size:14px;line-height:1.9;color:${C.espresso}">⚠️ هذه رسالة <strong>استلام</strong> للطلب وليست تأكيدًا له. يتأكد الطلب بعد التنسيق معك عبر واتساب وإتمام ترتيبات الدفع.</p>`) +
        `<tr><td align="center" style="padding:4px 24px 22px">${button(wa, 'تواصل معنا عبر واتساب')}</td></tr>`;
      const text = `أهلًا ${firstName} 🤎\nاستلمنا طلبك ${o.order_number} بنجاح. طلبك الآن بانتظار التأكيد، وراح يتم التنسيق معك عبر واتساب بخصوص الدفع والتوصيل.\nالإجمالي: ${formatSAR(o.total_halalas)}\nالتوصيل: ${formatDateAr(o.delivery_date)} — ${timeRange(o)}\nواتساب: ${wa}`;
      return { subject: 'دفوة | استلمنا طلبك بنجاح 🍪', html: layout(ctx, `طلبك ${o.order_number} بانتظار التأكيد`, body), text };
    }

    case 'customer_confirmed': {
      const body =
        intro(`تم تأكيد طلبك ✨`, `أهلًا ${esc(firstName)}، يسعدنا نبلغك إن طلبك <strong dir="ltr">${esc(o.order_number)}</strong> تأكد، وبنبدأ نجهّزه لك طازج.`) +
        card(deliveryBlock(o), 'تفاصيل التوصيل') +
        card(itemsTable(o), 'ملخص الطلب') +
        `<tr><td align="center" style="padding:4px 24px 22px">${button(wa, 'تواصل معنا عبر واتساب')}</td></tr>`;
      return { subject: `دفوة | تم تأكيد طلبك ${o.order_number} 🤎`, html: layout(ctx, 'طلبك مؤكد', body), text: `تم تأكيد طلبك ${o.order_number}. التوصيل: ${formatDateAr(o.delivery_date)} — ${timeRange(o)}.` };
    }

    case 'customer_out_for_delivery': {
      const body =
        intro(`طلبك في الطريق إليك 🚗`, `أهلًا ${esc(firstName)}، طلبك <strong dir="ltr">${esc(o.order_number)}</strong> طلع للتوصيل الآن. نتمنى لك لحظة حلوة مع دفوة!`) +
        card(deliveryBlock(o), 'التوصيل') +
        `<tr><td align="center" style="padding:4px 24px 22px">${button(wa, 'تواصل معنا عبر واتساب')}</td></tr>`;
      return { subject: `دفوة | طلبك ${o.order_number} في الطريق 🍪`, html: layout(ctx, 'طلبك في الطريق إليك', body), text: `طلبك ${o.order_number} في الطريق إليك.` };
    }

    case 'customer_cancelled': {
      const body =
        intro(`تم إلغاء الطلب`, `أهلًا ${esc(firstName)}، نبلغك إن الطلب <strong dir="ltr">${esc(o.order_number)}</strong> تم إلغاؤه. إذا عندك أي استفسار، تواصل معنا عبر واتساب وبنكون سعيدين بخدمتك.`) +
        card(itemsTable(o), 'الطلب الملغي') +
        `<tr><td align="center" style="padding:4px 24px 22px">${button(wa, 'تواصل معنا عبر واتساب')}</td></tr>`;
      return { subject: `دفوة | تم إلغاء الطلب ${o.order_number}`, html: layout(ctx, 'تم إلغاء الطلب', body), text: `تم إلغاء الطلب ${o.order_number}. للاستفسار: ${wa}` };
    }
  }
  throw new Error(`Unknown email kind ${kind}`);
}
