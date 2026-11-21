export function env(name: string, required = true): string {
  const v = process.env[name];
  if (!v && required) throw new Error(`Missing environment variable ${name}`);
  return v ?? '';
}

export const siteUrl = () => (process.env.SITE_URL || process.env.URL || 'http://localhost:8888').replace(/\/$/, '');
