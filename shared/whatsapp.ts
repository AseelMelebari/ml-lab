import { formatSAR } from './money';
import { formatDateAr, formatTimeAr } from './dates';
import { googleMapsLink } from './geo';

export interface ReceiptForMessage {
  order_number: string;
  customer_name: string;
  items: { name: string; variant?: string | null; quantity: number; line_total_halalas: number }[];
  subtotal_halalas: number;
  discount_halalas: number;
  delivery_fee_halalas: number;
  total_halalas: number;
  neighborhood: string;
  delivery_date: string;
  slot_label: string;
  slot_start?: string; // HH:MM
  slot_end?: string;
  latitude: number | string;
  longitude: number | string;
}

export function buildOrderWhatsAppMessage(r: ReceiptForMessage): string {
  const lines = [
    `السلام عليكم دفوة 🤎`,
    `أرسلت طلب جديد وأبغى أكمل التأكيد والدفع:`,
    ``,
    `🧾 رقم الطلب: ${r.order_number}`,
    `👤 الاسم: ${r.customer_name}`,
    ``,
    `🍪 المنتجات:`,
    ...r.items.map((i) => `• ${i.name}${i.variant ? ` (${i.variant})` : ''} × ${i.quantity} — ${formatSAR(i.line_total_halalas)}`),
    ``,
    `المجموع: ${formatSAR(r.subtotal_halalas)}`,
    ...(r.discount_halalas > 0 ? [`الخصم: -${formatSAR(r.discount_halalas)}`] : []),
    `التوصيل: ${formatSAR(r.delivery_fee_halalas)}`,
    `💰 الإجمالي: ${formatSAR(r.total_halalas)}`,
    ``,
    `📍 الحي: ${r.neighborhood}`,
    `📅 موعد التوصيل: ${formatDateAr(r.delivery_date)} — ${r.slot_label}${r.slot_start && r.slot_end ? ` (${formatTimeAr(r.slot_start)} - ${formatTimeAr(r.slot_end)})` : ''}`,
    `🗺️ الموقع: ${googleMapsLink(r.latitude, r.longitude)}`,
  ];
  return lines.join('\n');
}

export function whatsappLink(numberDigits: string, text?: string): string {
  const n = numberDigits.replace(/\D/g, '');
  return text ? `https://wa.me/${n}?text=${encodeURIComponent(text)}` : `https://wa.me/${n}`;
}
