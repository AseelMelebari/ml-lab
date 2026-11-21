import { useEffect } from 'react';

const SITE = 'دَفوة DAFWA';
const DEFAULT_DESC = 'دَفوة — كوكيز طازج فاخر يُخبز بحب في مكة المكرمة. اطلب قبل موعد التسليم بـ 24 ساعة، والتوصيل داخل مكة المكرمة فقط.';

function setMeta(attr: 'name' | 'property', key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = value;
}

export function useSeo(opts: { title?: string; description?: string; image?: string | null; jsonLd?: object | null; noindex?: boolean }) {
  const { title, description, image, jsonLd, noindex } = opts;
  const ld = jsonLd ? JSON.stringify(jsonLd) : null;
  useEffect(() => {
    const full = title ? `${title} | ${SITE}` : `${SITE} | كوكيز طازج في مكة المكرمة`;
    document.title = full;
    const desc = description || DEFAULT_DESC;
    setMeta('name', 'description', desc);
    setMeta('property', 'og:title', full);
    setMeta('property', 'og:description', desc);
    if (image) setMeta('property', 'og:image', image);
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
    const base = (import.meta.env.VITE_SITE_URL as string | undefined) ?? window.location.origin;
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = base.replace(/\/$/, '') + window.location.pathname;

    let script: HTMLScriptElement | null = null;
    if (ld) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset.dynamic = 'true';
      script.textContent = ld;
      document.head.appendChild(script);
    }
    return () => {
      script?.remove();
    };
  }, [title, description, image, ld, noindex]);
}
