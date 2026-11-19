import type { AlgorithmContent } from '../types';

const r = String.raw;

export const linearRegression: AlgorithmContent = {
  id: 'linear-regression',
  name: ['Linear Regression', 'الانحدار الخطي'],
  short: ['Predicts a continuous number by fitting the straight line (or plane) that minimizes squared error.', 'يتنبأ بقيمة عددية مستمرة عبر ملاءمة الخط المستقيم (أو المستوى) الذي يقلل مربع الخطأ.'],
  paradigm: 'supervised',
  categories: ['regression'],
  difficulty: 'beginner',
  labId: 'linear-regression',
  objectives: [
    ['Explain how a line ŷ = wx + b turns an input into a prediction.', 'شرح كيف يحوّل الخط ŷ = wx + b المُدخل إلى تنبؤ.'],
    ['Describe the Mean Squared Error and why we minimize it.', 'وصف متوسط مربع الخطأ ولماذا نسعى إلى تقليله.'],
    ['Watch gradient descent update the slope and intercept step by step.', 'مشاهدة الانحدار التدرّجي وهو يحدّث الميل والمقطع خطوة بخطوة.'],
    ['Interpret MAE, MSE, RMSE and R², and recognise underfitting.', 'تفسير MAE وMSE وRMSE وR²، والتعرّف على نقص الملاءمة.'],
  ],
  intuition: [
    r`Imagine plotting house sizes against prices. The points roughly follow an upward trend. **Linear regression** draws the single straight line that best follows that trend, so you can read off a predicted price for any size.

"Best" has a precise meaning: for every point we measure the vertical gap between the true value and the line (the **residual**), square it, and average. The line with the smallest average squared gap wins.

With one input this is **simple linear regression**; with several inputs (size, age, distance to centre…) it becomes **multiple linear regression**, which fits a flat plane or hyperplane instead of a line.`,
    r`تخيّل أنك رسمت مساحات المنازل مقابل أسعارها. ستتبع النقاط تقريبًا اتجاهًا صاعدًا. يرسم **الانحدار الخطي** الخط المستقيم الوحيد الذي يتبع هذا الاتجاه بأفضل شكل، لتتمكن من قراءة سعر متوقع لأي مساحة.

لكلمة «أفضل» معنى دقيق: نقيس لكل نقطة الفجوة الرأسية بين القيمة الحقيقية والخط (وتسمى **الباقي**)، ثم نربّعها ونأخذ متوسطها. الخط صاحب أصغر متوسط لمربعات الفجوات هو الفائز.

مع مُدخل واحد يسمى **انحدارًا خطيًا بسيطًا**، ومع عدة مدخلات (المساحة، العمر، المسافة إلى المركز…) يصبح **انحدارًا خطيًا متعددًا** يلائم مستوى أو مستوى فائقًا بدل الخط.`,
  ],
  useCases: [
    ['Estimating house prices from size and location.', 'تقدير أسعار المنازل من المساحة والموقع.'],
    ['Forecasting sales from advertising spend.', 'توقع المبيعات بناءً على الإنفاق الإعلاني.'],
    ['Measuring how strongly a variable (e.g. study hours) relates to an outcome.', 'قياس قوة ارتباط متغير (مثل ساعات المذاكرة) بنتيجة ما.'],
    ['A fast, interpretable baseline before trying complex models.', 'نموذج مرجعي سريع وقابل للتفسير قبل تجربة النماذج المعقدة.'],
  ],
  steps: [
    ['Start with any slope w and intercept b (often 0).', 'ابدأ بأي ميل w ومقطع b (غالبًا 0).'],
    ['Predict ŷ = wx + b for every training point.', 'احسب التنبؤ ŷ = wx + b لكل نقطة تدريب.'],
    ['Compute the loss: the mean of the squared residuals.', 'احسب الخسارة: متوسط مربعات البواقي.'],
    ['Compute the gradient: how the loss changes if w or b change slightly.', 'احسب التدرّج: كيف تتغير الخسارة إذا تغيّر w أو b قليلًا.'],
    ['Step downhill: subtract learning-rate × gradient from w and b.', 'انزل في اتجاه الانحدار: اطرح معدل التعلّم × التدرّج من w وb.'],
    ['Repeat until the loss stops decreasing (or use the closed-form solution directly).', 'كرّر حتى تتوقف الخسارة عن الانخفاض (أو استخدم الحل المغلق مباشرة).'],
  ],
  math: [
    r`The model and the loss:

$$\hat y = w x + b, \qquad J(w,b) = \frac{1}{n}\sum_{i=1}^{n} \big(\hat y_i - y_i\big)^2$$

The gradient tells us the direction of steepest increase, so we move the opposite way:

$$\frac{\partial J}{\partial w} = \frac{2}{n}\sum_i (\hat y_i - y_i)\,x_i, \qquad \frac{\partial J}{\partial b} = \frac{2}{n}\sum_i (\hat y_i - y_i)$$

$$w \leftarrow w - \alpha\,\frac{\partial J}{\partial w}, \qquad b \leftarrow b - \alpha\,\frac{\partial J}{\partial b}$$

Because $J$ is a convex bowl, there is one minimum, which can also be found exactly (ordinary least squares):

$$\hat w = \frac{\sum_i (x_i-\bar x)(y_i-\bar y)}{\sum_i (x_i-\bar x)^2}, \qquad \hat b = \bar y - \hat w\,\bar x$$

For several features, $\hat{\boldsymbol\beta} = (X^\top X)^{-1}X^\top \mathbf y$.`,
    r`النموذج والخسارة:

$$\hat y = w x + b, \qquad J(w,b) = \frac{1}{n}\sum_{i=1}^{n} \big(\hat y_i - y_i\big)^2$$

يخبرنا التدرّج باتجاه أشد زيادة، لذلك نتحرك في الاتجاه المعاكس:

$$\frac{\partial J}{\partial w} = \frac{2}{n}\sum_i (\hat y_i - y_i)\,x_i, \qquad \frac{\partial J}{\partial b} = \frac{2}{n}\sum_i (\hat y_i - y_i)$$

$$w \leftarrow w - \alpha\,\frac{\partial J}{\partial w}, \qquad b \leftarrow b - \alpha\,\frac{\partial J}{\partial b}$$

ولأن $J$ وعاء محدّب، توجد نقطة دنيا واحدة يمكن إيجادها بدقة أيضًا (المربعات الصغرى العادية):

$$\hat w = \frac{\sum_i (x_i-\bar x)(y_i-\bar y)}{\sum_i (x_i-\bar x)^2}, \qquad \hat b = \bar y - \hat w\,\bar x$$

ولعدة خصائص: $\hat{\boldsymbol\beta} = (X^\top X)^{-1}X^\top \mathbf y$.`,
  ],
  labGuide: [
    { param: ['Learning rate α', 'معدل التعلّم α'], effect: ['Step size. Above ≈0.03 on this data, steps overshoot and the loss explodes (divergence).', 'حجم الخطوة. فوق ≈0.03 على هذه البيانات تتجاوز الخطوات الهدف وتنفجر الخسارة (تباعد).'] },
    { param: ['Max iterations', 'أقصى عدد للتكرارات'], effect: ['Upper limit on gradient steps; training stops earlier if the gradient becomes ≈ 0.', 'حد أعلى لخطوات التدرّج؛ يتوقف التدريب قبله إذا أصبح التدرّج ≈ 0.'] },
    { param: ['Closed-form solution', 'الحل المغلق'], effect: ['Overlays the exact least-squares line for comparison.', 'يعرض خط المربعات الصغرى الدقيق للمقارنة.'] },
    { param: ['Dataset / points', 'البيانات / النقاط'], effect: ['Add, drag or delete points; the line and loss surface respond immediately.', 'أضف النقاط أو اسحبها أو احذفها؛ يستجيب الخط وسطح الخسارة فورًا.'] },
  ],
  experiments: [
    ['Press Play with α = 0.01 and watch the dot roll down the loss surface toward the ✕.', 'اضغط تشغيل مع α = 0.01 وراقب النقطة وهي تنزل على سطح الخسارة نحو ✕.'],
    ['Set α = 0.05 and train: the loss explodes. Why does a bigger step make things worse?', 'اجعل α = 0.05 ودرّب: تنفجر الخسارة. لماذا تجعل الخطوة الأكبر الأمور أسوأ؟'],
    ['Load "With outliers" and drag one point far away: how much does the line move?', 'حمّل «مع قيم شاذة» واسحب نقطة بعيدًا: كم يتحرك الخط؟'],
    ['Load "Curved": even the best straight line underfits (low R²).', 'حمّل «منحني»: حتى أفضل خط مستقيم يعاني نقص الملاءمة (R² منخفض).'],
  ],
  evaluation: [
    r`- **MAE** $=\frac1n\sum|y_i-\hat y_i|$: average absolute error, in the units of $y$.
- **MSE** $=\frac1n\sum(y_i-\hat y_i)^2$: punishes large errors more; it is what training minimizes.
- **RMSE** $=\sqrt{\text{MSE}}$: like MSE but back in the units of $y$.
- **R²** $=1-\frac{\sum(y_i-\hat y_i)^2}{\sum(y_i-\bar y)^2}$: fraction of variance explained. 1 is perfect, 0 is no better than predicting the mean.`,
    r`- **MAE** $=\frac1n\sum|y_i-\hat y_i|$: متوسط الخطأ المطلق بوحدة $y$ نفسها.
- **MSE** $=\frac1n\sum(y_i-\hat y_i)^2$: يعاقب الأخطاء الكبيرة أكثر، وهو ما يقلله التدريب.
- **RMSE** $=\sqrt{\text{MSE}}$: مثل MSE لكن بوحدة $y$.
- **R²** $=1-\frac{\sum(y_i-\hat y_i)^2}{\sum(y_i-\bar y)^2}$: نسبة التباين المفسَّر. القيمة 1 مثالية، والقيمة 0 لا تفضل التنبؤ بالمتوسط.`,
  ],
  advantages: [
    ['Fast, simple and easy to interpret: each coefficient is "change in y per unit of x".', 'سريع وبسيط وسهل التفسير: كل معامل يمثل «التغير في y لكل وحدة من x».'],
    ['Has an exact closed-form solution.', 'له حل مغلق دقيق.'],
    ['Works well when the relationship really is close to linear.', 'يعمل جيدًا عندما تكون العلاقة خطية تقريبًا بالفعل.'],
  ],
  limitations: [
    ['Cannot capture curved relationships without engineered features.', 'لا يستطيع التقاط العلاقات المنحنية دون هندسة خصائص.'],
    ['Sensitive to outliers because errors are squared.', 'حساس للقيم الشاذة لأن الأخطاء تُربَّع.'],
    ['Assumes independent errors with roughly constant variance.', 'يفترض أخطاء مستقلة ذات تباين ثابت تقريبًا.'],
  ],
  mistakes: [
    ['Reading a large coefficient as "causes" — regression shows association, not causation.', 'تفسير المعامل الكبير على أنه «سبب» — الانحدار يُظهر ارتباطًا لا سببية.'],
    ['Using an unscaled learning rate on features with very different ranges.', 'استخدام معدل تعلّم واحد مع خصائص ذات نطاقات مختلفة جدًا دون تحجيم.'],
    ['Extrapolating far beyond the range of the training data.', 'الاستقراء بعيدًا خارج نطاق بيانات التدريب.'],
  ],
  python: `import numpy as np
from sklearn.linear_model import LinearRegression, SGDRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

X = np.array([[1.0], [2.0], [3.0], [4.0], [5.0]])   # one feature
y = np.array([2.9, 5.1, 7.2, 8.8, 11.1])

ols = LinearRegression().fit(X, y)                    # closed-form least squares
print("w =", ols.coef_[0], "b =", ols.intercept_)

gd = SGDRegressor(learning_rate="constant", eta0=0.01, max_iter=1000).fit(X, y)  # gradient-based

y_hat = ols.predict(X)
print("MAE", mean_absolute_error(y, y_hat), "MSE", mean_squared_error(y, y_hat), "R2", r2_score(y, y_hat))`,
  pythonNote: ['The lab uses its own batch gradient descent written in TypeScript; scikit-learn’s LinearRegression solves the same least-squares problem exactly, and SGDRegressor uses stochastic (per-sample) gradient steps.', 'يستخدم المختبر انحدارًا تدرّجيًا دفعيًا مكتوبًا بلغة TypeScript؛ أما LinearRegression في scikit-learn فيحل مسألة المربعات الصغرى نفسها بدقة، بينما يستخدم SGDRegressor خطوات تدرّج عشوائية (لكل عينة).'],
  quiz: [
    {
      q: ['What does gradient descent do at each step?', 'ماذا يفعل الانحدار التدرّجي في كل خطوة؟'],
      options: [
        ['Moves the parameters opposite to the gradient of the loss', 'يحرّك المعاملات عكس اتجاه تدرّج الخسارة'],
        ['Picks a random new line', 'يختار خطًا جديدًا عشوائيًا'],
        ['Removes the point with the largest error', 'يحذف النقطة ذات الخطأ الأكبر'],
        ['Adds more features', 'يضيف خصائص جديدة'],
      ],
      answer: 0,
      explain: ['The gradient points uphill; stepping against it lowers the loss.', 'يشير التدرّج إلى أعلى المنحدر؛ والتحرك عكسه يخفض الخسارة.'],
    },
    {
      q: ['Training loss suddenly grows to huge values. The most likely cause is…', 'ارتفعت خسارة التدريب فجأة إلى قيم ضخمة. السبب الأرجح هو…'],
      options: [
        ['Too many data points', 'كثرة نقاط البيانات'],
        ['A learning rate that is too large', 'معدل تعلّم كبير جدًا'],
        ['A learning rate that is too small', 'معدل تعلّم صغير جدًا'],
        ['Using MAE instead of MSE', 'استخدام MAE بدل MSE'],
      ],
      answer: 1,
      explain: ['Large steps overshoot the minimum and bounce further away each time.', 'الخطوات الكبيرة تتجاوز النقطة الدنيا وتبتعد عنها أكثر في كل مرة.'],
    },
    {
      q: ['R² = 0 means the model…', 'تعني R² = 0 أن النموذج…'],
      options: [
        ['Is perfect', 'مثالي'],
        ['Predicts no better than always predicting the mean of y', 'لا يتنبأ أفضل من التنبؤ الدائم بمتوسط y'],
        ['Has zero error', 'خطؤه صفر'],
        ['Has negative slope', 'ميله سالب'],
      ],
      answer: 1,
      explain: ['R² compares the model’s squared error with that of the constant mean predictor.', 'تقارن R² مربع خطأ النموذج بمربع خطأ النموذج الثابت الذي يتنبأ بالمتوسط.'],
    },
  ],
  related: ['logistic-regression', 'knn', 'decision-tree'],
  references: [
    { title: 'scikit-learn — Ordinary Least Squares', url: 'https://scikit-learn.org/stable/modules/linear_model.html#ordinary-least-squares' },
    { title: 'James et al., An Introduction to Statistical Learning (ch. 3)', url: 'https://www.statlearning.com/' },
    { title: 'Google ML Crash Course — Linear regression', url: 'https://developers.google.com/machine-learning/crash-course/linear-regression' },
  ],
  compare: {
    purpose: ['Predict a continuous value', 'التنبؤ بقيمة مستمرة'],
    data: ['Numeric features; small to very large datasets', 'خصائص عددية؛ من البيانات الصغيرة إلى الضخمة جدًا'],
    assumptions: ['Linear relationship, independent errors with constant variance', 'علاقة خطية، أخطاء مستقلة بتباين ثابت'],
    hyperparams: 'learning rate, iterations (GD); regularization (Ridge/Lasso)',
  },
};

