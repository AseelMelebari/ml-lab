import { BRAND } from '@/config/brand';

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <defs>
        <linearGradient id="lg-mark" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#a78bfa" />
          <stop offset="1" stopColor="#2dd4bf" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="#0b1630" />
      <rect x="0.75" y="0.75" width="62.5" height="62.5" rx="15.5" fill="none" stroke="rgba(255,255,255,.08)" />
      <path d="M14 46 L26 25 L38 37 L50 17" fill="none" stroke="url(#lg-mark)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="14" cy="46" r="4.5" fill="#a78bfa" />
      <circle cx="26" cy="25" r="4.5" fill="#7dd3fc" />
      <circle cx="38" cy="37" r="4.5" fill="#5eead4" />
      <circle cx="50" cy="17" r="4.5" fill="#2dd4bf" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark />
      <span className="ltr text-[17px] font-bold tracking-tight text-ink">
        {BRAND.name.split(' ')[0]}
        <span className="text-accent"> {BRAND.name.split(' ').slice(1).join(' ')}</span>
      </span>
    </span>
  );
}
