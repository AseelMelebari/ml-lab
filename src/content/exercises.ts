/** Generated numeric exercises. Answers are computed with the same library code used by the labs. */
import type { Text } from '@/i18n/types';
import { mulberry32 } from '@/lib/ml/random';
import { distance } from '@/lib/ml/knn';
import { gini } from '@/lib/ml/decisionTree';
import { sigmoid } from '@/lib/ml/logisticRegression';
import { binaryScores } from '@/lib/ml/metrics';

export interface Exercise {
  id: string;
  topic: Text;
  prompt: Text;
  answer: number;
  tolerance: number;
  solution: Text;
  link: string;
}

const round = (v: number, d = 2) => Math.round(v * 10 ** d) / 10 ** d;

export function generateExercises(seed: number): Exercise[] {
  const rng = mulberry32(seed);
  const int = (lo: number, hi: number) => lo + Math.floor(rng() * (hi - lo + 1));

  const a = [int(-4, 4), int(-4, 4)];
  const b = [int(-4, 4), int(-4, 4)];
  if (a[0] === b[0] && a[1] === b[1]) b[0] += 3;
  const d = distance(a, b, 'euclidean');

  const c0 = int(2, 9);
  const c1 = int(1, 9);
  const g = gini([c0, c1]);

  const w = round(rng() * 2 - 1, 1) || 0.5;
  const x = int(-3, 3);
  const bias = round(rng() * 2 - 1, 1);
  const z = w * x + bias;
  const p = sigmoid(z);

  const tp = int(5, 40);
  const fp = int(1, 20);
  const fn = int(1, 20);
  const sc = binaryScores({ tp, fp, tn: 50, fn });

  const ys = [int(1, 9), int(1, 9), int(1, 9)];
  const yh = ys.map((v) => v + int(-2, 2));
  const mse = ys.reduce((s, v, i) => s + (v - yh[i]) ** 2, 0) / 3;

  const q = round(rng() * 4 - 1, 1);
  const r = round(rng() * 2 - 1, 1);
  const qn = round(rng() * 5, 1);
  const alpha = 0.5;
  const gamma = 0.9;
  const qNew = q + alpha * (r + gamma * qn - q);

  const pts = [int(0, 6), int(0, 6), int(0, 6)];
  const centroid = pts.reduce((s, v) => s + v, 0) / 3;

  const est = round(rng() * 4, 1);
  const nPulls = int(2, 9);
  const reward = round(rng() * 6 - 1, 1);
  const est2 = est + (reward - est) / (nPulls + 1);

  return [
    {
      id: 'euclid',
      topic: ['KNN · distance', 'KNN · المسافة'],
      prompt: [`Euclidean distance between (${a[0]}, ${a[1]}) and (${b[0]}, ${b[1]})? (2 decimals)`, `ما المسافة الإقليدية بين (${a[0]}, ${a[1]}) و(${b[0]}, ${b[1]})؟ (منزلتان عشريتان)`],
      answer: d,
      tolerance: 0.01,
      solution: [`√((${a[0]}−${b[0]})² + (${a[1]}−${b[1]})²) = √${(a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2} = ${d.toFixed(3)}`, `√((${a[0]}−${b[0]})² + (${a[1]}−${b[1]})²) = √${(a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2} = ${d.toFixed(3)}`],
      link: '/algorithms/knn',
    },
    {
      id: 'gini',
      topic: ['Decision tree · Gini', 'شجرة القرار · جيني'],
      prompt: [`A node has ${c0} points of class A and ${c1} of class B. Gini impurity? (3 decimals)`, `عقدة فيها ${c0} نقاط من الفئة A و${c1} من الفئة B. ما عدم نقاء جيني؟ (3 منازل عشرية)`],
      answer: g,
      tolerance: 0.002,
      solution: [`1 − (${c0}/${c0 + c1})² − (${c1}/${c0 + c1})² = ${g.toFixed(4)}`, `1 − (${c0}/${c0 + c1})² − (${c1}/${c0 + c1})² = ${g.toFixed(4)}`],
      link: '/algorithms/decision-tree',
    },
    {
      id: 'sigmoid',
      topic: ['Logistic regression · sigmoid', 'الانحدار اللوجستي · السيني'],
      prompt: [`With w = ${w}, b = ${bias} and x = ${x}, what is σ(wx + b)? (3 decimals)`, `مع w = ${w} وb = ${bias} وx = ${x}، ما قيمة σ(wx + b)؟ (3 منازل عشرية)`],
      answer: p,
      tolerance: 0.002,
      solution: [`z = ${w}·${x} + ${bias} = ${round(z, 3)};  σ(z) = 1/(1+e^(−z)) = ${p.toFixed(4)}`, `z = ${w}·${x} + ${bias} = ${round(z, 3)}؛  σ(z) = 1/(1+e^(−z)) = ${p.toFixed(4)}`],
      link: '/algorithms/logistic-regression',
    },
    {
      id: 'precision',
      topic: ['Evaluation · precision', 'التقييم · الضبط'],
      prompt: [`TP = ${tp}, FP = ${fp}, FN = ${fn}. Precision? (3 decimals)`, `TP = ${tp} وFP = ${fp} وFN = ${fn}. ما قيمة الضبط؟ (3 منازل عشرية)`],
      answer: sc.precision,
      tolerance: 0.002,
      solution: [`TP / (TP + FP) = ${tp}/${tp + fp} = ${sc.precision.toFixed(4)}  (recall would be ${sc.recall.toFixed(3)})`, `TP / (TP + FP) = ${tp}/${tp + fp} = ${sc.precision.toFixed(4)}  (والاستدعاء ${sc.recall.toFixed(3)})`],
      link: '/evaluation/classification',
    },
    {
      id: 'mse',
      topic: ['Regression · MSE', 'الانحدار · MSE'],
      prompt: [`True values ${ys.join(', ')}; predictions ${yh.join(', ')}. MSE? (2 decimals)`, `القيم الحقيقية ${ys.join('، ')}؛ والتنبؤات ${yh.join('، ')}. ما قيمة MSE؟ (منزلتان عشريتان)`],
      answer: mse,
      tolerance: 0.01,
      solution: [`(${ys.map((v, i) => `(${v}−${yh[i]})²`).join(' + ')}) / 3 = ${mse.toFixed(3)}`, `(${ys.map((v, i) => `(${v}−${yh[i]})²`).join(' + ')}) / 3 = ${mse.toFixed(3)}`],
      link: '/evaluation/regression',
    },
    {
      id: 'qupdate',
      topic: ['Q-learning · update', 'تعلّم Q · التحديث'],
      prompt: [`Q(s,a) = ${q}, reward r = ${r}, max Q(s′,·) = ${qn}, α = 0.5, γ = 0.9. New Q(s,a)? (3 decimals)`, `Q(s,a) = ${q} والمكافأة r = ${r} وmax Q(s′,·) = ${qn} وα = 0.5 وγ = 0.9. ما قيمة Q(s,a) الجديدة؟ (3 منازل عشرية)`],
      answer: qNew,
      tolerance: 0.002,
      solution: [`${q} + 0.5·(${r} + 0.9·${qn} − ${q}) = ${qNew.toFixed(4)}`, `${q} + 0.5·(${r} + 0.9·${qn} − ${q}) = ${qNew.toFixed(4)}`],
      link: '/algorithms/q-learning',
    },
    {
      id: 'centroid',
      topic: ['K-Means · update step', 'K-Means · خطوة التحديث'],
      prompt: [`A cluster contains points at x = ${pts.join(', ')} (1-D). Where does its centroid move? (2 decimals)`, `يحتوي عنقود على نقاط عند x = ${pts.join('، ')} (بُعد واحد). إلى أين ينتقل مركزه؟ (منزلتان عشريتان)`],
      answer: centroid,
      tolerance: 0.01,
      solution: [`(${pts.join(' + ')}) / 3 = ${centroid.toFixed(3)}`, `(${pts.join(' + ')}) / 3 = ${centroid.toFixed(3)}`],
      link: '/algorithms/k-means',
    },
    {
      id: 'bandit',
      topic: ['Bandit · sample average', 'قاطع الطريق · متوسط العينات'],
      prompt: [`An arm has estimate Q = ${est} after ${nPulls} pulls. It now pays ${reward}. New estimate? (3 decimals)`, `لذراع تقدير Q = ${est} بعد ${nPulls} سحبات، ثم دفعت الآن ${reward}. ما التقدير الجديد؟ (3 منازل عشرية)`],
      answer: est2,
      tolerance: 0.002,
      solution: [`Q + (r − Q)/N = ${est} + (${reward} − ${est})/${nPulls + 1} = ${est2.toFixed(4)}`, `Q + (r − Q)/N = ${est} + (${reward} − ${est})/${nPulls + 1} = ${est2.toFixed(4)}`],
      link: '/algorithms/bandit',
    },
  ];
}