export const logisticRegression: AlgorithmContent = {
  id: 'logistic-regression',
  name: ['Logistic Regression', 'الانحدار اللوجستي'],
  short: ['A linear classifier that outputs a probability by passing a weighted sum through the sigmoid function.', 'مصنِّف خطي يُخرج احتمالًا بتمرير مجموع موزون عبر دالة السيني.'],
  paradigm: 'supervised',
  categories: ['classification'],
  difficulty: 'beginner',
  labId: 'logistic-regression',
  objectives: [
    ['Explain how the sigmoid turns any score into a probability between 0 and 1.', 'شرح كيف تحوّل دالة السيني أي درجة إلى احتمال بين 0 و1.'],
    ['Train the model by minimizing log loss with gradient descent.', 'تدريب النموذج بتقليل الخسارة اللوغاريتمية بالانحدار التدرّجي.'],
    ['Change the decision threshold and read the confusion matrix.', 'تغيير عتبة القرار وقراءة مصفوفة الالتباس.'],
    ['Compare logistic regression with linear regression.', 'مقارنة الانحدار اللوجستي بالانحدار الخطي.'],
  ],
  intuition: [
    r`Despite its name, logistic regression is a **classification** method. It answers yes/no questions such as "is this email spam?".

It first computes a score exactly like linear regression, $z = w_1x_1 + w_2x_2 + b$. A score can be any number, so it is squashed through the **sigmoid** $\sigma(z)$ into a probability between 0 and 1. Large positive scores become probabilities near 1; large negative ones near 0.

To make a decision we compare the probability with a **threshold** (0.5 by default). The set of points where the probability equals the threshold is a straight line — the **decision boundary**.`,
    r`رغم اسمه، فالانحدار اللوجستي طريقة **تصنيف**. فهو يجيب عن أسئلة نعم/لا مثل «هل هذه الرسالة مزعجة؟».

يحسب أولًا درجة تمامًا كالانحدار الخطي $z = w_1x_1 + w_2x_2 + b$. قد تكون الدرجة أي عدد، لذلك تُضغط عبر **دالة السيني** $\sigma(z)$ لتصبح احتمالًا بين 0 و1. الدرجات الموجبة الكبيرة تصبح احتمالات قريبة من 1، والسالبة الكبيرة قريبة من 0.

ولاتخاذ القرار نقارن الاحتمال بـ**عتبة** (0.5 افتراضيًا). مجموعة النقاط التي يساوي عندها الاحتمال العتبة تشكّل خطًا مستقيمًا — هو **حد القرار**.`,
  ],
  useCases: [
    ['Spam detection and fraud screening.', 'كشف الرسائل المزعجة وفحص الاحتيال.'],
    ['Medical risk scores (probability of a condition).', 'درجات المخاطر الطبية (احتمال الإصابة بحالة ما).'],
    ['Predicting customer churn or click-through.', 'التنبؤ بانسحاب العملاء أو النقر على الإعلانات.'],
  ],
  steps: [
    ['Compute the score z = w·x + b for each point.', 'احسب الدرجة z = w·x + b لكل نقطة.'],
    ['Convert it to a probability p = σ(z).', 'حوّلها إلى احتمال p = σ(z).'],
    ['Measure the log loss: confident wrong answers are punished heavily.', 'قِس الخسارة اللوغاريتمية: الإجابات الخاطئة الواثقة تُعاقَب بشدة.'],
    ['Update w and b with gradient descent.', 'حدّث w وb بالانحدار التدرّجي.'],
    ['Classify: predict 1 if p ≥ threshold, else 0.', 'صنّف: تنبأ بـ1 إذا كان p ≥ العتبة، وإلا 0.'],
  ],
  math: [
    r`$$\sigma(z) = \frac{1}{1+e^{-z}}, \qquad p(y=1\mid\mathbf x) = \sigma(\mathbf w^\top \mathbf x + b)$$

Log loss (binary cross-entropy):

$$J(\mathbf w,b) = -\frac1n\sum_{i}\Big[y_i\log p_i + (1-y_i)\log(1-p_i)\Big]$$

Its gradient has a beautifully simple form:

$$\frac{\partial J}{\partial \mathbf w} = \frac1n\sum_i (p_i - y_i)\,\mathbf x_i, \qquad \frac{\partial J}{\partial b} = \frac1n\sum_i (p_i - y_i)$$

The boundary for threshold $t$ is the line $\mathbf w^\top\mathbf x + b = \log\frac{t}{1-t}$.`,
    r`$$\sigma(z) = \frac{1}{1+e^{-z}}, \qquad p(y=1\mid\mathbf x) = \sigma(\mathbf w^\top \mathbf x + b)$$

الخسارة اللوغاريتمية (الإنتروبيا المتقاطعة الثنائية):

$$J(\mathbf w,b) = -\frac1n\sum_{i}\Big[y_i\log p_i + (1-y_i)\log(1-p_i)\Big]$$

ولتدرّجها صيغة بسيطة جدًا:

$$\frac{\partial J}{\partial \mathbf w} = \frac1n\sum_i (p_i - y_i)\,\mathbf x_i, \qquad \frac{\partial J}{\partial b} = \frac1n\sum_i (p_i - y_i)$$

حد القرار عند العتبة $t$ هو الخط $\mathbf w^\top\mathbf x + b = \log\frac{t}{1-t}$.`,
  ],
  labGuide: [
    { param: ['Learning rate α', 'معدل التعلّم α'], effect: ['Size of each gradient step on the log loss.', 'حجم كل خطوة تدرّج على الخسارة اللوغاريتمية.'] },
    { param: ['L2 regularization λ', 'التنظيم L2 (λ)'], effect: ['Shrinks weights: softer probabilities, less overconfidence.', 'يقلّص الأوزان: احتمالات أنعم وثقة مفرطة أقل.'] },
    { param: ['Threshold t', 'العتبة t'], effect: ['Trades precision against recall without retraining.', 'يوازن بين الضبط والاستدعاء دون إعادة تدريب.'] },
  ],
  experiments: [
    ['Train on "Overlapping", then slide the threshold from 0.2 to 0.8 and watch FP and FN trade places.', 'درّب على «متداخلة» ثم حرّك العتبة من 0.2 إلى 0.8 وراقب تبادل FP وFN.'],
    ['Load "Imbalanced": accuracy is high even with poor recall. Which metric tells the truth?', 'حمّل «غير متوازنة»: الدقة مرتفعة رغم ضعف الاستدعاء. أي مقياس يقول الحقيقة؟'],
    ['Train on "Circles": why can a straight boundary not separate them?', 'درّب على «دوائر»: لماذا لا يستطيع حد مستقيم الفصل بينها؟'],
  ],
  evaluation: [
    r`Classification metrics come from the **confusion matrix** (TP, FP, TN, FN): accuracy $=\frac{TP+TN}{n}$, precision $=\frac{TP}{TP+FP}$, recall $=\frac{TP}{TP+FN}$, $F_1 = \frac{2PR}{P+R}$. Because the model outputs probabilities, the **ROC curve** and **AUC** summarize performance across all thresholds.`,
    r`تُشتق مقاييس التصنيف من **مصفوفة الالتباس** (TP وFP وTN وFN): الدقة $=\frac{TP+TN}{n}$، والضبط $=\frac{TP}{TP+FP}$، والاستدعاء $=\frac{TP}{TP+FN}$، و$F_1 = \frac{2PR}{P+R}$. ولأن النموذج يُخرج احتمالات، فإن **منحنى ROC** و**AUC** يلخّصان الأداء عبر جميع العتبات.`,
  ],
  advantages: [
    ['Outputs calibrated-ish probabilities, not just labels.', 'يُخرج احتمالات معقولة المعايرة لا مجرد تصنيفات.'],
    ['Fast, convex training with a single optimum.', 'تدريب سريع ومحدّب بحل أمثل وحيد.'],
    ['Coefficients are interpretable as changes in log-odds.', 'المعاملات قابلة للتفسير كتغيّرات في لوغاريتم الأرجحية.'],
  ],
  limitations: [
    ['Linear decision boundary only (unless features are engineered).', 'حد قرار خطي فقط (ما لم تُهندَس الخصائص).'],
    ['On perfectly separable data, weights grow without bound unless regularized.', 'على البيانات القابلة للفصل التام تنمو الأوزان بلا حد ما لم يُستخدم التنظيم.'],
  ],
  mistakes: [
    ['Always using threshold 0.5, even when false negatives are far more costly.', 'استخدام العتبة 0.5 دائمًا حتى عندما تكون السلبيات الكاذبة أعلى كلفة بكثير.'],
    ['Judging an imbalanced problem by accuracy alone.', 'الحكم على مسألة غير متوازنة بالدقة وحدها.'],
    ['Confusing it with linear regression: the output is a probability, the loss is log loss.', 'الخلط بينه وبين الانحدار الخطي: المُخرج احتمال والخسارة لوغاريتمية.'],
  ],
  python: `from sklearn.linear_model import LogisticRegression
from sklearn.metrics import confusion_matrix, classification_report, roc_auc_score
from sklearn.datasets import make_classification

X, y = make_classification(n_samples=200, n_features=2, n_redundant=0, random_state=0)
clf = LogisticRegression(C=1.0)          # C = 1/λ (inverse L2 strength)
clf.fit(X, y)

proba = clf.predict_proba(X)[:, 1]
y_pred = (proba >= 0.5).astype(int)       # change the threshold here
print(confusion_matrix(y, y_pred))
print(classification_report(y, y_pred))
print("AUC:", roc_auc_score(y, proba))`,
  pythonNote: ['scikit-learn uses a second-order solver (lbfgs) and expresses regularization as C = 1/λ; the lab uses plain gradient descent so every step is visible.', 'يستخدم scikit-learn مُحسِّنًا من الرتبة الثانية (lbfgs) ويعبّر عن التنظيم بـ C = 1/λ؛ أما المختبر فيستخدم انحدارًا تدرّجيًا بسيطًا لتظهر كل خطوة.'],
  quiz: [
    {
      q: ['What is the range of the sigmoid output?', 'ما مدى مخرجات دالة السيني؟'],
      options: [['(−∞, ∞)', '(−∞, ∞)'], ['(0, 1)', '(0, 1)'], ['{0, 1}', '{0, 1}'], ['(−1, 1)', '(−1, 1)']],
      answer: 1,
      explain: ['σ(z) approaches 0 and 1 but never reaches them, so it can be read as a probability.', 'تقترب σ(z) من 0 و1 دون بلوغهما، لذا يمكن قراءتها كاحتمال.'],
    },
    {
      q: ['Lowering the threshold from 0.5 to 0.2 usually…', 'خفض العتبة من 0.5 إلى 0.2 عادةً…'],
      options: [
        ['Increases recall and decreases precision', 'يزيد الاستدعاء ويخفض الضبط'],
        ['Increases precision and decreases recall', 'يزيد الضبط ويخفض الاستدعاء'],
        ['Retrains the model', 'يعيد تدريب النموذج'],
        ['Has no effect', 'ليس له أثر'],
      ],
      answer: 0,
      explain: ['More points are labelled positive: fewer misses (higher recall) but more false alarms.', 'تُصنَّف نقاط أكثر كموجبة: إخفاقات أقل (استدعاء أعلى) لكن إنذارات كاذبة أكثر.'],
    },
    {
      q: ['The decision boundary of logistic regression in 2-D is…', 'حد القرار للانحدار اللوجستي في بُعدين هو…'],
      options: [['A circle', 'دائرة'], ['A straight line', 'خط مستقيم'], ['Any curve', 'أي منحنى'], ['A set of rectangles', 'مجموعة مستطيلات']],
      answer: 1,
      explain: ['p = t exactly when w·x + b equals a constant, which is a line.', 'يتحقق p = t عندما يساوي w·x + b ثابتًا، وهذا خط مستقيم.'],
    },
  ],
  related: ['linear-regression', 'svm', 'naive-bayes'],
  references: [
    { title: 'scikit-learn — Logistic regression', url: 'https://scikit-learn.org/stable/modules/linear_model.html#logistic-regression' },
    { title: 'James et al., An Introduction to Statistical Learning (ch. 4)', url: 'https://www.statlearning.com/' },
    { title: 'Google ML Crash Course — Logistic regression', url: 'https://developers.google.com/machine-learning/crash-course/logistic-regression' },
  ],
  compare: {
    purpose: ['Binary (or multi-class) classification with probabilities', 'تصنيف ثنائي (أو متعدد) مع احتمالات'],
    data: ['Numeric features; scales to large datasets', 'خصائص عددية؛ يتوسع إلى بيانات كبيرة'],
    assumptions: ['Log-odds are a linear function of the features', 'لوغاريتم الأرجحية دالة خطية في الخصائص'],
    hyperparams: 'C / λ (regularization), penalty, threshold',
  },
};

