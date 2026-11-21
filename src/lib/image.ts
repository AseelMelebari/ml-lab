export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // before optimisation
export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/heic', 'image/heif'];

/**
 * Validates and optimises an image in the browser: resizes to max 1600px and
 * re-encodes as WebP (~0.85). Falls back to the original file when the browser
 * cannot decode it (e.g. HEIC on some devices) and it is already a web format.
 */
export async function prepareImage(file: File, maxSize = 1600): Promise<{ blob: Blob; ext: string; type: string }> {
  if (!ACCEPTED_TYPES.includes(file.type)) throw new Error('نوع الملف غير مدعوم. استخدم JPG أو PNG أو WebP.');
  if (file.size > MAX_UPLOAD_BYTES) throw new Error('حجم الصورة كبير جدًا (الحد الأقصى 8MB).');
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/webp', 0.85));
    if (blob && blob.size < 5 * 1024 * 1024) return { blob, ext: 'webp', type: 'image/webp' };
  } catch {
    /* fall through */
  }
  if (['image/jpeg', 'image/png', 'image/webp'].includes(file.type) && file.size <= 5 * 1024 * 1024) {
    return { blob: file, ext: file.type.split('/')[1].replace('jpeg', 'jpg'), type: file.type };
  }
  throw new Error('تعذر تجهيز الصورة. جرّب صورة JPG أو PNG أصغر.');
}

export function randomId(len = 24): string {
  const a = new Uint8Array(len);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => 'abcdefghijklmnopqrstuvwxyz0123456789'[b % 36]).join('');
}

export function slugify(input: string): string {
  const s = input.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return s || `item-${randomId(6)}`;
}
