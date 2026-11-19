import { Suspense, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Languages, ListChecks, Maximize2, Minimize2, Moon, Sun, X } from 'lucide-react';
import { DEMOS } from '@/content/demos';
import { LAB_COMPONENTS } from '@/labs/registry';
import { Spinner, cx } from '@/components/ui/primitives';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { LogoMark } from '@/components/layout/Logo';
import { useI18n } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { labEvent } from '@/labs/shared/hooks';
import NotFound from './NotFound';

/** Presentation layout: no site chrome, larger type, demo navigation and talking points. */
export default function InstructorDemoPage() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const { t, toggleLang, lang } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const idx = DEMOS.findIndex((d) => d.id === id);
  const demo = DEMOS[idx];
  const [notes, setNotes] = useState(true);
  const [fs, setFs] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add('presenting');
    return () => document.documentElement.classList.remove('presenting');
  }, []);
  useEffect(() => {
    const h = () => setFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);
  useEffect(() => {
    if (demo) labEvent('instructor', demo.id);
  }, [demo]);
  const go = (d: number) => {
    const n = DEMOS[(idx + d + DEMOS.length) % DEMOS.length];
    nav(`/instructor/${n.id}`);
  };
  const toggleFs = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      /* fullscreen not permitted */
    }
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowRight') go(lang === 'ar' ? -1 : 1);
      else if (e.key === 'ArrowLeft') go(lang === 'ar' ? 1 : -1);
      else if (e.key === 'f' || e.key === 'F') toggleFs();
      else if (e.key === 'Escape' && !document.fullscreenElement) nav('/instructor');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!demo) return <NotFound />;
  const Lab = LAB_COMPONENTS[demo.labId];
  return (
    <div className="min-h-screen bg-bg" data-testid="instructor-demo">
      <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1800px] flex-wrap items-center gap-3 px-4 py-2.5">
          <Link to="/instructor" className="flex items-center gap-2" aria-label={t(['Exit presentation', 'الخروج من العرض'])}>
            <LogoMark size={30} />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-purple">
              {t(['Demo', 'العرض'])} <span className="ltr">{idx + 1}/{DEMOS.length}</span>
            </div>
            <h1 className="truncate text-xl font-semibold text-ink">{t(demo.title)}</h1>
          </div>
          <div className="flex items-center gap-1">
            <select aria-label={t(['Choose demo', 'اختر العرض'])} value={demo.id} onChange={(e) => nav(`/instructor/${e.target.value}`)} className="hidden h-10 max-w-56 rounded-xl border border-line bg-surface-2 px-2 text-sm md:block">
              {DEMOS.map((d, i) => (
                <option key={d.id} value={d.id}>
                  {i + 1}. {t(d.title)}
                </option>
              ))}
            </select>
            <IconBtn label={t(['Previous demo', 'العرض السابق'])} onClick={() => go(-1)}>
              <ChevronLeft size={20} className="rtl:-scale-x-100" />
            </IconBtn>
            <IconBtn label={t(['Next demo', 'العرض التالي'])} onClick={() => go(1)}>
              <ChevronRight size={20} className="rtl:-scale-x-100" />
            </IconBtn>
            <IconBtn label={t(['Talking points', 'نقاط الحديث'])} onClick={() => setNotes((n) => !n)} active={notes}>
              <ListChecks size={19} />
            </IconBtn>
            <IconBtn label={lang === 'en' ? 'العربية' : 'English'} onClick={toggleLang}>
              <Languages size={19} />
            </IconBtn>
            <IconBtn label={t(['Toggle theme', 'تبديل السمة'])} onClick={toggleTheme}>
              {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
            </IconBtn>
            <IconBtn label={t(['Full screen', 'ملء الشاشة'])} onClick={toggleFs}>
              {fs ? <Minimize2 size={19} /> : <Maximize2 size={19} />}
            </IconBtn>
            <IconBtn label={t(['Exit presentation', 'الخروج من العرض'])} onClick={() => nav('/instructor')}>
              <X size={19} />
            </IconBtn>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1800px] px-4 py-4">
        {notes && (
          <details open className="mb-4 rounded-2xl border border-purple/30 bg-purple/5 p-4">
            <summary className="cursor-pointer text-base font-semibold text-ink">{t(demo.goal)}</summary>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <div>
                <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-purple">{t(['Steps', 'الخطوات'])}</h2>
                <ol className="list-decimal space-y-1 ps-5 text-ink">
                  {demo.steps.map((s, i) => (
                    <li key={i}>{t(s)}</li>
                  ))}
                </ol>
              </div>
              <div>
                <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-purple">{t(['Talking points', 'نقاط الحديث'])}</h2>
                <ul className="space-y-1 text-ink">
                  {demo.talkingPoints.map((s, i) => (
                    <li key={i}>• {t(s)}</li>
                  ))}
                </ul>
              </div>
            </div>
          </details>
        )}
        <ErrorBoundary key={demo.id}>
          <Suspense fallback={<Spinner />}>
            <Lab key={demo.id} presentation preset={demo.preset} />
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  );
}

function IconBtn({ label, onClick, children, active }: { label: string; onClick: () => void; children: React.ReactNode; active?: boolean }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className={cx('inline-flex h-10 w-10 items-center justify-center rounded-xl text-muted hover:bg-surface-2 hover:text-ink', active && 'bg-purple/15 text-purple')}>
      {children}
    </button>
  );
}