export const knn: AlgorithmContent = {
  id: 'knn',
  name: ['K-Nearest Neighbors (KNN)', 'أقرب K جيران (KNN)'],
  short: ['Classifies a new point by a majority vote of the K closest training points.', 'يصنّف النقطة الجديدة بتصويت الأغلبية بين أقرب K نقاط تدريب.'],
  paradigm: 'supervised',
  categories: ['classification', 'regression'],
  difficulty: 'beginner',
  labId: 'knn',
  objectives: [
    ['Explain distance-based ("lazy") learning.', 'شرح التعلّم القائم على المسافة («التعلّم الكسول»).'],
    ['Compute Euclidean, Manhattan and Chebyshev distances.', 'حساب المسافات الإقليدية ومانهاتن وتشيبيشيف.'],
    ['See how K controls the smoothness of the decision boundary.', 'رؤية كيف يتحكم K في نعومة حد القرار.'],
    ['Understand why feature scaling is essential for KNN.', 'فهم لماذا يُعد تحجيم الخصائص ضروريًا لـKNN.'],
  ],
  intuition: [
    r`"Tell me who your neighbours are, and I'll tell you who you are." KNN does not build a formula during training — it simply **remembers** all the labelled examples.

To classify a new point it measures the distance to every stored point, picks the **K nearest**, and lets them vote. With K = 1 the newcomer copies its single closest neighbour; with a larger K the vote is more stable.

For **regression**, KNN averages the neighbours' target values instead of voting.`,
    r`«قل لي من جيرانك أقل لك من أنت». لا تبني KNN معادلة أثناء التدريب — بل **تحفظ** جميع الأمثلة المصنَّفة فقط.

لتصنيف نقطة جديدة تقيس المسافة إلى كل نقطة محفوظة، وتختار **أقرب K** منها، ثم تتركها تصوّت. مع K = 1 تنسخ النقطة الجديدة تصنيف أقرب جار لها، ومع K أكبر يصبح التصويت أكثر ثباتًا.

أما في **الانحدار** فتأخذ KNN متوسط قيم الجيران بدل التصويت.`,
  ],
  useCases: [
    ['Recommendation ("users similar to you liked…").', 'التوصيات («المستخدمون المشابهون لك أحبوا…»).'],
    ['Simple image or handwriting recognition baselines.', 'نماذج مرجعية بسيطة للتعرف على الصور أو الخط اليدوي.'],
    ['Filling in missing values from similar records.', 'تعويض القيم المفقودة من سجلات مشابهة.'],
  ],
  steps: [
    ['Store all training points (no real training phase).', 'خزّن جميع نقاط التدريب (لا توجد مرحلة تدريب فعلية).'],
    ['For a query, compute its distance to every stored point.', 'لنقطة الاستعلام، احسب مسافتها إلى كل نقطة مخزنة.'],
    ['Sort by distance and keep the K closest.', 'رتّب حسب المسافة واحتفظ بأقرب K.'],
    ['Classification: majority vote. Regression: average.', 'التصنيف: تصويت الأغلبية. الانحدار: المتوسط.'],
  ],
  math: [
    r`$$d_{\text{Euclid}}(\mathbf a,\mathbf q) = \sqrt{\sum_j (a_j-q_j)^2},\quad d_{\text{Manhattan}} = \sum_j |a_j-q_j|,\quad d_{\text{Chebyshev}} = \max_j |a_j-q_j|$$

Prediction with neighbourhood $N_K(\mathbf q)$:

$$\hat y = \arg\max_c \sum_{i\in N_K(\mathbf q)} \mathbb 1[y_i = c] \quad\text{(classification)}, \qquad \hat y = \frac1K\sum_{i\in N_K(\mathbf q)} y_i \quad\text{(regression)}$$

Standardization $z_j = (x_j-\mu_j)/\sigma_j$ puts every feature on a comparable scale before distances are measured.`,
    r`$$d_{\text{Euclid}}(\mathbf a,\mathbf q) = \sqrt{\sum_j (a_j-q_j)^2},\quad d_{\text{Manhattan}} = \sum_j |a_j-q_j|,\quad d_{\text{Chebyshev}} = \max_j |a_j-q_j|$$

التنبؤ باستخدام الجوار $N_K(\mathbf q)$:

$$\hat y = \arg\max_c \sum_{i\in N_K(\mathbf q)} \mathbb 1[y_i = c] \quad\text{(تصنيف)}, \qquad \hat y = \frac1K\sum_{i\in N_K(\mathbf q)} y_i \quad\text{(انحدار)}$$

التوحيد القياسي $z_j = (x_j-\mu_j)/\sigma_j$ يضع كل الخصائص على مقياس متقارب قبل قياس المسافات.`,
  ],
  labGuide: [
    { param: ['K', 'K'], effect: ['Small K: jagged, noise-sensitive boundary. Large K: smooth, may ignore small groups.', 'K صغير: حد متعرّج حساس للضوضاء. K كبير: حد ناعم قد يتجاهل المجموعات الصغيرة.'] },
    { param: ['Distance metric', 'مقياس المسافة'], effect: ['Changes the shape of a "neighbourhood" (circle, diamond, square).', 'يغيّر شكل «الجوار» (دائرة، معيّن، مربع).'] },
    { param: ['Unit factor & standardization', 'معامل الوحدة والتوحيد القياسي'], effect: ['Shows how one large-scale feature can dominate distances.', 'يُظهر كيف يمكن لخاصية واحدة ذات مقياس كبير أن تهيمن على المسافات.'] },
  ],
  experiments: [
    ['Set K = 1 on "Overlapping": notice islands around single noisy points.', 'اجعل K = 1 على «متداخلة»: لاحظ الجزر حول النقاط الشاذة المفردة.'],
    ['Raise the unit factor of x₁ to ×20, then switch on standardization.', 'ارفع معامل وحدة x₁ إلى ×20 ثم فعّل التوحيد القياسي.'],
    ['Find the K with the best leave-one-out accuracy.', 'جد قيمة K ذات أفضل دقة ترك-واحد.'],
  ],
  evaluation: [
    r`Use classification metrics (accuracy, precision, recall, F1) on held-out data, and choose K with cross-validation. The lab shows **leave-one-out** accuracy: each point is predicted by all the others.`,
    r`استخدم مقاييس التصنيف (الدقة، الضبط، الاستدعاء، F1) على بيانات محجوزة، واختر K بالتحقق المتقاطع. يعرض المختبر دقة **الترك-واحد**: كل نقطة يُتنبأ بها بواسطة جميع النقاط الأخرى.`,
  ],
  advantages: [
    ['No training time; trivially handles multi-class problems.', 'لا يحتاج وقت تدريب؛ ويتعامل بسهولة مع الفئات المتعددة.'],
    ['Flexible, non-linear boundaries.', 'حدود مرنة وغير خطية.'],
    ['Easy to explain with concrete neighbours.', 'سهل الشرح بالجيران الفعليين.'],
  ],
  limitations: [
    ['Prediction is slow for large datasets (distance to every point).', 'التنبؤ بطيء مع البيانات الكبيرة (المسافة إلى كل نقطة).'],
    ['Very sensitive to feature scaling and irrelevant features.', 'حساس جدًا لتحجيم الخصائص والخصائص غير المهمة.'],
    ['Suffers in high dimensions, where all points look far apart.', 'يتأثر سلبًا في الأبعاد العالية حيث تبدو كل النقاط متباعدة.'],
  ],
  mistakes: [
    ['Forgetting to standardize features measured in different units.', 'نسيان توحيد الخصائص المقيسة بوحدات مختلفة.'],
    ['Choosing K by training accuracy (K = 1 is always perfect on training data).', 'اختيار K بدقة التدريب (K = 1 مثالية دائمًا على بيانات التدريب).'],
    ['Using an even K for two classes without a tie-break rule.', 'استخدام K زوجي لفئتين دون قاعدة لكسر التعادل.'],
  ],
  python: `from sklearn.neighbors import KNeighborsClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from sklearn.model_selection import cross_val_score
from sklearn.datasets import load_iris

X, y = load_iris(return_X_y=True)
for k in [1, 5, 15]:
    model = make_pipeline(StandardScaler(), KNeighborsClassifier(n_neighbors=k, metric="euclidean"))
    print(k, cross_val_score(model, X, y, cv=5).mean())`,
  pythonNote: ['scikit-learn breaks voting ties by the order of the training data; the lab breaks ties in favour of the class with the closest member. Both are valid conventions.', 'يكسر scikit-learn التعادل في التصويت حسب ترتيب بيانات التدريب، بينما يكسره المختبر لصالح الفئة صاحبة العضو الأقرب. وكلاهما اصطلاح صحيح.'],
  quiz: [
    {
      q: ['What happens during KNN "training"?', 'ماذا يحدث أثناء «تدريب» KNN؟'],
      options: [['Weights are optimized', 'تُحسَّن الأوزان'], ['The training data is simply stored', 'تُخزَّن بيانات التدريب فقط'], ['A tree is built', 'تُبنى شجرة'], ['Centroids are computed', 'تُحسب المراكز']],
      answer: 1,
      explain: ['KNN is a lazy learner: all work happens at prediction time.', 'KNN متعلّم كسول: كل العمل يحدث وقت التنبؤ.'],
    },
    {
      q: ['Feature A ranges 0–1, feature B ranges 0–10,000. Without scaling, distances depend mainly on…', 'الخاصية A بين 0–1 والخاصية B بين 0–10,000. بدون تحجيم، تعتمد المسافات أساسًا على…'],
      options: [['Feature A', 'الخاصية A'], ['Feature B', 'الخاصية B'], ['Both equally', 'كلتيهما بالتساوي'], ['Neither', 'لا أي منهما']],
      answer: 1,
      explain: ['Differences in B are thousands of times larger, so they dominate the sum.', 'الفروق في B أكبر بآلاف المرات، لذا تهيمن على المجموع.'],
    },
    {
      q: ['Increasing K generally makes the decision boundary…', 'زيادة K تجعل حد القرار عمومًا…'],
      options: [['Smoother', 'أنعم'], ['More jagged', 'أكثر تعرجًا'], ['Linear', 'خطيًا'], ['Unchanged', 'دون تغيير']],
      answer: 0,
      explain: ['More voters average out individual noisy points.', 'المزيد من المصوّتين يلغي أثر النقاط الشاذة المفردة.'],
    },
  ],
  related: ['decision-tree', 'naive-bayes', 'k-means'],
  references: [
    { title: 'scikit-learn — Nearest Neighbors', url: 'https://scikit-learn.org/stable/modules/neighbors.html' },
    { title: 'James et al., An Introduction to Statistical Learning (ch. 2)', url: 'https://www.statlearning.com/' },
  ],
  compare: {
    purpose: ['Classification or regression by similarity', 'التصنيف أو الانحدار بالتشابه'],
    data: ['Small–medium datasets, few meaningful features, scaled', 'بيانات صغيرة إلى متوسطة، خصائص قليلة ذات معنى، بعد التحجيم'],
    assumptions: ['Nearby points (in the chosen metric) share labels', 'النقاط المتقاربة (بالمقياس المختار) تتشارك التصنيف'],
    hyperparams: 'K, distance metric, weighting, scaling',
  },
};

