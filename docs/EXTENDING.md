# Extending ML LAB

This guide walks through adding a new algorithm with an interactive lab. DBSCAN is the running example. The same steps apply to any algorithm.

## 1. Implement the algorithm (pure TypeScript)

Create `src/lib/ml/dbscan.ts`. Rules:

- **No React, no DOM.** Inputs and outputs are plain arrays and objects.
- **Deterministic.** Take a `seed` (use `mulberry32` from `random.ts`) or an `RNG` argument for anything random.
- **Honest.** Return enough state to explain what happened (e.g. core/border/noise flags, iteration counts, a `converged` flag). Never fake results for visual effect.
- **Bounded.** Guard loops with maximum iterations and validate inputs (empty data, a single class, NaN).

```ts
export interface DbscanResult { labels: number[]; core: boolean[]; nClusters: number }
export function dbscan(points: number[][], eps: number, minPts: number): DbscanResult { /* … */ }
```

## 2. Test it against known answers

Add `src/lib/ml/__tests__/dbscan.test.ts`. Prefer hand-computable examples (a few points on a line), invariants (every core point has ≥ minPts neighbours), and comparisons with reference values you computed with scikit-learn or SciPy.

```bash
npx vitest run src/lib/ml/__tests__/dbscan.test.ts
```

## 3. Build the lab component

Create `src/labs/DbscanLab.tsx` with `LabProps` (`presentation`, `preset`). Reuse the building blocks:

| Need | Use |
| --- | --- |
| Layout (viz + controls + results) | `LabShell`, `Panel`, `StatGrid`, `Hint` from `labs/shared/LabUI` |
| Data editing | `usePointSet` (with a point limit), `DatasetPanel`, `ModePicker`, `ClassPicker`, `PointsTable` |
| 2-D plot | `Plot2D`, `EditablePoints`, `Heatmap` (decision regions), `Contour`, `DataLine`, `Probe` |
| Charts | `LineChart`, `BarChart`, `ConfusionMatrix`, `TreeDiagram` |
| Animation | `useLoop(running, fn, ms)` and `PlayControls`; `usePresenterKeys` for Instructor Mode |
| Progress & challenges | `labEvent('dbscan', 'clustered')` when the learner really does something |
| Text | `const { t, num } = useI18n()` with inline `[english, arabic]` tuples |

Then register it in `src/labs/registry.ts`:

```ts
dbscan: lazy(() => import('./DbscanLab')),
```

## 4. Write the bilingual content

In `src/content/algorithms/unsupervised.ts`, fill in every field of `AlgorithmContent` (see `src/content/types.ts`). Set `labId: 'dbscan'` and add `labGuide` and `experiments`. Rich-text fields support `$inline$` maths, `$$display$$` maths, `**bold**`, `*italic*`, `` `code` `` and `- ` lists. Use `String.raw` for text that contains LaTeX.

The content-integrity tests (`src/test/content.test.ts`) fail if a field is empty in either language, a quiz answer index is out of range, a related id or lab id does not exist, or `$` delimiters are unbalanced.

## 5. Connect it

- **Roadmap:** add a node in `src/content/roadmap.ts` (it automatically shows as a lab once `labId` is set).
- **Instructor Mode (optional):** add a scenario in `src/content/demos.ts` with steps and talking points; support a `preset` in the lab if useful.
- **Practice (optional):** add a `Challenge` in `src/content/exercises.ts` tied to a lab event.
- **Tests:** update the expected lab list in `src/test/content.test.ts`, and add the lab to the "all labs render" Playwright test.

## Re-branding

Edit `src/config/brand.ts` (name, tagline, owner, links), the colour tokens at the top of `src/index.css` (`:root` for light, `.dark` for dark), and `public/favicon.svg`. If you change class colours, keep them colour-blind-safe and keep the RGB copies in `src/components/charts/colors.ts` in sync.

## Adding a language

UI text uses `[en, ar]` tuples (`src/i18n/types.ts`). To add a third language, extend the `Text` tuple type and the `t()` selector in `I18nProvider`. TypeScript will then flag every string that is missing a translation.
