import type { OrderStatus, PaymentStatus } from '../../shared/labels';
import type { LatLng } from '../../shared/geo';

export interface Category {
  id: string;
  name_ar: string;
  name_en: string | null;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface ProductImage {
  id: string;
  product_id: string;
  storage_path: string;
  url: string;
  alt: string | null;
  sort_order: number;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name_ar: string;
  name_en: string | null;
  price_halalas: number | null;
  sale_price_halalas: number | null;
  is_available: boolean;
  stock_quantity: number | null;
  sort_order: number;
}

export interface Product {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string | null;
  short_description: string | null;
  description: string | null;
  category_id: string | null;
  price_halalas: number;
  sale_price_halalas: number | null;
  is_active: boolean;
  is_archived: boolean;
  is_available: boolean;
  is_featured: boolean;
  is_bestseller: boolean;
  stock_quantity: number | null;
  ingredients: string | null;
  allergens: string | null;
  show_ingredients: boolean;
  show_allergens: boolean;
  allow_notes: boolean;
  min_quantity: number;
  max_quantity: number;
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
  images?: ProductImage[];
  variants?: ProductVariant[];
  category?: Pick<Category, 'id' | 'name_ar' | 'slug'> | null;
}

export interface Faq {
  q: string;
  a: string;
}

export interface StoreSettings {
  store_name_ar: string;
  store_name_en: string;
  description: string;
  phone: string;
  whatsapp_number: string;
  contact_email: string | null;
  instagram_url: string | null;
  accepting_orders: boolean;
  closure_message: string;
  lead_time_hours: number;
  booking_window_days: number;
  max_orders_per_day: number | null;
  max_items_per_order: number;
  allow_partial_payment: boolean;
  announcement_primary: string;
  announcement_secondary: string;
  hero_title: string;
  hero_subtitle: string;
  hero_image_url: string | null;
  brand_story: string;
  delivery_info: string;
  faqs: Faq[];
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  link_url: string | null;
  cta_label: string | null;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  sort_order: number;
}

export interface DeliveryZone {
  id: string;
  name_ar: string;
  polygon: LatLng[];
  fee_halalas: number;
  min_order_halalas: number;
  is_active: boolean;
  sort_order: number;
  notes: string | null;
}

export interface DeliverySlot {
  id: string;
  label_ar: string;
  weekdays: number[];
  start_time: string;
  end_time: string;
  capacity: number | null;
  is_active: boolean;
  sort_order: number;
}

export interface AvailabilitySlot {
  slot_id: string;
  label: string;
  start: string;
  end: string;
  available: boolean;
  reason: 'unavailable' | 'lead_time' | 'full' | null;
}
export interface Availability {
  now: string;
  earliest: string;
  lead_time_hours: number;
  accepting_orders: boolean;
  closure_message: string;
  checkout_configured: boolean;
  days: { date: string; slots: AvailabilitySlot[] }[];
}

export interface QuoteLine {
  product_id: string;
  variant_id: string | null;
  product_name_ar: string;
  variant_name: string | null;
  unit_price_halalas: number;
  quantity: number;
  line_total_halalas: number;
}
export interface Quote {
  lines: QuoteLine[];
  subtotal_halalas: number;
  discount_halalas: number;
  delivery_fee_halalas: number;
  total_halalas: number;
  total_quantity: number;
  promotion: { id: string; name: string; code: string | null } | null;
  zone: { id: string; name: string } | null;
}

export interface Receipt {
  order_id: string;
  order_number: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  neighborhood: string;
  zone_name: string;
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
  items: { name: string; variant: string | null; quantity: number; unit_price_halalas: number; line_total_halalas: number }[];
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_whatsapp: string | null;
  zone_id: string | null;
  zone_name: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  building: string | null;
  apartment: string | null;
  floor: string | null;
  delivery_instructions: string | null;
  notes: string | null;
  delivery_date: string;
  slot_id: string | null;
  slot_label: string;
  delivery_start: string;
  delivery_end: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  amount_paid_halalas: number;
  subtotal_halalas: number;
  discount_halalas: number;
  delivery_fee_halalas: number;
  total_halalas: number;
  promotion_id: string | null;
  promo_code: string | null;
  admin_notes: string | null;
  confirmed_at: string | null;
  cancelled_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name_ar: string;
  product_name_en: string | null;
  variant_name: string | null;
  category_name: string | null;
  unit_price_halalas: number;
  quantity: number;
  line_total_halalas: number;
  notes: string | null;
}