export const decisionTree: AlgorithmContent = {
  id: 'decision-tree',
  name: ['Decision Tree', 'شجرة القرار'],
  short: ['Learns a flowchart of yes/no questions on the features that splits data into increasingly pure groups.', 'يتعلّم مخططًا من أسئلة نعم/لا حول الخصائص يقسم البيانات إلى مجموعات تزداد نقاءً.'],
  paradigm: 'supervised',
  categories: ['classification', 'regression'],
  difficulty: 'intermediate',
  labId: 'decision-tree',
  objectives: [
    ['Explain how a tree chooses a split using Gini impurity or entropy.', 'شرح كيف تختار الشجرة التقسيم باستخدام عدم نقاء جيني أو الإنتروبيا.'],
    ['Follow a prediction from the root to a leaf.', 'تتبّع التنبؤ من الجذر حتى الورقة.'],
    ['Observe overfitting as depth grows, using a test set.', 'ملاحظة فرط الملاءمة مع ازدياد العمق باستخدام بيانات اختبار.'],
  ],
  intuition: [
    r`A decision tree plays "20 questions" with your data. At the top (the **root**) it asks the single question that best separates the classes, such as "is $x_2 \le 0.7$?". Each answer leads to a **branch**, where another question is asked, until we reach a **leaf** that outputs a prediction.

How does it pick a question? It tries every feature and every threshold, and keeps the one that makes the resulting groups most **pure** (mostly one class). Purity is measured with **Gini impurity** or **entropy**.

A deep tree can isolate every training point — perfect on training data, but often poor on new data. That is **overfitting**.`,
    r`تلعب شجرة القرار لعبة «20 سؤالًا» مع بياناتك. في الأعلى (**الجذر**) تطرح السؤال الوحيد الذي يفصل الفئات بأفضل شكل، مثل «هل $x_2 \le 0.7$؟». كل إجابة تقود إلى **فرع** يُطرح فيه سؤال آخر، حتى نصل إلى **ورقة** تُخرج التنبؤ.

كيف تختار السؤال؟ تجرّب كل خاصية وكل عتبة، وتحتفظ بالتي تجعل المجموعات الناتجة أكثر **نقاءً** (معظمها من فئة واحدة). يُقاس النقاء بـ**عدم نقاء جيني** أو **الإنتروبيا**.

يمكن للشجرة العميقة أن تعزل كل نقطة تدريب — فتكون مثالية على بيانات التدريب لكنها غالبًا ضعيفة على البيانات الجديدة. وهذا هو **فرط الملاءمة**.`,
  ],
  useCases: [
    ['Credit approval rules that must be explainable.', 'قواعد الموافقة على الائتمان التي يجب أن تكون قابلة للتفسير.'],
    ['Medical triage flowcharts.', 'مخططات الفرز الطبي.'],
    ['The building block of Random Forests and gradient boosting.', 'اللبنة الأساسية للغابات العشوائية والتعزيز التدرّجي.'],
  ],
  steps: [
    ['Start with all training points at the root.', 'ابدأ بجميع نقاط التدريب في الجذر.'],
    ['For every feature and threshold, compute the impurity decrease (information gain).', 'لكل خاصية وعتبة، احسب انخفاض عدم النقاء (كسب المعلومات).'],
    ['Apply the best split, creating a left and right child.', 'طبّق أفضل تقسيم لتنشئ ابنًا أيسر وأيمن.'],
    ['Repeat recursively until nodes are pure or a stopping rule (max depth, min samples) is hit.', 'كرّر بشكل تعاودي حتى تصبح العقد نقية أو تتحقق قاعدة توقف (أقصى عمق، أدنى عدد عينات).'],
    ['Each leaf predicts the majority class of its training points.', 'تتنبأ كل ورقة بفئة الأغلبية بين نقاط تدريبها.'],
  ],
  math: [
    r`For class proportions $p_c$ in a node:

$$\text{Gini} = 1 - \sum_c p_c^2, \qquad H = -\sum_c p_c \log_2 p_c$$

A split of $n$ samples into $n_L$ and $n_R$ is scored by the **information gain** (impurity decrease):

$$\Delta = I(\text{parent}) - \frac{n_L}{n} I(L) - \frac{n_R}{n} I(R)$$

Thresholds are tried at midpoints between consecutive sorted feature values. Feature importance sums the weighted gains of the splits that use each feature.`,
    r`لنسب الفئات $p_c$ داخل عقدة:

$$\text{Gini} = 1 - \sum_c p_c^2, \qquad H = -\sum_c p_c \log_2 p_c$$

يُقيَّم تقسيم $n$ عينة إلى $n_L$ و$n_R$ بـ**كسب المعلومات** (انخفاض عدم النقاء):

$$\Delta = I(\text{parent}) - \frac{n_L}{n} I(L) - \frac{n_R}{n} I(R)$$

تُجرَّب العتبات عند منتصفات القيم المتتالية المرتّبة لكل خاصية. وتجمع أهمية الخاصية مكاسب التقسيمات الموزونة التي تستخدمها.`,
  ],
  labGuide: [
    { param: ['Max depth', 'أقصى عمق'], effect: ['The main complexity control: deeper = more regions = higher overfitting risk.', 'أداة التحكم الرئيسية بالتعقيد: أعمق = مناطق أكثر = خطر أعلى لفرط الملاءمة.'] },
    { param: ['Min samples to split', 'أدنى عدد عينات للتقسيم'], effect: ['Stops splitting small nodes, which reduces overfitting.', 'يوقف تقسيم العقد الصغيرة، مما يقلل فرط الملاءمة.'] },
    { param: ['Criterion', 'المعيار'], effect: ['Gini or entropy; they usually choose very similar splits.', 'جيني أو الإنتروبيا؛ وعادةً يختاران تقسيمات متشابهة جدًا.'] },
    { param: ['Test fraction', 'نسبة الاختبار'], effect: ['Held-out points (faded) measure generalization.', 'النقاط المحجوزة (الباهتة) تقيس قدرة التعميم.'] },
  ],
  experiments: [
    ['Press "Grow level by level" and watch each new split appear.', 'اضغط «نمِّ الشجرة مستوى بمستوى» وراقب ظهور كل تقسيم جديد.'],
    ['On "Overlapping (noisy)", raise max depth to 12 and compare train vs test accuracy.', 'على «متداخلة (ضوضاء)» ارفع العمق إلى 12 وقارن دقة التدريب بالاختبار.'],
    ['Click a point and follow its path through the tree diagram.', 'انقر نقطة وتتبّع مسارها عبر مخطط الشجرة.'],
  ],
  evaluation: [
    r`Compare **training** and **test** accuracy. A widening gap as depth grows is the signature of overfitting. Tune depth and minimum samples with cross-validation.`,
    r`قارن دقة **التدريب** بدقة **الاختبار**. الفجوة التي تتسع مع زيادة العمق علامة مميزة لفرط الملاءمة. اضبط العمق وأدنى عدد عينات بالتحقق المتقاطع.`,
  ],
  advantages: [
    ['Highly interpretable: the model is a readable flowchart.', 'قابلة للتفسير جدًا: النموذج مخطط مقروء.'],
    ['No feature scaling needed; handles non-linear patterns.', 'لا تحتاج تحجيم الخصائص؛ وتتعامل مع الأنماط غير الخطية.'],
    ['Works for classification and regression (CART).', 'تعمل للتصنيف والانحدار (CART).'],
  ],
  limitations: [
    ['Overfits easily without depth limits or pruning.', 'تقع بسهولة في فرط الملاءمة دون حدود للعمق أو تقليم.'],
    ['Unstable: small data changes can produce a very different tree.', 'غير مستقرة: تغيّر بسيط في البيانات قد ينتج شجرة مختلفة جدًا.'],
    ['Axis-aligned splits approximate diagonal boundaries with staircases.', 'التقسيمات الموازية للمحاور تقرّب الحدود المائلة بشكل درج.'],
  ],
  mistakes: [
    ['Judging the tree by training accuracy.', 'الحكم على الشجرة بدقة التدريب.'],
    ['Letting the tree grow to full depth on noisy data.', 'ترك الشجرة تنمو لأقصى عمق على بيانات بها ضوضاء.'],
    ['Over-reading feature importance from a single unstable tree.', 'المبالغة في تفسير أهمية الخصائص من شجرة واحدة غير مستقرة.'],
  ],
  python: `from sklearn.tree import DecisionTreeClassifier, export_text
from sklearn.model_selection import train_test_split
from sklearn.datasets import make_moons

X, y = make_moons(n_samples=200, noise=0.3, random_state=0)
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.3, random_state=0)

for depth in [1, 3, 10]:
    tree = DecisionTreeClassifier(max_depth=depth, min_samples_split=2, criterion="gini", random_state=0)
    tree.fit(X_tr, y_tr)
    print(depth, tree.score(X_tr, y_tr), tree.score(X_te, y_te))

print(export_text(tree, feature_names=["x1", "x2"]))`,
  pythonNote: ['The lab implements CART exactly like scikit-learn (binary splits at midpoints, Gini/entropy, mean-decrease-in-impurity importance). Ties between equally good splits may be resolved differently.', 'يطبّق المختبر خوارزمية CART تمامًا كما في scikit-learn (تقسيمات ثنائية عند المنتصفات، جيني/الإنتروبيا، والأهمية بمتوسط انخفاض عدم النقاء). قد تُحسم التعادلات بين التقسيمات المتساوية بشكل مختلف.'],
  quiz: [
    {
      q: ['A node contains 5 points of class A and 5 of class B. Its Gini impurity is…', 'عقدة تحتوي 5 نقاط من الفئة A و5 من الفئة B. عدم نقاء جيني لها هو…'],
      options: [['0', '0'], ['0.25', '0.25'], ['0.5', '0.5'], ['1', '1']],
      answer: 2,
      explain: ['1 − (0.5² + 0.5²) = 0.5, the maximum for two classes.', '1 − (0.5² + 0.5²) = 0.5، وهي القيمة القصوى لفئتين.'],
    },
    {
      q: ['Train accuracy 100%, test accuracy 70%. The tree is most likely…', 'دقة التدريب 100% ودقة الاختبار 70%. الشجرة على الأرجح…'],
      options: [['Underfitting', 'تعاني نقص الملاءمة'], ['Overfitting', 'تعاني فرط الملاءمة'], ['Perfect', 'مثالية'], ['Untrained', 'غير مدرَّبة']],
      answer: 1,
      explain: ['It memorised the training data, including its noise.', 'لقد حفظت بيانات التدريب بما فيها من ضوضاء.'],
    },
    {
      q: ['Which change reduces overfitting in a decision tree?', 'أي تغيير يقلل فرط الملاءمة في شجرة القرار؟'],
      options: [['Increasing max depth', 'زيادة أقصى عمق'], ['Increasing min samples to split', 'زيادة أدنى عدد عينات للتقسيم'], ['Removing the test set', 'حذف بيانات الاختبار'], ['Using entropy instead of Gini', 'استخدام الإنتروبيا بدل جيني']],
      answer: 1,
      explain: ['Requiring more samples per split prevents tiny, noise-driven leaves.', 'اشتراط عينات أكثر لكل تقسيم يمنع الأوراق الصغيرة الناتجة عن الضوضاء.'],
    },
  ],
  related: ['random-forest', 'knn', 'logistic-regression'],
  references: [
    { title: 'scikit-learn — Decision Trees', url: 'https://scikit-learn.org/stable/modules/tree.html' },
    { title: 'James et al., An Introduction to Statistical Learning (ch. 8)', url: 'https://www.statlearning.com/' },
  ],
  compare: {
    purpose: ['Interpretable classification or regression', 'تصنيف أو انحدار قابل للتفسير'],
    data: ['Tabular data with mixed feature types; no scaling needed', 'بيانات جدولية بخصائص مختلطة؛ لا حاجة للتحجيم'],
    assumptions: ['Target can be approximated by axis-aligned regions', 'يمكن تقريب الهدف بمناطق موازية للمحاور'],
    hyperparams: 'max_depth, min_samples_split, min_samples_leaf, criterion',
  },
};

