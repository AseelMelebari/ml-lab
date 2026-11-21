import { z } from 'zod';
import { normalizeSaudiMobile } from './phone';

const optionalText = (max: number) =>
  z.string().trim().max(max, 'النص طويل جدًا').optional().nullable().transform((v) => (v ? v : null));

export const saudiMobile = z
  .string({ required_error: 'رقم الجوال مطلوب' })
  .trim()
  .min(1, 'رقم الجوال مطلوب')
  .transform((v, ctx) => {
    const n = normalizeSaudiMobile(v);
    if (!n) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'رقم الجوال غير صحيح. مثال: 05XXXXXXXX' });
      return z.NEVER;
    }
    return n;
  });

export const checkoutSchema = z.object({
  idempotency_key: z.string().min(16).max(100).regex(/^[A-Za-z0-9_-]+$/),
  customer: z.object({
    name: z.string({ required_error: 'الاسم مطلوب' }).trim().min(2, 'فضلًا اكتب الاسم الكامل').max(100, 'الاسم طويل جدًا'),
    phone: saudiMobile,
    email: z.string({ required_error: 'البريد الإلكتروني مطلوب' }).trim().toLowerCase().email('البريد الإلكتروني غير صحيح').max(254),
    whatsapp: z
      .string()
      .trim()
      .optional()
      .nullable()
      .transform((v, ctx) => {
        if (!v) return null;
        const n = normalizeSaudiMobile(v);
        if (!n) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'رقم الواتساب غير صحيح' });
          return z.NEVER;
        }
        return n;
      }),
  }),
  location: z.object({
    lat: z.number({ required_error: 'حدد الموقع على الخريطة', invalid_type_error: 'حدد الموقع على الخريطة' }).min(-90).max(90),
    lng: z.number({ required_error: 'حدد الموقع على الخريطة', invalid_type_error: 'حدد الموقع على الخريطة' }).min(-180).max(180),
    neighborhood: z.string({ required_error: 'اسم الحي مطلوب' }).trim().min(2, 'فضلًا اكتب اسم الحي').max(80),
    building: optionalText(40),
    apartment: optionalText(40),
    floor: optionalText(20),
    instructions: optionalText(500),
  }),
  delivery: z.object({
    date: z.string({ required_error: 'اختر تاريخ التوصيل' }).regex(/^\d{4}-\d{2}-\d{2}$/, 'اختر تاريخ التوصيل'),
    slot_id: z.string({ required_error: 'اختر وقت التوصيل' }).uuid('اختر وقت التوصيل'),
  }),
  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        variant_id: z.string().uuid().nullable().optional(),
        quantity: z.number().int().min(1).max(500),
        notes: optionalText(300),
      }),
    )
    .min(1, 'السلة فاضية')
    .max(50),
  promo_code: z
    .string()
    .trim()
    .max(30)
    .optional()
    .nullable()
    .transform((v) => (v ? v.toUpperCase() : null)),
  notes: optionalText(1000),
  // Honeypot field — real users never fill it.
  website: z.string().max(0).optional().nullable(),
});

export type CheckoutPayload = z.input<typeof checkoutSchema>;
export type CheckoutParsed = z.output<typeof checkoutSchema>;
