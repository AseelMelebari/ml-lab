import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { fetchCategories, fetchProducts, fetchSettings } from '../lib/api';
import type { Category, Product, StoreSettings } from '../lib/types';
import { supabaseConfigured } from '../lib/supabase';

/** Fallback used only while loading / if the database is unreachable (mirrors DB defaults). */
export const DEFAULT_SETTINGS: StoreSettings = {
  store_name_ar: 'دَفوة',
  store_name_en: 'DAFWA',
  description: 'كوكيز طازج، بطعم يضيف دفوة لكل لحظة.',
  phone: '0501131470',
  whatsapp_number: '966501131470',
  contact_email: null,
  instagram_url: null,
  accepting_orders: true,
  closure_message: 'نستقبل الطلبات قريبًا بإذن الله.',
  lead_time_hours: 24,
  booking_window_days: 21,
  max_orders_per_day: null,
  max_items_per_order: 100,
  allow_partial_payment: false,
  announcement_primary: 'التوصيل داخل مكة المكرمة فقط',
  announcement_secondary: 'الدفع والتأكيد عبر واتساب | الطلب قبل التسليم بـ 24 ساعة',
  hero_title: 'دفوة... لكل لحظة حلوة',
  hero_subtitle: 'كوكيز طازج، بطعم يضيف دفوة لكل لحظة.',
  hero_image_url: null,
  brand_story:
    'بدأت حكايتنا من حبّ التفاصيل البسيطة؛ ريحة الخَبز، قطعة كوكيز مع القهوة، ولمّة ناس نحبّهم.\nومن هالشعور جت «دفوة»…\nكوكيز نطمح يكون له مكان في لحظاتكم الحلوة، ويصير جزء من جمعتكم.',
  delivery_info: 'نوصّل داخل مكة المكرمة فقط، وللأحياء المعتمدة في نطاق التوصيل. يتم تحديد رسوم التوصيل حسب المنطقة وتظهر لك قبل إرسال الطلب.',
  faqs: [],
};

interface StoreState {
  settings: StoreSettings;
  categories: Category[];
  products: Product[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

const Ctx = createContext<StoreState | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabaseConfigured) {
      setError('NOT_CONFIGURED');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [s, c, p] = await Promise.all([fetchSettings(), fetchCategories(), fetchProducts()]);
      setSettings({ ...DEFAULT_SETTINGS, ...s, faqs: Array.isArray(s.faqs) ? s.faqs : [] });
      setCategories(c);
      setProducts(p);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return <Ctx.Provider value={{ settings, categories, products, loading, error, reload: load }}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore outside provider');
  return v;
}