export const randomForest: AlgorithmContent = {
  id: 'random-forest',
  name: ['Random Forest', 'الغابة العشوائية'],
  short: ['An ensemble of decision trees, each trained on a bootstrap sample with random feature choices, whose votes are averaged.', 'مجموعة من أشجار القرار، تُدرَّب كل منها على عينة bootstrap مع اختيار عشوائي للخصائص، ثم يؤخذ متوسط أصواتها.'],
  paradigm: 'supervised',
  categories: ['classification', 'regression'],
  difficulty: 'intermediate',
  labId: 'random-forest',
  objectives: [
    ['Explain bagging: bootstrap sampling + aggregation.', 'شرح التجميع bagging: معاينة bootstrap + التجميع.'],
    ['See why averaging de-correlated trees reduces variance.', 'رؤية لماذا يقلل متوسط الأشجار غير المترابطة التباين.'],
    ['Compare a forest with a single deep tree on held-out data.', 'مقارنة الغابة بشجرة عميقة واحدة على بيانات محجوزة.'],
  ],
  intuition: [
    r`One decision tree is like one opinionated expert: clever but erratic. A **random forest** asks a whole committee and averages their opinions.

To make the experts *different*, each tree is trained on a **bootstrap sample** — $n$ points drawn *with replacement* from the training set, so some points appear several times and about a third are left out — and at each split it may only consider a **random subset of features**.

Individually the trees overfit in different ways; their errors partly cancel out when they **vote**. The result is a much more stable model.`,
    r`الشجرة الواحدة تشبه خبيرًا واحدًا متحمسًا لرأيه: ذكي لكنه متقلب. أما **الغابة العشوائية** فتسأل لجنة كاملة وتأخذ متوسط آرائها.

ولجعل الخبراء *مختلفين* تُدرَّب كل شجرة على **عينة bootstrap** — أي $n$ نقطة مسحوبة *مع الإرجاع* من بيانات التدريب، فتظهر بعض النقاط عدة مرات ويُستبعد نحو الثلث — ولا يُسمح لها عند كل تقسيم إلا بالنظر في **مجموعة جزئية عشوائية من الخصائص**.

كل شجرة بمفردها تقع في فرط الملاءمة بطريقة مختلفة، فتلغي أخطاؤها بعضها جزئيًا عند **التصويت**. والنتيجة نموذج أكثر ثباتًا بكثير.`,
  ],
  useCases: [
    ['Strong default for tabular data (finance, healthcare, marketing).', 'خيار افتراضي قوي للبيانات الجدولية (المالية، الصحة، التسويق).'],
    ['Estimating feature importance.', 'تقدير أهمية الخصائص.'],
    ['Remote-sensing land-cover classification.', 'تصنيف الغطاء الأرضي بالاستشعار عن بُعد.'],
  ],
  steps: [
    ['For t = 1…T: draw a bootstrap sample of the training data.', 'لكل t = 1…T: اسحب عينة bootstrap من بيانات التدريب.'],
    ['Grow a decision tree on it, considering only m random features at each split.', 'نمِّ شجرة قرار عليها مع النظر في m خصائص عشوائية فقط عند كل تقسيم.'],
    ['To predict, run the input through every tree.', 'للتنبؤ، مرّر المُدخل عبر كل الأشجار.'],
    ['Average the trees’ class probabilities (or take a majority vote).', 'خذ متوسط احتمالات الفئات من الأشجار (أو تصويت الأغلبية).'],
  ],
  math: [
    r`Forest prediction (soft voting, as in scikit-learn):

$$\hat p(c\mid\mathbf x) = \frac1T\sum_{t=1}^{T} p_t(c\mid\mathbf x), \qquad \hat y = \arg\max_c \hat p(c\mid\mathbf x)$$

Why it helps: for $T$ estimators each with variance $\sigma^2$ and pairwise correlation $\rho$, the variance of their average is

$$\rho\,\sigma^2 + \frac{1-\rho}{T}\sigma^2$$

Bootstrapping and random feature selection lower $\rho$; adding trees shrinks the second term. A bootstrap sample omits each point with probability $(1-\tfrac1n)^n \approx e^{-1} \approx 36.8\%$ — these **out-of-bag** points give a free validation estimate.`,
    r`تنبؤ الغابة (تصويت ناعم كما في scikit-learn):

$$\hat p(c\mid\mathbf x) = \frac1T\sum_{t=1}^{T} p_t(c\mid\mathbf x), \qquad \hat y = \arg\max_c \hat p(c\mid\mathbf x)$$

لماذا تفيد؟ لعدد $T$ من المقدِّرات لكل منها تباين $\sigma^2$ وارتباط ثنائي $\rho$، يكون تباين متوسطها

$$\rho\,\sigma^2 + \frac{1-\rho}{T}\sigma^2$$

تخفض معاينة bootstrap واختيار الخصائص العشوائي قيمة $\rho$، وتقلّص إضافة الأشجار الحد الثاني. تستبعد عينة bootstrap كل نقطة باحتمال $(1-\tfrac1n)^n \approx e^{-1} \approx 36.8\%$ — وهذه النقاط **خارج الحقيبة** تمنح تقديرًا مجانيًا للتحقق.`,
  ],
  labGuide: [
    { param: ['Number of trees', 'عدد الأشجار'], effect: ['More trees = more stable average; returns diminish after a while.', 'أشجار أكثر = متوسط أكثر ثباتًا؛ وتتناقص الفائدة بعد حد معين.'] },
    { param: ['Max depth per tree', 'أقصى عمق لكل شجرة'], effect: ['Forests tolerate deep trees because averaging reduces their variance.', 'تتحمّل الغابات الأشجار العميقة لأن المتوسط يقلل تباينها.'] },
    { param: ['Features per split', 'الخصائص لكل تقسيم'], effect: ['√d random features de-correlates the trees.', 'اختيار √d خاصية عشوائية يقلل الترابط بين الأشجار.'] },
    { param: ['Bootstrap', 'Bootstrap'], effect: ['Turn off with all features to see every tree become identical.', 'أوقفه مع استخدام كل الخصائص لترى كل الأشجار تصبح متطابقة.'] },
  ],
  experiments: [
    ['Switch to "Forest vs single tree" on noisy data and compare test accuracy.', 'انتقل إلى «الغابة مقابل شجرة واحدة» على بيانات بها ضوضاء وقارن دقة الاختبار.'],
    ['Browse individual trees: each one is jagged and different.', 'تصفّح الأشجار المنفردة: كل واحدة متعرّجة ومختلفة.'],
    ['Watch the "accuracy vs number of trees" curve flatten.', 'راقب منحنى «الدقة مقابل عدد الأشجار» وهو يستقر.'],
  ],
  evaluation: [
    r`Use test accuracy (or cross-validation) and the **out-of-bag score**, which evaluates each training point only with trees that never saw it.`,
    r`استخدم دقة الاختبار (أو التحقق المتقاطع) و**درجة خارج الحقيبة** التي تقيّم كل نقطة تدريب فقط بالأشجار التي لم ترها.`,
  ],
  advantages: [
    ['Excellent accuracy on tabular data with little tuning.', 'دقة ممتازة على البيانات الجدولية مع ضبط قليل.'],
    ['Much less overfitting than a single tree.', 'فرط ملاءمة أقل بكثير من الشجرة الواحدة.'],
    ['Built-in OOB validation and feature importance.', 'تحقق مدمج خارج الحقيبة وأهمية الخصائص.'],
  ],
  limitations: [
    ['Less interpretable than one tree.', 'أقل قابلية للتفسير من شجرة واحدة.'],
    ['Larger memory use and slower predictions.', 'استهلاك ذاكرة أكبر وتنبؤات أبطأ.'],
    ['Impurity-based importance is biased toward high-cardinality features.', 'الأهمية القائمة على عدم النقاء منحازة للخصائص كثيرة القيم.'],
  ],
  mistakes: [
    ['Expecting more trees to fix a bad feature set.', 'توقّع أن تُصلح الأشجار الإضافية مجموعة خصائص سيئة.'],
    ['Treating feature importance as causal evidence.', 'معاملة أهمية الخصائص كدليل سببي.'],
  ],
  python: `from sklearn.ensemble import RandomForestClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.datasets import make_moons
from sklearn.model_selection import train_test_split

X, y = make_moons(n_samples=300, noise=0.35, random_state=1)
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.3, random_state=1)

forest = RandomForestClassifier(n_estimators=100, max_features="sqrt", bootstrap=True,
                                oob_score=True, random_state=1).fit(X_tr, y_tr)
tree = DecisionTreeClassifier(random_state=1).fit(X_tr, y_tr)

print("forest test:", forest.score(X_te, y_te), "OOB:", forest.oob_score_)
print("single tree test:", tree.score(X_te, y_te))
print("importances:", forest.feature_importances_)`,
  pythonNote: ['The lab trains real CART trees on real bootstrap samples with a seeded random generator, and averages leaf probabilities like scikit-learn. Exact trees differ because the random number generators differ.', 'يدرّب المختبر أشجار CART حقيقية على عينات bootstrap حقيقية بمولّد عشوائي ذي بذرة، ويأخذ متوسط احتمالات الأوراق كما في scikit-learn. تختلف الأشجار بدقة لأن مولّدات الأعداد العشوائية مختلفة.'],
  quiz: [
    {
      q: ['What is a bootstrap sample?', 'ما عينة bootstrap؟'],
      options: [['A random subset without replacement', 'مجموعة جزئية عشوائية دون إرجاع'], ['n points drawn with replacement from n', 'n نقطة مسحوبة مع الإرجاع من n'], ['The test set', 'بيانات الاختبار'], ['The first half of the data', 'النصف الأول من البيانات']],
      answer: 1,
      explain: ['Sampling with replacement duplicates some points and omits about 37%.', 'السحب مع الإرجاع يكرر بعض النقاط ويستبعد نحو 37%.'],
    },
    {
      q: ['Why consider only a random subset of features at each split?', 'لماذا يُنظر في مجموعة جزئية عشوائية من الخصائص عند كل تقسيم؟'],
      options: [['To speed up prediction', 'لتسريع التنبؤ'], ['To de-correlate the trees', 'لتقليل الترابط بين الأشجار'], ['To remove noise from data', 'لإزالة الضوضاء من البيانات'], ['It is required for regression', 'لأنه مطلوب للانحدار']],
      answer: 1,
      explain: ['If every tree used the same strong feature first, they would make the same mistakes.', 'لو استخدمت كل الأشجار الخاصية القوية نفسها أولًا لارتكبت الأخطاء نفسها.'],
    },
    {
      q: ['Compared with a single deep tree, a random forest mainly reduces…', 'مقارنةً بشجرة عميقة واحدة، تقلل الغابة العشوائية أساسًا…'],
      options: [['Bias', 'الانحياز'], ['Variance', 'التباين'], ['Training time', 'وقت التدريب'], ['Number of features', 'عدد الخصائص']],
      answer: 1,
      explain: ['Averaging many noisy-but-unbiased trees lowers variance.', 'متوسط العديد من الأشجار المشوّشة غير المنحازة يخفض التباين.'],
    },
  ],
  related: ['decision-tree', 'knn', 'svm'],
  references: [
    { title: 'Breiman (2001), Random Forests, Machine Learning 45', url: 'https://doi.org/10.1023/A:1010933404324' },
    { title: 'scikit-learn — Random forests', url: 'https://scikit-learn.org/stable/modules/ensemble.html#random-forests' },
  ],
  compare: {
    purpose: ['Robust, accurate classification/regression', 'تصنيف/انحدار دقيق ومتين'],
    data: ['Tabular data, small to large; no scaling', 'بيانات جدولية صغيرة إلى كبيرة؛ دون تحجيم'],
    assumptions: ['Few; benefits from many weakly correlated trees', 'قليلة؛ يستفيد من أشجار كثيرة ضعيفة الترابط'],
    hyperparams: 'n_estimators, max_depth, max_features, bootstrap',
  },
};

