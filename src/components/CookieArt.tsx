import clsx from 'clsx';

/** Hand-drawn style SVG cookie used for illustrations & image placeholders (not product photography). */
export function Cookie({ className, seed = 0, tone = 'golden' }: { className?: string; seed?: number; tone?: 'golden' | 'cocoa' | 'light' }) {
  const palette = {
    golden: { base: '#C99A6B', edge: '#A9764E', hi: '#DDB68C', chip: '#3B2014' },
    cocoa: { base: '#6E4029', edge: '#4E2A19', hi: '#8A5638', chip: '#F3E6D3' },
    light: { base: '#E3C29C', edge: '#C89D72', hi: '#F0D8BA', chip: '#5A311D' },
  }[tone];
  const chips = [
    [70, 72, 9], [118, 64, 7], [140, 104, 10], [96, 116, 8], [62, 128, 7], [124, 146, 9], [88, 86, 5], [150, 74, 5], [104, 160, 6], [50, 98, 6],
  ];
  const rot = (seed * 47) % 360;
  return (
    <svg viewBox="0 0 200 200" className={clsx('drop-shadow-[0_18px_22px_rgba(66,36,23,0.28)]', className)} aria-hidden="true">
      <defs>
        <radialGradient id={`cg${seed}${tone}`} cx="40%" cy="35%" r="75%">
          <stop offset="0" stopColor={palette.hi} />
          <stop offset=".6" stopColor={palette.base} />
          <stop offset="1" stopColor={palette.edge} />
        </radialGradient>
      </defs>
      <g transform={`rotate(${rot} 100 100)`}>
        <path
          d="M100 12c20 2 30 8 44 16 15 9 26 20 32 38 6 17 5 32 1 48-4 17-12 30-26 42-14 11-27 18-47 20-21 2-36-3-52-13-15-10-25-23-31-41-6-18-4-34 2-50 7-17 17-30 33-42 15-11 27-19 44-18z"
          fill={`url(#cg${seed}${tone})`}
        />
        <path d="M44 66c10-18 27-32 50-35" stroke={palette.hi} strokeWidth="4" strokeLinecap="round" fill="none" opacity=".55" />
        {chips.map(([x, y, r], i) => (
          <path
            key={i}
            d={`M${x - r} ${y}c0-${r * 0.7} ${r * 0.5}-${r} ${r}-${r}s${r} ${r * 0.4} ${r} ${r}-${r * 0.4} ${r * 0.9}-${r} ${r * 0.9}-${r}-${r * 0.3}-${r}-${r * 0.9}z`}
            fill={palette.chip}
            opacity={0.92}
          />
        ))}
        <circle cx="80" cy="150" r="2" fill={palette.edge} opacity=".5" />
        <circle cx="132" cy="52" r="1.6" fill={palette.edge} opacity=".5" />
        <circle cx="156" cy="128" r="2.2" fill={palette.edge} opacity=".5" />
      </g>
    </svg>
  );
}

export function Crumbs({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 60" className={className} aria-hidden="true">
      <circle cx="12" cy="30" r="4" fill="#BC8965" />
      <circle cx="34" cy="14" r="2.5" fill="#A9764E" />
      <circle cx="58" cy="40" r="3.2" fill="#C99A6B" />
      <circle cx="84" cy="22" r="2" fill="#3B2014" />
      <circle cx="104" cy="44" r="3" fill="#BC8965" />
    </svg>
  );
}

/** Elegant placeholder when a product has no photo yet. */
export function ProductPlaceholder({ className, seed = 0 }: { className?: string; seed?: number }) {
  const tones = ['golden', 'cocoa', 'light'] as const;
  return (
    <div className={clsx('grain flex items-center justify-center bg-gradient-to-br from-cream-200 via-cream-100 to-beige', className)}>
      <Cookie className="h-3/5 w-3/5" seed={seed} tone={tones[seed % 3]} />
    </div>
  );
}