export function checkAnswer(ex: Exercise, input: string): boolean | null {
  const v = Number(input.replace(',', '.').trim());
  if (input.trim() === '' || !Number.isFinite(v)) return null;
  return Math.abs(v - ex.answer) <= ex.tolerance + 1e-9;
}

export interface Challenge {
  id: string;
  labId: string;
  event: string;
  title: Text;
  hint: Text;
}

export const CHALLENGES: Challenge[] = [
  { id: 'diverge', labId: 'linear-regression', event: 'diverged', title: ['Make gradient descent diverge', 'اجعل الانحدار التدرّجي يتباعد'], hint: ['Choose a learning rate that is too large.', 'اختر معدل تعلّم كبيرًا جدًا.'] },
  { id: 'converge', labId: 'linear-regression', event: 'converged', title: ['Train linear regression to convergence', 'درّب الانحدار الخطي حتى التقارب'], hint: ['Use a safe learning rate and enough iterations.', 'استخدم معدل تعلّم آمنًا وتكرارات كافية.'] },
  { id: 'knn-scale', labId: 'knn', event: 'scaling', title: ['Break KNN with feature units — then fix it', 'أفسد KNN بوحدات الخصائص — ثم أصلحه'], hint: ['Raise the unit factor of x₁, then standardize.', 'ارفع معامل وحدة x₁ ثم وحّد الخصائص قياسيًا.'] },
  { id: 'tree-deep', labId: 'decision-tree', event: 'deep', title: ['Grow a tree deep enough to overfit', 'نمِّ شجرة عميقة بما يكفي لفرط الملاءمة'], hint: ['Increase max depth to 6 or more on noisy data.', 'زِد أقصى عمق إلى 6 أو أكثر على بيانات مشوّشة.'] },
  { id: 'forest-compare', labId: 'random-forest', event: 'compared', title: ['Compare a forest with a single tree', 'قارن غابة بشجرة واحدة'], hint: ['Use the “Forest vs single tree” view.', 'استخدم عرض «الغابة مقابل شجرة واحدة».'] },
  { id: 'svm-rbf', labId: 'svm', event: 'rbf', title: ['Separate circles with an RBF SVM', 'افصل الدوائر بـSVM بنواة RBF'], hint: ['Load “Circles” and switch the kernel.', 'حمّل «دوائر» وغيّر النواة.'] },
  { id: 'nb-query', labId: 'naive-bayes', event: 'queried', title: ['Probe a Naive Bayes posterior', 'افحص احتمالًا لاحقًا في بايز الساذج'], hint: ['Click the plot in Query mode.', 'انقر على الرسم في وضع الاستعلام.'] },
  { id: 'kmeans-conv', labId: 'k-means', event: 'converged', title: ['Run K-Means until it converges', 'شغّل K-Means حتى تتقارب'], hint: ['Press Play or step through half-steps.', 'اضغط تشغيل أو تقدّم بأنصاف الخطوات.'] },
  { id: 'pca-rotate', labId: 'pca', event: 'rotated', title: ['Find PC1 by rotating the manual axis', 'جد PC1 بتدوير المحور اليدوي'], hint: ['Maximise the variance on your axis.', 'عظّم التباين على محورك.'] },
  { id: 'hc-full', labId: 'hierarchical', event: 'complete', title: ['Build a complete dendrogram', 'ابنِ مخططًا شجريًا كاملًا'], hint: ['Merge until a single cluster remains.', 'ادمج حتى يبقى عنقود واحد.'] },
  { id: 'q-goal', labId: 'q-learning', event: 'policy-goal', title: ['Train an agent whose greedy policy reaches the goal', 'درّب وكيلًا تصل سياسته الجشعة إلى الهدف'], hint: ['Use “Fast episodes” and train for a while.', 'استخدم «حلقات سريعة» ودرّب لفترة.'] },
  { id: 'bandit-compare', labId: 'bandit', event: 'compared', title: ['Compare several ε values', 'قارن عدة قيم لـε'], hint: ['Press “Run comparison”.', 'اضغط «شغّل المقارنة».'] },
];