export const svm: AlgorithmContent = {
  id: 'svm',
  name: ['Support Vector Machine (SVM)', 'آلة متجهات الدعم (SVM)'],
  short: ['Finds the boundary with the widest margin between classes; kernels let it draw curved boundaries.', 'يجد الحد ذا الهامش الأعرض بين الفئات؛ وتتيح له النوى رسم حدود منحنية.'],
  paradigm: 'supervised',
  categories: ['classification'],
  difficulty: 'advanced',
  labId: 'svm',
  objectives: [
    ['Explain maximum-margin classification and support vectors.', 'شرح التصنيف بالهامش الأقصى ومتجهات الدعم.'],
    ['Contrast hard and soft margins and the role of C.', 'المقارنة بين الهامش الصلب والمرن ودور C.'],
    ['Use the RBF kernel and the γ parameter for non-linear data.', 'استخدام نواة RBF والمعامل γ للبيانات غير الخطية.'],
  ],
  intuition: [
    r`Many lines can separate two groups of points. Which is best? The SVM picks the one that stays **as far as possible from both classes** — the widest "street" between them. The edges of the street are the **margins**.

Only the points on or inside the margins matter; they "support" the boundary and are called **support vectors**. Move any other point and nothing changes.

Real data overlaps, so a **soft margin** allows some violations. The parameter **C** sets the price of each violation: small C → wide, tolerant street; large C → narrow street that tries to classify every point.

For curved patterns, a **kernel** measures similarity in a richer hidden space. The **RBF kernel** acts like a bump around each support vector; **γ** controls how narrow those bumps are.`,
    r`يمكن لخطوط كثيرة أن تفصل مجموعتين من النقاط. فأيها الأفضل؟ تختار SVM الخط الذي يبقى **أبعد ما يمكن عن الفئتين** — أي أعرض «شارع» بينهما. وتسمى حافتا الشارع **الهامشين**.

النقاط الموجودة على الهامشين أو داخلهما هي وحدها المهمة؛ فهي «تدعم» الحد وتسمى **متجهات الدعم**. حرّك أي نقطة أخرى ولن يتغير شيء.

البيانات الحقيقية متداخلة، لذا يسمح **الهامش المرن** ببعض المخالفات. يحدد المعامل **C** ثمن كل مخالفة: C صغير ← شارع عريض متسامح؛ وC كبير ← شارع ضيق يحاول تصنيف كل نقطة.

وللأنماط المنحنية تقيس **النواة** التشابه في فضاء خفي أغنى. تعمل **نواة RBF** كنتوء حول كل متجه دعم، ويتحكم **γ** في ضيق هذه النتوءات.`,
  ],
  useCases: [
    ['Text and document classification.', 'تصنيف النصوص والمستندات.'],
    ['Bioinformatics (e.g. protein classification).', 'المعلوماتية الحيوية (مثل تصنيف البروتينات).'],
    ['Image recognition with small to medium datasets.', 'التعرّف على الصور مع بيانات صغيرة إلى متوسطة.'],
  ],
  steps: [
    ['Map labels to y ∈ {−1, +1}.', 'حوّل التصنيفات إلى y ∈ {−1, +1}.'],
    ['Solve the margin-maximization problem (here with the SMO algorithm on the dual).', 'حل مسألة تعظيم الهامش (هنا بخوارزمية SMO على المسألة الثنائية).'],
    ['Points with α > 0 become support vectors.', 'النقاط التي α > 0 تصبح متجهات دعم.'],
    ['Predict with the sign of f(x) = Σ αᵢyᵢK(xᵢ, x) + b.', 'تنبّأ بإشارة f(x) = Σ αᵢyᵢK(xᵢ, x) + b.'],
  ],
  math: [
    r`Soft-margin primal problem:

$$\min_{\mathbf w,b,\xi}\; \frac12\lVert\mathbf w\rVert^2 + C\sum_i \xi_i \quad\text{s.t.}\quad y_i(\mathbf w^\top\mathbf x_i + b) \ge 1-\xi_i,\; \xi_i\ge 0$$

The margin width is $2/\lVert\mathbf w\rVert$. The equivalent dual problem only involves dot products, which kernels replace:

$$\max_{\boldsymbol\alpha}\; \sum_i\alpha_i - \frac12\sum_{i,j}\alpha_i\alpha_j y_i y_j K(\mathbf x_i,\mathbf x_j)\quad\text{s.t.}\quad 0\le\alpha_i\le C,\; \sum_i\alpha_i y_i = 0$$

$$K_{\text{linear}}(\mathbf a,\mathbf b) = \mathbf a^\top\mathbf b, \qquad K_{\text{RBF}}(\mathbf a,\mathbf b) = e^{-\gamma\lVert\mathbf a-\mathbf b\rVert^2}$$

KKT conditions: $\alpha_i = 0 \Rightarrow y_if(\mathbf x_i)\ge1$; $0<\alpha_i<C \Rightarrow y_if(\mathbf x_i)=1$; $\alpha_i = C \Rightarrow y_if(\mathbf x_i)\le1$.`,
    r`المسألة الأولية للهامش المرن:

$$\min_{\mathbf w,b,\xi}\; \frac12\lVert\mathbf w\rVert^2 + C\sum_i \xi_i \quad\text{s.t.}\quad y_i(\mathbf w^\top\mathbf x_i + b) \ge 1-\xi_i,\; \xi_i\ge 0$$

عرض الهامش يساوي $2/\lVert\mathbf w\rVert$. والمسألة الثنائية المكافئة لا تتضمن إلا جداءات نقطية، تستبدلها النوى:

$$\max_{\boldsymbol\alpha}\; \sum_i\alpha_i - \frac12\sum_{i,j}\alpha_i\alpha_j y_i y_j K(\mathbf x_i,\mathbf x_j)\quad\text{s.t.}\quad 0\le\alpha_i\le C,\; \sum_i\alpha_i y_i = 0$$

$$K_{\text{linear}}(\mathbf a,\mathbf b) = \mathbf a^\top\mathbf b, \qquad K_{\text{RBF}}(\mathbf a,\mathbf b) = e^{-\gamma\lVert\mathbf a-\mathbf b\rVert^2}$$

شروط KKT: $\alpha_i = 0 \Rightarrow y_if(\mathbf x_i)\ge1$؛ $0<\alpha_i<C \Rightarrow y_if(\mathbf x_i)=1$؛ $\alpha_i = C \Rightarrow y_if(\mathbf x_i)\le1$.`,
  ],
  labGuide: [
    { param: ['Kernel', 'النواة'], effect: ['Linear: straight boundary. RBF: flexible curved boundary.', 'الخطية: حد مستقيم. RBF: حد منحنٍ مرن.'] },
    { param: ['C', 'C'], effect: ['Small: wide margin, more support vectors. Large: narrow margin, fewer violations.', 'صغير: هامش عريض ومتجهات دعم أكثر. كبير: هامش ضيق ومخالفات أقل.'] },
    { param: ['γ (RBF)', 'γ (RBF)'], effect: ['Large γ: very local influence → wiggly, overfit boundary.', 'γ كبير: تأثير محلي جدًا ← حد متعرّج يفرط في الملاءمة.'] },
  ],
  experiments: [
    ['Drag a point that is not a support vector — the boundary does not move.', 'اسحب نقطة ليست متجه دعم — لن يتحرك الحد.'],
    ['On "Overlapping", sweep C from 0.01 to 1000 and count support vectors.', 'على «متداخلة» غيّر C من 0.01 إلى 1000 وعدّ متجهات الدعم.'],
    ['On "Circles", compare linear and RBF; then push γ to 10.', 'على «دوائر» قارن الخطية وRBF، ثم ارفع γ إلى 10.'],
  ],
  evaluation: [
    r`Use classification metrics on a test set, and tune $C$ and $\gamma$ jointly with grid search and cross-validation. The number of support vectors is also informative: a very large fraction suggests heavy overlap or too small $C$.`,
    r`استخدم مقاييس التصنيف على بيانات اختبار، واضبط $C$ و$\gamma$ معًا بالبحث الشبكي والتحقق المتقاطع. عدد متجهات الدعم مفيد أيضًا: النسبة الكبيرة جدًا تشير إلى تداخل شديد أو قيمة $C$ صغيرة جدًا.`,
  ],
  advantages: [
    ['Strong performance in high-dimensional spaces.', 'أداء قوي في الفضاءات عالية الأبعاد.'],
    ['Convex optimization: a unique global optimum.', 'تحسين محدّب: حل أمثل عالمي وحيد.'],
    ['Kernels give flexible boundaries with a principled margin.', 'تعطي النوى حدودًا مرنة مع هامش مدروس.'],
  ],
  limitations: [
    ['Training scales poorly to very large datasets (kernel matrix is n×n).', 'التدريب لا يتوسع جيدًا مع البيانات الضخمة (مصفوفة النواة n×n).'],
    ['No native probabilities; sensitive to feature scaling.', 'لا يعطي احتمالات أصلًا؛ وحساس لتحجيم الخصائص.'],
    ['C and γ require careful tuning.', 'يتطلب C وγ ضبطًا دقيقًا.'],
  ],
  mistakes: [
    ['Not standardizing features before using an RBF kernel.', 'عدم توحيد الخصائص قبل استخدام نواة RBF.'],
    ['Tuning C and γ separately instead of together.', 'ضبط C وγ كلٌّ على حدة بدل ضبطهما معًا.'],
    ['Assuming a large C is always better because training accuracy rises.', 'افتراض أن C الكبير أفضل دائمًا لأن دقة التدريب ترتفع.'],
  ],
  python: `from sklearn.svm import SVC
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from sklearn.model_selection import GridSearchCV
from sklearn.datasets import make_circles

X, y = make_circles(n_samples=200, factor=0.4, noise=0.1, random_state=0)
pipe = make_pipeline(StandardScaler(), SVC(kernel="rbf"))
grid = GridSearchCV(pipe, {"svc__C": [0.1, 1, 10, 100], "svc__gamma": [0.01, 0.1, 1, 10]}, cv=5)
grid.fit(X, y)
print(grid.best_params_, grid.best_score_)
print("support vectors:", grid.best_estimator_[-1].n_support_)`,
  pythonNote: ['The lab solves the same dual problem as scikit-learn’s SVC (which wraps LIBSVM) with an SMO solver using maximal-violating-pair selection, stopping when the KKT gap is below 10⁻³.', 'يحل المختبر المسألة الثنائية نفسها التي يحلها SVC في scikit-learn (المبني على LIBSVM) بمُحسِّن SMO يختار الزوج الأكثر مخالفة، ويتوقف عندما تقل فجوة KKT عن 10⁻³.'],
  quiz: [
    {
      q: ['Which points determine an SVM boundary?', 'أي النقاط تحدد حد SVM؟'],
      options: [['All points equally', 'كل النقاط بالتساوي'], ['Only the support vectors', 'متجهات الدعم فقط'], ['Only outliers', 'القيم الشاذة فقط'], ['The class centroids', 'مراكز الفئات']],
      answer: 1,
      explain: ['Points with α = 0 contribute nothing to f(x).', 'النقاط التي α = 0 لا تساهم بشيء في f(x).'],
    },
    {
      q: ['Decreasing C makes the margin…', 'خفض قيمة C يجعل الهامش…'],
      options: [['Wider, allowing more violations', 'أعرض مع السماح بمخالفات أكثر'], ['Narrower', 'أضيق'], ['Disappear', 'يختفي'], ['Unchanged', 'دون تغيير']],
      answer: 0,
      explain: ['Violations become cheap, so the optimizer prefers a small ‖w‖ (wide margin).', 'تصبح المخالفات رخيصة، فيفضّل المُحسِّن قيمة صغيرة لـ‖w‖ (هامش عريض).'],
    },
    {
      q: ['A very large γ with the RBF kernel tends to…', 'قيمة γ الكبيرة جدًا مع نواة RBF تميل إلى…'],
      options: [['Underfit', 'نقص الملاءمة'], ['Overfit with islands around points', 'فرط الملاءمة مع جزر حول النقاط'], ['Produce a straight line', 'إنتاج خط مستقيم'], ['Remove support vectors', 'إزالة متجهات الدعم']],
      answer: 1,
      explain: ['Each support vector influences only a tiny neighbourhood.', 'كل متجه دعم يؤثر في جوار صغير جدًا فقط.'],
    },
  ],
  related: ['logistic-regression', 'knn', 'random-forest'],
  references: [
    { title: 'scikit-learn — Support Vector Machines', url: 'https://scikit-learn.org/stable/modules/svm.html' },
    { title: 'Platt (1998), Sequential Minimal Optimization', url: 'https://www.microsoft.com/en-us/research/publication/sequential-minimal-optimization-a-fast-algorithm-for-training-support-vector-machines/' },
    { title: 'Fan, Chen & Lin (2005), Working set selection using second order information (JMLR)', url: 'https://www.jmlr.org/papers/v6/fan05a.html' },
  ],
  compare: {
    purpose: ['Maximum-margin classification', 'تصنيف بالهامش الأقصى'],
    data: ['Small–medium datasets, possibly many features; scaled', 'بيانات صغيرة إلى متوسطة، وربما خصائص كثيرة؛ بعد التحجيم'],
    assumptions: ['Classes are (nearly) separable in the kernel feature space', 'الفئات قابلة للفصل (تقريبًا) في فضاء خصائص النواة'],
    hyperparams: 'C, kernel, gamma',
  },
};

