import { adminDb } from './_lib/supabase';
import { siteUrl } from './_lib/env';

export default async () => {
  const base = siteUrl();
  const { data } = await adminDb().from('products').select('slug, updated_at').eq('is_active', true).eq('is_archived', false);
  const urls = [
    { loc: `${base}/`, priority: '1.0' },
    { loc: `${base}/shop`, priority: '0.9' },
    { loc: `${base}/about`, priority: '0.6' },
    { loc: `${base}/contact`, priority: '0.6' },
    { loc: `${base}/privacy`, priority: '0.2' },
    ...(data ?? []).map((p) => ({ loc: `${base}/product/${p.slug}`, priority: '0.8', lastmod: p.updated_at?.slice(0, 10) })),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u: any) => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}<priority>${u.priority}</priority></url>`).join('\n')}
</urlset>`;
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
};
