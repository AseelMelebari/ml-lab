import { useI18n } from '@/i18n/I18nProvider';

/** Confusion matrix table: rows = actual class, columns = predicted class. */
export function ConfusionMatrix({ matrix, classNames }: { matrix: number[][]; classNames: string[] }) {
  const { t } = useI18n();
  const max = Math.max(1, ...matrix.flat());
  return (
    <div className="overflow-x-auto">
      <table className="text-sm border-separate border-spacing-1">
        <caption className="sr-only">{t(['Confusion matrix', 'مصفوفة الالتباس'])}</caption>
        <thead>
          <tr>
            <th className="text-[11px] font-normal text-subtle p-1 text-start">
              {t(['actual ↓ / predicted →', 'الفعلي ↓ / المتنبأ →'])}
            </th>
            {classNames.map((c) => (
              <th key={c} scope="col" className="px-2 text-xs font-medium text-muted">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={i}>
              <th scope="row" className="pe-2 text-xs font-medium text-muted text-start">
                {classNames[i]}
              </th>
              {row.map((v, j) => {
                const diag = i === j;
                const a = 0.12 + 0.7 * (v / max);
                return (
                  <td
                    key={j}
                    className="ltr h-12 min-w-14 rounded-lg text-center font-mono font-semibold text-ink"
                    style={{
                      background: diag ? `color-mix(in oklab, var(--c-accent) ${a * 100}%, transparent)` : `color-mix(in oklab, var(--c-danger) ${a * 70}%, transparent)`,
                    }}
                    title={`${classNames[i]} → ${classNames[j]}: ${v}`}
                  >
                    {v}
                    <div className="text-[10px] font-normal text-muted">{diag ? '✓' : '✗'}</div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
