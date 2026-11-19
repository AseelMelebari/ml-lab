import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { C } from '@/i18n/common';

const KEYWORDS = new Set(
  'import from as def return for in if else elif print class with lambda None True False and or not while range'.split(' '),
);
const TOKEN = /(#[^\n]*)|('[^'\n]*'|"[^"\n]*")|(\b\d+\.?\d*\b)|([A-Za-z_]\w*)|([\s\S])/g;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Minimal, safe Python highlighter: a single-pass tokenizer that escapes every token. */
export function highlight(code: string): string {
  let out = '';
  let m: RegExpExecArray | null;
  TOKEN.lastIndex = 0;
  while ((m = TOKEN.exec(code))) {
    if (m[1]) out += `<span class="text-slate-500 italic">${esc(m[1])}</span>`;
    else if (m[2]) out += `<span class="text-amber-300">${esc(m[2])}</span>`;
    else if (m[3]) out += `<span class="text-cyan-300">${esc(m[3])}</span>`;
    else if (m[4]) out += KEYWORDS.has(m[4]) ? `<span class="text-violet-300">${m[4]}</span>` : esc(m[4]);
    else out += esc(m[5]);
  }
  return out;
}

export function CodeBlock({ code, language = 'python', caption }: { code: string; language?: string; caption?: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked */
    }
  };
  return (
    <figure className="overflow-hidden rounded-2xl border border-line bg-[#060b17]">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-2 text-xs text-slate-400">
        <span className="font-mono">{language}</span>
        <button type="button" onClick={copy} className="inline-flex items-center gap-1.5 hover:text-white" aria-label={t(C.copy)}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {t(copied ? C.copied : C.copy)}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed text-slate-200">
        <code dangerouslySetInnerHTML={{ __html: highlight(code) }} />
      </pre>
      {caption && <figcaption className="border-t border-white/5 px-4 py-2 text-xs text-slate-400">{caption}</figcaption>}
    </figure>
  );
}
