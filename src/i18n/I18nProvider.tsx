import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Lang, Text } from './types';

interface I18nValue {
  lang: Lang;
  dir: 'ltr' | 'rtl';
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  /** Pick the current language from a bilingual tuple. */
  t: (text: Text) => string;
  /** Format a number (Latin digits are kept in both languages for mathematical clarity). */
  num: (v: number, digits?: number) => string;
}

const I18nContext = createContext<I18nValue | null>(null);
const KEY = 'mllab.lang';

function readStoredLang(): Lang {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'ar' || v === 'en') return v;
  } catch {
    /* storage unavailable */
  }
  return 'en';
}

export function I18nProvider({ children, initial }: { children: ReactNode; initial?: Lang }) {
  const [lang, setLangState] = useState<Lang>(() => initial ?? readStoredLang());
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    try {
      localStorage.setItem(KEY, lang);
    } catch {
      /* ignore */
    }
  }, [lang, dir]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const toggleLang = useCallback(() => setLangState((l) => (l === 'en' ? 'ar' : 'en')), []);
  const value = useMemo<I18nValue>(() => {
    const nf = new Map<number, Intl.NumberFormat>();
    return {
      lang,
      dir,
      setLang,
      toggleLang,
      t: (text) => (lang === 'ar' ? text[1] : text[0]),
      num: (v, digits = 2) => {
        if (!Number.isFinite(v)) return v > 0 ? '∞' : v < 0 ? '−∞' : '—';
        let f = nf.get(digits);
        if (!f) {
          f = new Intl.NumberFormat('en-US', { maximumFractionDigits: digits, minimumFractionDigits: 0 });
          nf.set(digits, f);
        }
        return f.format(v);
      },
    };
  }, [lang, dir, setLang, toggleLang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}
