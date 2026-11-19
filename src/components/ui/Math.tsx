import katex from 'katex';
import { Fragment, useMemo, type ReactNode } from 'react';

/** Render a TeX expression with KaTeX. Formulas are always laid out left-to-right. */
export function TeX({ tex, display = false, className }: { tex: string; display?: boolean; className?: string }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(tex, { displayMode: display, throwOnError: false, strict: 'ignore', output: 'htmlAndMathml' });
    } catch {
      return tex;
    }
  }, [tex, display]);
  const Tag = display ? 'div' : 'span';
  return <Tag dir="ltr" className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

/**
 * Lightweight rich-text renderer for educational content (trusted, bundled strings only):
 *  - paragraphs separated by blank lines
 *  - `$…$` inline math, `$$…$$` display math
 *  - `**bold**` and `` `code` ``
 */
export function Rich({ text, className }: { text: string; className?: string }) {
  const paragraphs = text.split(/\n\s*\n/);
  return (
    <div className={className ?? 'prose-ml space-y-3'}>
      {paragraphs.map((p, i) => {
        const display = p.trim().match(/^\$\$([\s\S]+)\$\$$/);
        if (display) return <TeX key={i} tex={display[1]} display />;
        if (p.trim().startsWith('- ')) {
          return (
            <ul key={i} className="list-disc ps-5 space-y-1.5">
              {p
                .trim()
                .split(/\n- /)
                .map((li, j) => (
                  <li key={j}>{inline(li.replace(/^- /, ''))}</li>
                ))}
            </ul>
          );
        }
        return <p key={i}>{inline(p)}</p>;
      })}
    </div>
  );
}

export function inline(s: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\$[^$]+\$|\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push(<Fragment key={k++}>{s.slice(last, m.index)}</Fragment>);
    const tok = m[0];
    if (tok.startsWith('$')) out.push(<TeX key={k++} tex={tok.slice(1, -1)} />);
    else if (tok.startsWith('**')) out.push(<strong key={k++} className="font-semibold text-ink">{tok.slice(2, -2)}</strong>);
    else
      out.push(
        <code key={k++} className="rounded bg-surface-2 px-1.5 py-0.5 text-[0.85em] text-accent-ink">
          {tok.slice(1, -1)}
        </code>,
      );
    last = m.index + tok.length;
  }
  if (last < s.length) out.push(<Fragment key={k++}>{s.slice(last)}</Fragment>);
  return out;
}
