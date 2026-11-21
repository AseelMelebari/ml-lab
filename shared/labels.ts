export const ORDER_STATUSES = [
  'pending_confirmation', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ['pending_payment', 'paid', 'partially_paid', 'refunded'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const ORDER_STATUS_AR: Record<OrderStatus, string> = {
  pending_confirmation: 'بانتظار التأكيد',
  confirmed: 'مؤكد',
  preparing: 'قيد التحضير',
  ready: 'جاهز',
  out_for_delivery: 'في الطريق إليك',
  delivered: 'تم التوصيل',
  cancelled: 'ملغي',
};

export const PAYMENT_STATUS_AR: Record<PaymentStatus, string> = {
  pending_payment: 'بانتظار الدفع',
  paid: 'مدفوع',
  partially_paid: 'مدفوع جزئيًا',
  refunded: 'مسترد',
};

export const EMAIL_KIND_AR: Record<string, string> = {
  owner_new_order: 'إشعار طلب جديد (المالك)',
  customer_received: 'استلام الطلب (العميل)',
  customer_confirmed: 'تأكيد الطلب (العميل)',
  customer_out_for_delivery: 'الطلب في الطريق (العميل)',
  customer_cancelled: 'إلغاء الطلب (العميل)',
};

export const EMAIL_STATUS_AR: Record<string, string> = {
  pending: 'بالانتظار',
  sending: 'جارٍ الإرسال',
  sent: 'قُبل للإرسال',
  failed: 'فشل — ستتم إعادة المحاولة',
  dead: 'فشل نهائي',
};

/** Arabic messages for server error codes raised as DAFWA:<CODE> */
export const ERROR_AR: Record<string, string> = {
  CART_EMPTY: 'السلة فاضية.',
  CART_TOO_LARGE: 'عدد القطع في الطلب أكبر من المسموح.',
  PRODUCT_NOT_FOUND: 'أحد المنتجات لم يعد متوفرًا. فضلًا حدّث السلة.',
  PRODUCT_UNAVAILABLE: 'أحد المنتجات غير متاح حاليًا.',
  VARIANT_NOT_FOUND: 'الخيار المحدد لم يعد متاحًا.',
  VARIANT_REQUIRED: 'فضلًا اختر الحجم أو النوع للمنتج.',
  OUT_OF_STOCK: 'الكمية المطلوبة غير متوفرة حاليًا.',
  INVALID_QUANTITY: 'الكمية غير صحيحة.',
  PROMO_INVALID: 'كود الخصم غير صحيح.',
  PROMO_EXPIRED: 'كود الخصم منتهي أو غير مفعّل بعد.',
  PROMO_EXHAUSTED: 'تم استخدام كود الخصم بالكامل.',
  PROMO_CUSTOMER_LIMIT: 'استخدمت هذا الكود من قبل.',
  PROMO_MIN_ORDER: 'قيمة الطلب أقل من الحد الأدنى لهذا الكود.',
  PROMO_NOT_APPLICABLE: 'كود الخصم لا ينطبق على منتجات السلة.',
  OUT_OF_ZONE: 'الموقع المحدد خارج نطاق التوصيل المعتمد داخل مكة المكرمة.',
  ZONE_MIN_ORDER: 'قيمة الطلب أقل من الحد الأدنى للتوصيل لمنطقتك.',
  ORDERS_CLOSED: 'استقبال الطلبات متوقف مؤقتًا.',
  CHECKOUT_NOT_CONFIGURED: 'الطلب عبر الموقع غير متاح بعد. تواصل معنا عبر واتساب.',
  INVALID_NAME: 'فضلًا اكتب الاسم الكامل.',
  INVALID_PHONE: 'رقم الجوال غير صحيح. مثال: 05XXXXXXXX',
  INVALID_EMAIL: 'البريد الإلكتروني غير صحيح.',
  INVALID_NEIGHBORHOOD: 'فضلًا اكتب اسم الحي.',
  INVALID_LOCATION: 'فضلًا حدد موقع التوصيل على الخريطة.',
  INVALID_SLOT: 'فضلًا اختر موعد توصيل صحيح.',
  DATE_UNAVAILABLE: 'هذا التاريخ غير متاح للتوصيل.',
  DATE_TOO_FAR: 'التاريخ المختار بعيد جدًا. اختر تاريخًا أقرب.',
  LEAD_TIME: 'الطلب قبل موعد التسليم بـ 24 ساعة على الأقل.',
  SLOT_FULL: 'الموعد المختار اكتمل. فضلًا اختر موعدًا آخر.',
  RATE_LIMITED: 'محاولات كثيرة. فضلًا انتظر قليلًا ثم حاول مرة أخرى.',
  INVALID_REQUEST: 'البيانات المرسلة غير مكتملة.',
  ZONE_OUTSIDE_MAKKAH: 'لا يمكن إنشاء منطقة توصيل خارج مكة المكرمة.',
  ZONE_INVALID_POLYGON: 'حدود المنطقة غير صحيحة.',
  ORDER_IMMUTABLE: 'لا يمكن تعديل المبالغ بعد إنشاء الطلب.',
  ORDER_CANCELLED_FINAL: 'لا يمكن تغيير حالة طلب ملغي.',
  PARTIAL_DISABLED: 'الدفع الجزئي غير مفعّل من الإعدادات.',
  INVALID_PARTIAL_AMOUNT: 'المبلغ المدفوع جزئيًا يجب أن يكون أكبر من صفر وأقل من الإجمالي.',
  FORBIDDEN: 'ليس لديك صلاحية.',
  SERVER_ERROR: 'صار خطأ غير متوقع. فضلًا حاول مرة أخرى.',
};

/** Extracts DAFWA:<CODE> from an error message (Postgres / API) */
export function errorCode(message: string | undefined | null): string | null {
  const m = /DAFWA:([A-Z_]+)/.exec(message ?? '');
  return m ? m[1] : null;
}

export function errorMessageAr(messageOrCode: string | undefined | null, fallback = ERROR_AR.SERVER_ERROR): string {
  const code = errorCode(messageOrCode) ?? messageOrCode ?? '';
  return ERROR_AR[code] ?? fallback;
}
