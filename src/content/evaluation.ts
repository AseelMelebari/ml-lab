import type { Text } from '@/i18n/types';

const r = String.raw;

export type EvalWidget = 'missing' | 'scaling' | 'encoding' | 'split' | 'split3' | 'imbalance' | 'gd' | 'biasvar' | 'ridge' | 'roc' | 'regmetrics' | 'cv' | 'search';

export interface EvalTopic {
  id: string;
  title: Text;
  body: Text;
  widget?: EvalWidget;
}

export interface EvalSection {
  id: string;
  title: Text;
  summary: Text;
  topics: EvalTopic[];
}

export const EVAL_SECTIONS: EvalSection[] = [
  {
    id: 'data-preparation',
    title: ['Data preparation', 'تجهيز البيانات'],
    summary: ['Clean, transform and split data so that models learn the right thing.', 'نظّف البيانات وحوّلها وقسّمها لكي تتعلّم النماذج الشيء الصحيح.'],
    topics: [
      {
        id: 'missing-values',
        title: ['Missing values and outliers', 'القيم المفقودة والقيم الشاذة'],
        body: [
          r`Real data has gaps (a sensor failed, a form field was skipped) and extreme values (typing errors or genuinely rare events). Options for **missing values**: drop rows (loses data, may bias it), **impute** with the mean/median/most frequent value, or use a model to predict the missing value. Adding a "was missing" indicator column can preserve information. **Outliers** should first be investigated — are they errors or real? — then removed, capped (winsorised), transformed (e.g. log), or handled with robust methods (median, MAE, tree models).`,
          r`البيانات الحقيقية فيها فجوات (تعطّل مستشعر، أو حقل نموذج لم يُملأ) وقيم متطرفة (أخطاء كتابة أو أحداث نادرة حقيقية). خيارات **القيم المفقودة**: حذف الصفوف (يفقد البيانات وقد يسبب انحيازًا)، أو **التعويض** بالمتوسط/الوسيط/القيمة الأكثر تكرارًا، أو استخدام نموذج للتنبؤ بالقيمة المفقودة. وإضافة عمود يشير إلى «كانت مفقودة» قد تحفظ معلومة مفيدة. أما **القيم الشاذة** فيجب التحقق منها أولًا — هل هي أخطاء أم حقيقية؟ — ثم حذفها أو تقييدها أو تحويلها (مثل اللوغاريتم) أو التعامل معها بطرق متينة (الوسيط، MAE، نماذج الأشجار).`,
        ],
        widget: 'missing',
      },
      {
        id: 'scaling',
        title: ['Normalization and standardization', 'التطبيع والتوحيد القياسي'],
        body: [
          r`Distance-based and gradient-based methods (KNN, SVM, K-Means, PCA, logistic regression trained by gradient descent) are sensitive to feature scales. **Normalization (min–max)** maps a feature to $[0,1]$: $x' = \frac{x-\min}{\max-\min}$. **Standardization (z-score)** gives mean 0 and standard deviation 1: $z = \frac{x-\mu}{\sigma}$. Tree-based models do not need scaling. Always compute $\min,\max,\mu,\sigma$ on the **training set only** and reuse them for validation and test data.`,
          r`الطرق القائمة على المسافة والتدرّج (KNN، SVM، K-Means، PCA، والانحدار اللوجستي المدرَّب بالانحدار التدرّجي) حساسة لمقاييس الخصائص. **التطبيع (الحد الأدنى–الأعلى)** يحوّل الخاصية إلى $[0,1]$: $x' = \frac{x-\min}{\max-\min}$. و**التوحيد القياسي (z-score)** يعطي متوسطًا 0 وانحرافًا معياريًا 1: $z = \frac{x-\mu}{\sigma}$. لا تحتاج نماذج الأشجار إلى تحجيم. واحسب دائمًا $\min$ و$\max$ و$\mu$ و$\sigma$ على **بيانات التدريب فقط** وأعد استخدامها لبيانات التحقق والاختبار.`,
        ],
        widget: 'scaling',
      },
      {
        id: 'encoding',
        title: ['Categorical encoding', 'ترميز المتغيرات الفئوية'],
        body: [
          r`Most algorithms need numbers. **One-hot encoding** creates a 0/1 column per category and implies no order. **Ordinal encoding** maps ordered categories to integers (S=0, M=1, L=2). For many categories (e.g. thousands of postcodes) consider **target encoding** (carefully, inside cross-validation, to avoid leakage) or learned embeddings.`,
          r`تحتاج معظم الخوارزميات إلى أرقام. **الترميز الأحادي (one-hot)** ينشئ عمود 0/1 لكل فئة ولا يفترض ترتيبًا. و**الترميز الترتيبي** يحوّل الفئات المرتّبة إلى أعداد صحيحة (صغير=0، وسط=1، كبير=2). ومع الفئات الكثيرة (مثل آلاف الرموز البريدية) فكّر في **ترميز الهدف** (بحذر وداخل التحقق المتقاطع لتجنب التسرب) أو التضمينات المتعلَّمة.`,
        ],
        widget: 'encoding',
      },
      {
        id: 'feature-selection',
        title: ['Feature selection', 'اختيار الخصائص'],
        body: [
          r`More features are not always better: irrelevant or redundant features add noise, slow training and hurt distance-based methods (the *curse of dimensionality*). Approaches: **filter methods** (correlation, mutual information), **wrapper methods** (try subsets and compare validation scores, e.g. recursive feature elimination), and **embedded methods** (L1/Lasso regularization, tree feature importance). Domain knowledge is often the best selector — and feature selection must also be done inside cross-validation.`,
          r`الخصائص الأكثر ليست دائمًا أفضل: الخصائص غير المهمة أو المكررة تضيف ضوضاء وتبطئ التدريب وتضر بالطرق القائمة على المسافة (*لعنة الأبعاد*). الأساليب: **طرق الترشيح** (الارتباط، المعلومات المتبادلة)، و**طرق التغليف** (تجربة مجموعات جزئية ومقارنة نتائج التحقق، مثل الحذف التكراري للخصائص)، و**الطرق المدمجة** (تنظيم L1/Lasso، وأهمية الخصائص في الأشجار). وغالبًا ما تكون المعرفة بالمجال أفضل مُرشِّح — ويجب أيضًا اختيار الخصائص داخل التحقق المتقاطع.`,
        ],
      },
      {
        id: 'train-test-split',
        title: ['Training/test split', 'التقسيم إلى تدريب واختبار'],
        body: [
          r`Hold out a test set the model never sees during training. Shuffle first (unless the data is ordered in time — then split chronologically), and use **stratified** splits for classification so class proportions are preserved.`,
          r`احجز بيانات اختبار لا يراها النموذج أثناء التدريب. اخلط البيانات أولًا (ما لم تكن مرتّبة زمنيًا — فعندها قسّمها زمنيًا)، واستخدم التقسيم **الطبقي** في التصنيف للحفاظ على نسب الفئات.`,
        ],
        widget: 'split',
      },
      {
        id: 'leakage',
        title: ['Data leakage', 'تسرب البيانات'],
        body: [
          r`**Leakage** happens when information that would not be available at prediction time sneaks into training, producing scores that are too good to be true. Classic causes:

- Fitting a scaler, imputer, PCA or feature selector on the **whole** dataset before splitting.
- Features computed from the future (e.g. "number of refunds" when predicting a purchase).
- Duplicate or near-duplicate rows appearing in both train and test sets.
- Random splits of time series, so the model trains on the future.

Prevention: split first, put every preprocessing step inside a **pipeline** fitted on training folds only, and ask for each feature "would I know this at prediction time?".`,
          r`يحدث **التسرب** عندما تتسلل إلى التدريب معلومات لن تكون متاحة وقت التنبؤ، فتنتج نتائج أفضل من أن تكون حقيقية. أسبابه الكلاسيكية:

- ملاءمة أداة التحجيم أو التعويض أو PCA أو اختيار الخصائص على البيانات **كلها** قبل التقسيم.
- خصائص محسوبة من المستقبل (مثل «عدد المبالغ المستردة» عند التنبؤ بعملية شراء).
- صفوف مكررة أو شبه مكررة تظهر في التدريب والاختبار معًا.
- تقسيم السلاسل الزمنية عشوائيًا، فيتدرب النموذج على المستقبل.

الوقاية: قسّم أولًا، وضع كل خطوة معالجة داخل **خط معالجة (pipeline)** يُلاءَم على طيات التدريب فقط، واسأل عن كل خاصية: «هل سأعرف هذا وقت التنبؤ؟».`,
        ],
      },
      {
        id: 'imbalance',
        title: ['Class imbalance', 'عدم توازن الفئات'],
        body: [
          r`When one class is rare (fraud, disease), a model can reach high accuracy by ignoring it. Use metrics that focus on the rare class (recall, precision, F1, PR-AUC), stratified splits, **class weights** (penalise errors on the rare class more), **resampling** (oversample the minority, undersample the majority, or synthesise examples, e.g. SMOTE) and **threshold tuning**.`,
          r`عندما تكون إحدى الفئات نادرة (احتيال، مرض) يستطيع النموذج بلوغ دقة عالية بتجاهلها. استخدم مقاييس تركّز على الفئة النادرة (الاستدعاء، الضبط، F1، PR-AUC)، والتقسيم الطبقي، و**أوزان الفئات** (معاقبة الأخطاء على الفئة النادرة أكثر)، و**إعادة المعاينة** (زيادة عينات الأقلية، أو تقليل الأغلبية، أو توليد أمثلة اصطناعية مثل SMOTE)، و**ضبط العتبة**.`,
        ],
        widget: 'imbalance',
      },
    ],
  },
  {
    id: 'training',
    title: ['Training concepts', 'مفاهيم التدريب'],
    summary: ['How models learn: losses, gradients, complexity and regularization.', 'كيف تتعلّم النماذج: الخسائر والتدرّجات والتعقيد والتنظيم.'],
    topics: [
      {
        id: 'gradient-descent',
        title: ['Gradient descent and the learning rate', 'الانحدار التدرّجي ومعدل التعلّم'],
        body: [
          r`Gradient descent minimises a loss $J(\theta)$ by repeatedly stepping against its gradient: $\theta \leftarrow \theta - \alpha\nabla J(\theta)$. The **learning rate** $\alpha$ is the step size: too small → slow; too large → oscillation or divergence. Variants: **batch** (all data per step), **stochastic** (one example per step) and **mini-batch** (a small group — the standard in deep learning), plus adaptive optimisers such as momentum and Adam.`,
          r`يقلل الانحدار التدرّجي خسارة $J(\theta)$ بالتحرك المتكرر عكس تدرّجها: $\theta \leftarrow \theta - \alpha\nabla J(\theta)$. و**معدل التعلّم** $\alpha$ هو حجم الخطوة: صغير جدًا ← بطء؛ وكبير جدًا ← تذبذب أو تباعد. ومن صيغه: **الدفعي** (كل البيانات في كل خطوة)، و**العشوائي** (مثال واحد لكل خطوة)، و**الدفعات الصغيرة** (مجموعة صغيرة — وهو المعيار في التعلّم العميق)، إضافة إلى المُحسِّنات التكيفية مثل الزخم وAdam.`,
        ],
        widget: 'gd',
      },
      {
        id: 'loss-functions',
        title: ['Loss functions', 'دوال الخسارة'],
        body: [
          r`The loss defines what "wrong" means and therefore what the model optimises.

- **Mean squared error** (regression): $\frac1n\sum(y-\hat y)^2$ — smooth, punishes large errors.
- **Mean absolute error** (regression): $\frac1n\sum|y-\hat y|$ — robust to outliers.
- **Log loss / cross-entropy** (classification): $-\frac1n\sum[y\log p + (1-y)\log(1-p)]$ — punishes confident wrong probabilities.
- **Hinge loss** (SVM): $\max(0, 1 - y f(\mathbf x))$ — zero once a point is beyond the margin.

The evaluation metric and the training loss are not always the same: we may train with log loss but report F1.`,
          r`تحدد الخسارة معنى «الخطأ» وبالتالي ما يحسّنه النموذج.

- **متوسط مربع الخطأ** (انحدار): $\frac1n\sum(y-\hat y)^2$ — ناعم ويعاقب الأخطاء الكبيرة.
- **متوسط الخطأ المطلق** (انحدار): $\frac1n\sum|y-\hat y|$ — متين أمام القيم الشاذة.
- **الخسارة اللوغاريتمية / الإنتروبيا المتقاطعة** (تصنيف): $-\frac1n\sum[y\log p + (1-y)\log(1-p)]$ — تعاقب الاحتمالات الخاطئة الواثقة.
- **خسارة المفصلة** (SVM): $\max(0, 1 - y f(\mathbf x))$ — صفر بمجرد تجاوز النقطة للهامش.

ليس مقياس التقييم وخسارة التدريب متطابقين دائمًا: قد ندرّب بالخسارة اللوغاريتمية ونعلن F1.`,
        ],
      },
      {
        id: 'over-under-fitting',
        title: ['Overfitting, underfitting and the bias–variance trade-off', 'فرط الملاءمة ونقصها ومقايضة الانحياز والتباين'],
        body: [
          r`The expected test error of a model can be decomposed as $\text{error} = \text{bias}^2 + \text{variance} + \text{irreducible noise}$. **Bias** is error from overly simple assumptions (underfitting); **variance** is error from sensitivity to the particular training sample (overfitting). Increasing complexity lowers bias but raises variance — the sweet spot minimises their sum. More data reduces variance; better features reduce bias.`,
          r`يمكن تحليل الخطأ المتوقع للنموذج على بيانات الاختبار إلى $\text{error} = \text{bias}^2 + \text{variance} + \text{irreducible noise}$. **الانحياز** خطأ ناتج عن افتراضات مبسطة أكثر من اللازم (نقص ملاءمة)، و**التباين** خطأ ناتج عن الحساسية لعينة التدريب بعينها (فرط ملاءمة). زيادة التعقيد تخفض الانحياز وترفع التباين — والنقطة المثلى تقلل مجموعهما. والبيانات الإضافية تقلل التباين، والخصائص الأفضل تقلل الانحياز.`,
        ],
        widget: 'biasvar',
      },
      {
        id: 'regularization',
        title: ['Regularization', 'التنظيم'],
        body: [
          r`Regularization adds a penalty on model complexity to the loss: **Ridge (L2)** $J + \lambda\sum w_j^2$ shrinks weights smoothly; **Lasso (L1)** $J + \lambda\sum |w_j|$ can set weights exactly to zero (feature selection). Other forms: limiting tree depth, dropout in neural networks, early stopping. Below, a degree-12 polynomial is tamed by increasing $\lambda$.`,
          r`يضيف التنظيم إلى الخسارة عقوبة على تعقيد النموذج: **Ridge (L2)** $J + \lambda\sum w_j^2$ يقلّص الأوزان بسلاسة، و**Lasso (L1)** $J + \lambda\sum |w_j|$ قد يجعل الأوزان أصفارًا تمامًا (اختيار خصائص). ومن صوره الأخرى: تحديد عمق الشجرة، والإسقاط (dropout) في الشبكات العصبية، والإيقاف المبكر. أدناه يُروَّض كثير حدود من الدرجة 12 بزيادة $\lambda$.`,
        ],
        widget: 'ridge',
      },
      {
        id: 'hyperparameters',
        title: ['Hyperparameters and generalization', 'المعاملات الفائقة والتعميم'],
        body: [
          r`**Parameters** are learned from data (weights, split thresholds, centroids). **Hyperparameters** are set before training and control the learning process or model capacity: learning rate, K in KNN, tree depth, C and γ in SVMs, number of trees, regularization strength. They are chosen by comparing **validation** performance (see *Model validation*), never test performance. The ultimate goal is **generalization**: good performance on new data from the same distribution.`,
          r`**المعاملات** تُتعلَّم من البيانات (الأوزان، عتبات التقسيم، المراكز). أما **المعاملات الفائقة** فتُضبط قبل التدريب وتتحكم في عملية التعلّم أو سعة النموذج: معدل التعلّم، وK في KNN، وعمق الشجرة، وC وγ في SVM، وعدد الأشجار، وقوة التنظيم. وتُختار بمقارنة أداء **التحقق** (انظر *التحقق من النماذج*) لا أداء الاختبار أبدًا. والهدف النهائي هو **التعميم**: أداء جيد على بيانات جديدة من التوزيع نفسه.`,
        ],
      },
    ],
  },
  {
    id: 'classification',
    title: ['Classification evaluation', 'تقييم التصنيف'],
    summary: ['Confusion matrix, precision, recall, F1, ROC and AUC — and what each one tells you.', 'مصفوفة الالتباس والضبط والاستدعاء وF1 وROC وAUC — وما يخبرك به كل منها.'],
    topics: [
      {
        id: 'confusion',
        title: ['Confusion matrix, accuracy, precision, recall and F1', 'مصفوفة الالتباس والدقة والضبط والاستدعاء وF1'],
        body: [
          r`For a binary problem, the **confusion matrix** counts true positives (TP), false positives (FP), true negatives (TN) and false negatives (FN).

- **Accuracy** $=\frac{TP+TN}{TP+FP+TN+FN}$ — share of correct predictions. Misleading with imbalanced classes.
- **Precision** $=\frac{TP}{TP+FP}$ — *when the model says positive, how often is it right?* Important when false alarms are costly (spam filters).
- **Recall** (sensitivity, TPR) $=\frac{TP}{TP+FN}$ — *of all real positives, how many were found?* Important when misses are costly (disease screening).
- **F1** $=2\cdot\frac{P\cdot R}{P+R}$ — harmonic mean; high only when both are high.

Precision and recall trade off through the decision **threshold**.`,
          r`في المسائل الثنائية تعدّ **مصفوفة الالتباس** الإيجابيات الصحيحة (TP) والإيجابيات الكاذبة (FP) والسلبيات الصحيحة (TN) والسلبيات الكاذبة (FN).

- **الدقة** $=\frac{TP+TN}{TP+FP+TN+FN}$ — نسبة التنبؤات الصحيحة، ومضللة مع الفئات غير المتوازنة.
- **الضبط** $=\frac{TP}{TP+FP}$ — *عندما يقول النموذج موجب، كم مرة يصيب؟* مهم عندما تكون الإنذارات الكاذبة مكلفة (مرشحات الرسائل المزعجة).
- **الاستدعاء** (الحساسية، TPR) $=\frac{TP}{TP+FN}$ — *من بين كل الحالات الموجبة الحقيقية، كم وُجد منها؟* مهم عندما يكون الإخفاق مكلفًا (فحص الأمراض).
- **F1** $=2\cdot\frac{P\cdot R}{P+R}$ — المتوسط التوافقي؛ ولا يرتفع إلا إذا ارتفع الاثنان.

ويتبادل الضبط والاستدعاء عبر **عتبة** القرار.`,
        ],
        widget: 'roc',
      },
      {
        id: 'roc-auc',
        title: ['ROC curve and AUC', 'منحنى ROC وAUC'],
        body: [
          r`The **ROC curve** plots the true positive rate against the false positive rate $\text{FPR}=\frac{FP}{FP+TN}$ for every possible threshold. The **area under the curve (AUC)** summarises ranking quality independent of the threshold: 0.5 is random guessing, 1.0 is perfect. With strong class imbalance, the **precision–recall curve** is often more informative.`,
          r`يرسم **منحنى ROC** معدل الإيجابيات الصحيحة مقابل معدل الإيجابيات الكاذبة $\text{FPR}=\frac{FP}{FP+TN}$ لكل عتبة ممكنة. وتلخّص **المساحة تحت المنحنى (AUC)** جودة الترتيب بمعزل عن العتبة: 0.5 تخمين عشوائي و1.0 مثالي. ومع عدم التوازن الشديد يكون **منحنى الضبط–الاستدعاء** غالبًا أكثر إفادة.`,
        ],
      },
      {
        id: 'imbalance-eval',
        title: ['Evaluating with class imbalance', 'التقييم مع عدم توازن الفئات'],
        body: [
          r`Always compare against the **majority-class baseline**. Report per-class precision and recall, the confusion matrix, and macro-averaged F1 for multi-class problems.`,
          r`قارن دائمًا بـ**النموذج المرجعي لفئة الأغلبية**. وأعلن الضبط والاستدعاء لكل فئة، ومصفوفة الالتباس، وF1 بالمتوسط الكلي (macro) في المسائل متعددة الفئات.`,
        ],
        widget: 'imbalance',
      },
    ],
  },
  {
    id: 'regression',
    title: ['Regression evaluation', 'تقييم الانحدار'],
    summary: ['MAE, MSE, RMSE and R² — units, outlier sensitivity and interpretation.', 'MAE وMSE وRMSE وR² — الوحدات والحساسية للقيم الشاذة والتفسير.'],
    topics: [
      {
        id: 'reg-metrics',
        title: ['MAE, MSE, RMSE and R²', 'MAE وMSE وRMSE وR²'],
        body: [
          r`- **MAE** $=\frac1n\sum|y_i-\hat y_i|$: average size of errors in the target's units; robust to outliers.
- **MSE** $=\frac1n\sum(y_i-\hat y_i)^2$: squares errors, so large mistakes dominate; units are squared.
- **RMSE** $=\sqrt{\text{MSE}}$: back in the target's units, still emphasises large errors.
- **R²** $=1-\frac{\sum(y_i-\hat y_i)^2}{\sum(y_i-\bar y)^2}$: fraction of variance explained relative to predicting the mean. Can be negative for a model worse than the mean.

Choose based on what errors cost: if a 10-unit error is more than twice as bad as a 5-unit error, prefer MSE/RMSE.`,
          r`- **MAE** $=\frac1n\sum|y_i-\hat y_i|$: متوسط حجم الأخطاء بوحدة الهدف؛ متين أمام القيم الشاذة.
- **MSE** $=\frac1n\sum(y_i-\hat y_i)^2$: يربّع الأخطاء فتهيمن الأخطاء الكبيرة؛ ووحدته مربعة.
- **RMSE** $=\sqrt{\text{MSE}}$: بوحدة الهدف، ولا يزال يبرز الأخطاء الكبيرة.
- **R²** $=1-\frac{\sum(y_i-\hat y_i)^2}{\sum(y_i-\bar y)^2}$: نسبة التباين المفسَّر مقارنةً بالتنبؤ بالمتوسط، وقد تكون سالبة لنموذج أسوأ من المتوسط.

اختر بحسب كلفة الأخطاء: إذا كان خطأ بمقدار 10 أسوأ من ضعف خطأ بمقدار 5 فالأفضل MSE/RMSE.`,
        ],
        widget: 'regmetrics',
      },
    ],
  },
  {
    id: 'validation',
    title: ['Model validation', 'التحقق من النماذج'],
    summary: ['Reliable estimates of performance and a fair way to choose hyperparameters.', 'تقديرات موثوقة للأداء وطريقة عادلة لاختيار المعاملات الفائقة.'],
    topics: [
      {
        id: 'three-way',
        title: ['Train / validation / test', 'التدريب / التحقق / الاختبار'],
        body: [
          r`Use the training set to fit, the validation set to choose among models and hyperparameters, and the test set exactly once at the end. If you look at test scores repeatedly while making decisions, the test set silently becomes a validation set and your final number becomes optimistic.`,
          r`استخدم بيانات التدريب للملاءمة، وبيانات التحقق للاختيار بين النماذج والمعاملات الفائقة، وبيانات الاختبار مرة واحدة فقط في النهاية. وإذا نظرت إلى نتائج الاختبار مرارًا أثناء اتخاذ القرارات تتحول بيانات الاختبار بصمت إلى بيانات تحقق، ويصبح رقمك النهائي متفائلًا أكثر من اللازم.`,
        ],
        widget: 'split3',
      },
      {
        id: 'cross-validation',
        title: ['Cross-validation', 'التحقق المتقاطع'],
        body: [
          r`**k-fold cross-validation** splits the training data into $k$ folds; each fold serves once as the validation set while the model trains on the others. The average score is a lower-variance estimate than a single split, and its spread shows the uncertainty. Use **stratified** folds for classification and **time-series splits** for temporal data.`,
          r`يقسم **التحقق المتقاطع k-fold** بيانات التدريب إلى $k$ طيات؛ تُستخدم كل طية مرة واحدة كبيانات تحقق بينما يتدرب النموذج على البقية. ومتوسط النتيجة تقدير أقل تباينًا من تقسيم واحد، ويُظهر انتشاره مقدار عدم اليقين. استخدم طيات **طبقية** للتصنيف و**تقسيمات السلاسل الزمنية** للبيانات الزمنية.`,
        ],
        widget: 'cv',
      },
      {
        id: 'tuning',
        title: ['Hyperparameter tuning: grid search and random search', 'ضبط المعاملات الفائقة: البحث الشبكي والعشوائي'],
        body: [
          r`**Grid search** evaluates every combination from a list of values — exhaustive but expensive, growing exponentially with the number of hyperparameters. **Random search** samples combinations at random; for the same budget it often finds equally good settings because usually only a few hyperparameters really matter. Both should score candidates with cross-validation. More advanced: Bayesian optimisation and successive halving.`,
          r`يقيّم **البحث الشبكي** كل توليفة من قائمة قيم — شامل لكنه مكلف، ويتضاعف أُسيًا مع عدد المعاملات الفائقة. أما **البحث العشوائي** فيسحب توليفات عشوائيًا، وبالميزانية نفسها يجد غالبًا إعدادات بالجودة نفسها لأن عددًا قليلًا فقط من المعاملات الفائقة يكون مهمًا عادةً. ويجب في الحالتين تقييم المرشحين بالتحقق المتقاطع. ومن الطرق الأكثر تقدمًا: التحسين البايزي والتنصيف المتتالي.`,
        ],
        widget: 'search',
      },
    ],
  },
];

export const getEvalSection = (id: string) => EVAL_SECTIONS.find((s) => s.id === id);
