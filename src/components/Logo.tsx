import { useState } from 'react';
import clsx from 'clsx';

/**
 * Official logo from /brand/logo.png (never distorted: height-driven, auto width).
 * Falls back to a typographic wordmark until the logo file is added.
 */
export function Logo({ className, variant = 'dark', size = 'md' }: { className?: string; variant?: 'dark' | 'light'; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const [failed, setFailed] = useState(false);
  const heights = { sm: 'h-9', md: 'h-11 sm:h-12', lg: 'h-16', xl: 'h-24' };
  const src = variant === 'light' ? '/brand/logo-light.png' : '/brand/logo.png';
  if (!failed) {
    return (
      <img
        src={src}
        alt="دَفوة DAFWA"
        className={clsx(heights[size], 'w-auto object-contain', className)}
        onError={(e) => {
          // light variant is optional → retry with the main logo, then fall back to wordmark
          if (variant === 'light' && !e.currentTarget.src.endsWith('/brand/logo.png')) e.currentTarget.src = '/brand/logo.png';
          else setFailed(true);
        }}
      />
    );
  }
  const text = { sm: 'text-2xl', md: 'text-[28px]', lg: 'text-4xl', xl: 'text-5xl' };
  return (
    <span className={clsx('inline-flex flex-col items-center leading-none', variant === 'light' ? 'text-cream-200' : 'text-cocoa', className)} aria-label="دَفوة DAFWA">
      <span className={clsx('font-display font-bold', text[size])}>دَفوة</span>
      <span className={clsx('mt-1 font-latin text-[10px] font-semibold tracking-[0.45em]', variant === 'light' ? 'text-caramel-light' : 'text-caramel')}>DAFWA</span>
    </span>
  );
}
