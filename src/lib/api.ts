import { supabase } from './supabase';
import type { Availability, Banner, Category, Product, Quote, Receipt, StoreSettings, DeliveryZone } from './types';
import { errorCode } from '../../shared/labels';

export class ApiError extends Error {
  constructor(public code: string, message?: string, public detail?: string) {
    super(message ?? code);
  }
}

const PRODUCT_SELECT = '*, images:product_images(*), variants:product_variants(*), category:categories(id, name_ar, slug)';

function sortProduct(p: Product): Product {
  p.images?.sort((a, b) => a.sort_order - b.sort_order);
  p.variants?.sort((a, b) => a.sort_order - b.sort_order);
  return p;
}

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('is_active', true)
    .eq('is_archived', false)
    .order('sort_order')
    .order('created_at', { ascending: false });
  if (error) throw new ApiError('LOAD_FAILED', error.message);
  return (data as Product[]).map(sortProduct);
}

export async function fetchProduct(slug: string): Promise<Product | null> {
  const { data, error } = await supabase.from('products').select(PRODUCT_SELECT).eq('slug', slug).maybeSingle();
  if (error) throw new ApiError('LOAD_FAILED', error.message);
  return data ? sortProduct(data as Product) : null;
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select('*').eq('is_active', true).order('sort_order');
  if (error) throw new ApiError('LOAD_FAILED', error.message);
  return data as Category[];
}

export async function fetchSettings(): Promise<StoreSettings> {
  const { data, error } = await supabase.from('store_settings').select('*').single();
  if (error) throw new ApiError('LOAD_FAILED', error.message);
  return data as StoreSettings;
}

export async function fetchBanners(): Promise<Banner[]> {
  const { data } = await supabase.from('banners').select('*').eq('is_active', true).order('sort_order');
  return (data as Banner[]) ?? [];
}

export async function fetchActiveZones(): Promise<DeliveryZone[]> {
  const { data } = await supabase.from('delivery_zones').select('*').eq('is_active', true).order('sort_order');
  return (data as DeliveryZone[]) ?? [];
}

export async function fetchAvailability(): Promise<Availability> {
  const { data, error } = await supabase.rpc('dafwa_get_availability');
  if (error) throw new ApiError('LOAD_FAILED', error.message);
  return data as Availability;
}

export interface CartLineInput {
  product_id: string;
  variant_id?: string | null;
  quantity: number;
  notes?: string | null;
}

export async function fetchQuote(items: CartLineInput[], promo?: string | null, loc?: { lat: number; lng: number } | null): Promise<Quote> {
  const { data, error } = await supabase.rpc('dafwa_quote', {
    p_items: items,
    p_promo_code: promo || null,
    p_lat: loc?.lat ?? null,
    p_lng: loc?.lng ?? null,
  });
  if (error) throw new ApiError(errorCode(error.message) ?? 'SERVER_ERROR', error.message, error.details);
  return data as Quote;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  } catch {
    throw new ApiError('NETWORK', 'تعذر الاتصال. تأكد من الإنترنت وحاول مرة أخرى.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) throw new ApiError(data.code ?? 'SERVER_ERROR', data.message, data.path ?? data.detail);
  return data as T;
}

export function createOrder(payload: unknown) {
  return postJson<{ ok: true; duplicate: boolean; receipt: Receipt }>('/api/create-order', payload);
}

export function fetchReceipt(order_id: string, key: string) {
  return postJson<{ ok: true; receipt: Receipt }>('/api/order-receipt', { order_id, key });
}

/** Lowest displayable price for a product (considering variants and sale prices). */
export function productPricing(p: Product): { price: number; compareAt: number | null; fromVariants: boolean } {
  const variants = (p.variants ?? []).filter((v) => v.is_available);
  if (variants.length) {
    const opts = variants.map((v) => ({
      price: v.price_halalas != null ? v.sale_price_halalas ?? v.price_halalas : p.sale_price_halalas ?? p.price_halalas,
      compare: v.price_halalas != null ? (v.sale_price_halalas ? v.price_halalas : null) : p.sale_price_halalas ? p.price_halalas : null,
    }));
    const min = opts.reduce((a, b) => (b.price < a.price ? b : a));
    const distinct = new Set(opts.map((o) => o.price)).size > 1;
    return { price: min.price, compareAt: min.compare, fromVariants: distinct };
  }
  return { price: p.sale_price_halalas ?? p.price_halalas, compareAt: p.sale_price_halalas ? p.price_halalas : null, fromVariants: false };
}

export function variantPrice(p: Product, variantId: string | null): { price: number; compareAt: number | null } {
  const v = p.variants?.find((x) => x.id === variantId);
  if (v && v.price_halalas != null) return { price: v.sale_price_halalas ?? v.price_halalas, compareAt: v.sale_price_halalas ? v.price_halalas : null };
  return { price: p.sale_price_halalas ?? p.price_halalas, compareAt: p.sale_price_halalas ? p.price_halalas : null };
}

export function isSoldOut(p: Product): boolean {
  if (!p.is_available) return true;
  if (p.stock_quantity != null && p.stock_quantity <= 0) return true;
  if (p.variants?.length && p.variants.every((v) => !v.is_available || (v.stock_quantity != null && v.stock_quantity <= 0))) return true;
  return false;
}
