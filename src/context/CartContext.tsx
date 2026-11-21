import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

/** Display snapshot only — the server always re-prices from the database. */
export interface CartItem {
  key: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  notes: string | null;
  name: string;
  variant_name: string | null;
  slug: string;
  image: string | null;
  unit_price_halalas: number;
  min_quantity: number;
  max_quantity: number;
}

interface CartState {
  items: CartItem[];
  count: number;
  subtotal: number;
  promoCode: string | null;
  setPromoCode: (c: string | null) => void;
  add: (item: Omit<CartItem, 'key'>) => void;
  setQuantity: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  drawerOpen: boolean;
  setDrawerOpen: (o: boolean) => void;
}

const STORAGE = 'dafwa-cart-v1';
const Ctx = createContext<CartState | null>(null);

function load(): { items: CartItem[]; promoCode: string | null } {
  try {
    const raw = localStorage.getItem(STORAGE);
    if (!raw) return { items: [], promoCode: null };
    const parsed = JSON.parse(raw);
    return { items: Array.isArray(parsed.items) ? parsed.items : [], promoCode: parsed.promoCode ?? null };
  } catch {
    return { items: [], promoCode: null };
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(load, []);
  const [items, setItems] = useState<CartItem[]>(initial.items);
  const [promoCode, setPromoCode] = useState<string | null>(initial.promoCode);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE, JSON.stringify({ items, promoCode }));
    } catch {
      /* storage unavailable */
    }
  }, [items, promoCode]);

  // Keep tabs in sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE) {
        const v = load();
        setItems(v.items);
        setPromoCode(v.promoCode);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const add = useCallback((item: Omit<CartItem, 'key'>) => {
    const key = `${item.product_id}:${item.variant_id ?? ''}:${item.notes ?? ''}`;
    setItems((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) => (i.key === key ? { ...i, ...item, key, quantity: Math.min(i.quantity + item.quantity, item.max_quantity) } : i));
      }
      return [...prev, { ...item, key }];
    });
  }, []);

  const setQuantity = useCallback((key: string, qty: number) => {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, quantity: Math.max(i.min_quantity, Math.min(i.max_quantity, qty)) } : i)));
  }, []);
  const remove = useCallback((key: string) => setItems((prev) => prev.filter((i) => i.key !== key)), []);
  const clear = useCallback(() => {
    setItems([]);
    setPromoCode(null);
  }, []);

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price_halalas, 0);

  return (
    <Ctx.Provider value={{ items, count, subtotal, promoCode, setPromoCode, add, setQuantity, remove, clear, drawerOpen, setDrawerOpen }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCart() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useCart outside provider');
  return v;
}