export const naiveBayes: AlgorithmContent = {
  id: 'naive-bayes',
  name: ['Naive Bayes (Gaussian)', 'بايز الساذج (الغاوسي)'],
  short: ['Uses Bayes’ theorem with the "naive" assumption that features are independent given the class.', 'يستخدم نظرية بايز مع افتراض «ساذج» بأن الخصائص مستقلة بشرط معرفة الفئة.'],
  paradigm: 'supervised',
  categories: ['classification'],
  difficulty: 'intermediate',
  labId: 'naive-bayes',
  objectives: [
    ['State Bayes’ theorem and name prior, likelihood, evidence and posterior.', 'صياغة نظرية بايز وتسمية الاحتمال المسبق والأرجحية والدليل والاحتمال اللاحق.'],
    ['Compute a Gaussian likelihood for each feature.', 'حساب أرجحية غاوسية لكل خاصية.'],
    ['Explain the conditional-independence assumption and its consequences.', 'شرح افتراض الاستقلال الشرطي ونتائجه.'],
  ],
  intuition: [
    r`Naive Bayes reasons like a detective updating beliefs with evidence. Before looking at a fruit, you know that apples are common (the **prior**). Then you taste it: it is very sweet and not acidic. How typical is that sweetness for an apple? For an orange? Those are **likelihoods**.

Multiply prior × likelihoods for each class, then normalise so they sum to 1: that gives the **posterior** — the updated belief.

The "naive" part: it assumes the features are **independent within each class**, so the likelihood of all features is just the product of the per-feature likelihoods. The **Gaussian** variant used here models each feature in each class as a bell curve with its own mean and variance.`,
    r`يفكّر بايز الساذج كمحقق يحدّث قناعاته بالأدلة. قبل أن تنظر إلى الفاكهة تعرف أن التفاح شائع (وهذا **الاحتمال المسبق**). ثم تتذوقها: حلوة جدًا وقليلة الحموضة. ما مدى شيوع هذه الحلاوة في التفاح؟ وفي البرتقال؟ هذه هي **الأرجحيات**.

اضرب الاحتمال المسبق × الأرجحيات لكل فئة، ثم وحّد النتائج ليكون مجموعها 1: فتحصل على **الاحتمال اللاحق** — أي القناعة المحدَّثة.

أما الجانب «الساذج» فهو افتراض أن الخصائص **مستقلة داخل كل فئة**، فتكون أرجحية جميع الخصائص مجرد حاصل ضرب أرجحيات كل خاصية. وتنمذج النسخة **الغاوسية** المستخدمة هنا كل خاصية في كل فئة كمنحنى جرسي له متوسطه وتباينه.`,
  ],
  useCases: [
    ['Spam filtering and text classification (multinomial variant).', 'تصفية الرسائل المزعجة وتصنيف النصوص (النسخة متعددة الحدود).'],
    ['Fast baselines and real-time classification.', 'نماذج مرجعية سريعة وتصنيف لحظي.'],
    ['Medical diagnosis with continuous measurements.', 'التشخيص الطبي بقياسات مستمرة.'],
  ],
  steps: [
    ['Estimate each class’s prior P(c) from its frequency.', 'قدّر الاحتمال المسبق P(c) لكل فئة من تكرارها.'],
    ['For every class and feature, estimate a mean μ and variance σ².', 'لكل فئة وخاصية، قدّر المتوسط μ والتباين σ².'],
    ['For a new sample, compute each feature’s Gaussian likelihood under each class.', 'لعينة جديدة، احسب أرجحية غاوس لكل خاصية تحت كل فئة.'],
    ['Multiply prior and likelihoods (add their logs), then normalise.', 'اضرب الاحتمال المسبق بالأرجحيات (اجمع لوغاريتماتها) ثم وحّد النتائج.'],
    ['Predict the class with the highest posterior.', 'تنبأ بالفئة صاحبة أعلى احتمال لاحق.'],
  ],
  math: [
    r`$$P(c\mid\mathbf x) = \frac{P(c)\,p(\mathbf x\mid c)}{p(\mathbf x)} \;\overset{\text{naive}}{=}\; \frac{P(c)\prod_j p(x_j\mid c)}{\sum_k P(k)\prod_j p(x_j\mid k)}$$

Gaussian likelihood per feature:

$$p(x_j\mid c) = \frac{1}{\sqrt{2\pi\sigma_{cj}^2}}\exp\!\Big(-\frac{(x_j-\mu_{cj})^2}{2\sigma_{cj}^2}\Big)$$

Products of small numbers underflow, so implementations sum logarithms and normalise with the log-sum-exp trick. A tiny variance smoothing term ($10^{-9}\times$ the largest feature variance, as in scikit-learn) avoids division by zero.`,
    r`$$P(c\mid\mathbf x) = \frac{P(c)\,p(\mathbf x\mid c)}{p(\mathbf x)} \;\overset{\text{naive}}{=}\; \frac{P(c)\prod_j p(x_j\mid c)}{\sum_k P(k)\prod_j p(x_j\mid k)}$$

الأرجحية الغاوسية لكل خاصية:

$$p(x_j\mid c) = \frac{1}{\sqrt{2\pi\sigma_{cj}^2}}\exp\!\Big(-\frac{(x_j-\mu_{cj})^2}{2\sigma_{cj}^2}\Big)$$

حاصل ضرب الأعداد الصغيرة قد يتلاشى عدديًا، لذا تجمع التطبيقات اللوغاريتمات وتوحّدها بحيلة log-sum-exp. ويمنع حد صغير لتنعيم التباين ($10^{-9}\times$ أكبر تباين للخصائص كما في scikit-learn) القسمة على صفر.`,
  ],
  labGuide: [
    { param: ['Sample sliders', 'منزلقات العينة'], effect: ['Change the evidence and watch each likelihood and the posterior update.', 'غيّر الدليل وراقب تحديث كل أرجحية والاحتمال اللاحق.'] },
    { param: ['Uniform prior', 'احتمال مسبق منتظم'], effect: ['Removes the effect of class frequencies to reveal how much the prior matters.', 'يزيل أثر تكرار الفئات ليكشف مدى أهمية الاحتمال المسبق.'] },
    { param: ['Class Gaussians', 'توزيعات غاوس للفئات'], effect: ['Axis-aligned ellipses visualise the independence assumption.', 'القطوع الناقصة الموازية للمحاور توضّح افتراض الاستقلال.'] },
  ],
  experiments: [
    ['Place the sample between two classes and toggle the uniform prior.', 'ضع العينة بين فئتين وبدّل الاحتمال المسبق المنتظم.'],
    ['Use "Rare class": the rare class needs much stronger evidence to win.', 'استخدم «فئة نادرة»: تحتاج الفئة النادرة دليلًا أقوى بكثير لتفوز.'],
    ['Add correlated (diagonal) points to one class: the axis-aligned Gaussian cannot capture the tilt.', 'أضف نقاطًا مترابطة (قطرية) لفئة واحدة: لا يستطيع توزيع غاوس الموازي للمحاور التقاط الميل.'],
  ],
  evaluation: [
    r`Accuracy, precision/recall and log loss. Naive Bayes often ranks classes well even when its probabilities are over-confident, so check calibration if probabilities themselves matter.`,
    r`الدقة والضبط/الاستدعاء والخسارة اللوغاريتمية. غالبًا ما يرتّب بايز الساذج الفئات جيدًا حتى عندما تكون احتمالاته مفرطة الثقة، لذا افحص المعايرة إذا كانت الاحتمالات نفسها مهمة.`,
  ],
  advantages: [
    ['Extremely fast to train and predict.', 'سريع جدًا في التدريب والتنبؤ.'],
    ['Works with little data; naturally multi-class.', 'يعمل مع بيانات قليلة؛ ومتعدد الفئات بطبيعته.'],
    ['Every step of its reasoning is transparent.', 'كل خطوة من استدلاله شفافة.'],
  ],
  limitations: [
    ['The independence assumption is rarely true; correlated features are double-counted.', 'نادرًا ما يتحقق افتراض الاستقلال؛ وتُحسب الخصائص المترابطة مرتين.'],
    ['Gaussian variant assumes bell-shaped features within each class.', 'تفترض النسخة الغاوسية خصائص جرسية الشكل داخل كل فئة.'],
    ['Probabilities can be poorly calibrated.', 'قد تكون الاحتمالات ضعيفة المعايرة.'],
  ],
  mistakes: [
    ['Multiplying many tiny probabilities without logarithms (numerical underflow).', 'ضرب احتمالات صغيرة كثيرة دون لوغاريتمات (تلاشٍ عددي).'],
    ['Using the Gaussian variant for word counts (use Multinomial NB).', 'استخدام النسخة الغاوسية لعدّ الكلمات (استخدم Multinomial NB).'],
    ['Ignoring the prior when classes are imbalanced.', 'تجاهل الاحتمال المسبق عندما تكون الفئات غير متوازنة.'],
  ],
  python: `from sklearn.naive_bayes import GaussianNB
import numpy as np

X = np.array([[7.1, 3.0], [6.8, 3.5], [6.1, 5.7], [5.8, 5.4], [2.3, 8.1], [2.6, 8.4]])
y = np.array([0, 0, 1, 1, 2, 2])          # apple, orange, lemon (synthetic)

nb = GaussianNB(var_smoothing=1e-9).fit(X, y)
print("priors:", nb.class_prior_)
print("means:", nb.theta_)
print("variances:", nb.var_)
print("posterior:", nb.predict_proba([[5.2, 5.0]]))`,
  pythonNote: ['The lab’s Gaussian NB mirrors scikit-learn’s GaussianNB: maximum-likelihood (population) variances, the same variance smoothing, and log-space computation.', 'يطابق بايز الساذج الغاوسي في المختبر GaussianNB في scikit-learn: تباينات بالأرجحية العظمى (تباين المجتمع)، ونفس تنعيم التباين، والحساب في الفضاء اللوغاريتمي.'],
  quiz: [
    {
      q: ['In Bayes’ theorem, the prior P(c) represents…', 'في نظرية بايز، يمثل الاحتمال المسبق P(c)…'],
      options: [['How common class c is before seeing the features', 'مدى شيوع الفئة c قبل رؤية الخصائص'], ['The probability of the features', 'احتمال الخصائص'], ['The final answer', 'الإجابة النهائية'], ['The error rate', 'معدل الخطأ']],
      answer: 0,
      explain: ['It is the belief before any evidence is considered.', 'إنها القناعة قبل النظر في أي دليل.'],
    },
    {
      q: ['What does "naive" refer to?', 'إلامَ تشير كلمة «ساذج»؟'],
      options: [['Using small datasets', 'استخدام بيانات صغيرة'], ['Assuming features are independent given the class', 'افتراض استقلال الخصائص بشرط الفئة'], ['Ignoring the prior', 'تجاهل الاحتمال المسبق'], ['Using only one feature', 'استخدام خاصية واحدة فقط']],
      answer: 1,
      explain: ['That assumption lets the joint likelihood factor into a product.', 'هذا الافتراض يتيح تحليل الأرجحية المشتركة إلى حاصل ضرب.'],
    },
    {
      q: ['Why compute with log-probabilities?', 'لماذا نحسب باستخدام لوغاريتمات الاحتمالات؟'],
      options: [['They are more accurate statistically', 'لأنها أدق إحصائيًا'], ['To avoid numerical underflow when multiplying many small numbers', 'لتجنب التلاشي العددي عند ضرب أعداد صغيرة كثيرة'], ['Because priors are negative', 'لأن الاحتمالات المسبقة سالبة'], ['It is required by Bayes’ theorem', 'لأن نظرية بايز تتطلب ذلك']],
      answer: 1,
      explain: ['Sums of logs stay in a safe numeric range.', 'مجاميع اللوغاريتمات تبقى في نطاق عددي آمن.'],
    },
  ],
  related: ['logistic-regression', 'knn', 'gmm'],
  references: [
    { title: 'scikit-learn — Naive Bayes', url: 'https://scikit-learn.org/stable/modules/naive_bayes.html' },
    { title: 'Murphy, Probabilistic Machine Learning: An Introduction (ch. 9)', url: 'https://probml.github.io/pml-book/book1.html' },
  ],
  compare: {
    purpose: ['Probabilistic classification via Bayes’ theorem', 'تصنيف احتمالي بنظرية بايز'],
    data: ['Small or high-dimensional data; text (multinomial variant)', 'بيانات صغيرة أو عالية الأبعاد؛ نصوص (النسخة متعددة الحدود)'],
    assumptions: ['Features conditionally independent; Gaussian per class (this variant)', 'استقلال الخصائص شرطيًا؛ توزيع غاوس لكل فئة (هذه النسخة)'],
    hyperparams: 'var_smoothing, priors',
  },
};

export const SUPERVISED = [linearRegression, logisticRegression, knn, decisionTree, randomForest, svm, naiveBayes];
