import type { Text } from '@/i18n/types';
import type { Paradigm } from './types';

const r = String.raw;

export interface ParadigmContent {
  id: Paradigm;
  title: Text;
  tagline: Text;
  feedback: Text;
  body: Text;
  examples: Text[];
  algorithms: string[];
  glossary?: { term: Text; def: Text }[];
  depth: 'deep' | 'intro';
  futureNote?: Text;
}

export const PARADIGMS: ParadigmContent[] = [
  {
    id: 'supervised',
    title: ['Supervised Learning', 'التعلّم الموجَّه'],
    tagline: ['Learn from examples that come with the right answers.', 'التعلّم من أمثلة مرفقة بالإجابات الصحيحة.'],
    feedback: ['Correct label for every training example', 'تصنيف صحيح لكل مثال تدريب'],
    depth: 'deep',
    body: [
      r`In supervised learning each training example is a pair $(\mathbf x, y)$: the inputs and the correct output provided by a "supervisor" (often a human annotator or a historical record). The algorithm learns a function $\hat y = f(\mathbf x)$ that maps inputs to outputs and then predicts outputs for new inputs.

There are two main families:

- **Regression** – the output is a number (price, temperature, demand). Try *Linear Regression* and *KNN* regression ideas.
- **Classification** – the output is a category (spam / not spam, digit 0–9, disease type). Try *Logistic Regression, KNN, Decision Trees, Random Forests, SVMs and Naive Bayes*.

All seven supervised algorithms on this platform have full interactive labs. Evaluate supervised models on **held-out** data with metrics such as MSE/R² (regression) or accuracy, precision, recall and F1 (classification).`,
      r`في التعلّم الموجَّه يكون كل مثال تدريب زوجًا $(\mathbf x, y)$: المدخلات والمُخرج الصحيح الذي يقدّمه «مشرف» (غالبًا مُصنِّف بشري أو سجل تاريخي). تتعلّم الخوارزمية دالة $\hat y = f(\mathbf x)$ تحوّل المدخلات إلى مخرجات، ثم تتنبأ بالمخرجات لمدخلات جديدة.

هناك عائلتان رئيسيتان:

- **الانحدار** – المُخرج عدد (سعر، حرارة، طلب). جرّب *الانحدار الخطي* وأفكار انحدار *KNN*.
- **التصنيف** – المُخرج فئة (مزعجة / غير مزعجة، رقم 0–9، نوع مرض). جرّب *الانحدار اللوجستي وKNN وأشجار القرار والغابات العشوائية وSVM وبايز الساذج*.

جميع خوارزميات التعلّم الموجَّه السبع في هذه المنصة لها مختبرات تفاعلية كاملة. قيّم النماذج الموجَّهة على بيانات **محجوزة** بمقاييس مثل MSE وR² (للانحدار) أو الدقة والضبط والاستدعاء وF1 (للتصنيف).`,
    ],
    examples: [
      ['Email spam filtering', 'تصفية الرسائل المزعجة'],
      ['Predicting delivery times', 'التنبؤ بأوقات التوصيل'],
      ['Medical image diagnosis', 'تشخيص الصور الطبية'],
      ['Credit risk scoring', 'تقييم مخاطر الائتمان'],
    ],
    algorithms: ['linear-regression', 'logistic-regression', 'knn', 'decision-tree', 'random-forest', 'svm', 'naive-bayes'],
  },
  {
    id: 'unsupervised',
    title: ['Unsupervised Learning', 'التعلّم غير الموجَّه'],
    tagline: ['Discover hidden structure in data without labels.', 'اكتشاف البنية الخفية في البيانات دون تصنيفات.'],
    feedback: ['No labels — only the inputs', 'لا تصنيفات — المدخلات فقط'],
    depth: 'deep',
    body: [
      r`Unsupervised learning works with inputs $\mathbf x$ only. Nobody tells the algorithm what the "right answer" is; instead it looks for **structure**:

- **Clustering** – group similar examples (K-Means, Hierarchical Clustering, DBSCAN, Gaussian Mixtures).
- **Dimensionality reduction** – describe data with fewer variables while keeping most information (PCA, t-SNE, UMAP).
- **Association rules** – find items that occur together (Apriori, FP-Growth).

Because there are no labels, evaluation is harder: we use internal measures (inertia, silhouette, explained variance), visual inspection, and whether the discovered structure is **useful** for a downstream task.`,
      r`يعمل التعلّم غير الموجَّه مع المدخلات $\mathbf x$ فقط. لا أحد يخبر الخوارزمية بـ«الإجابة الصحيحة»، بل تبحث عن **البنية**:

- **التجميع** – تجميع الأمثلة المتشابهة (K-Means، التجميع الهرمي، DBSCAN، خلائط غاوس).
- **تقليل الأبعاد** – وصف البيانات بمتغيرات أقل مع الحفاظ على معظم المعلومات (PCA، t-SNE، UMAP).
- **قواعد الارتباط** – إيجاد العناصر التي تظهر معًا (Apriori، FP-Growth).

ولأنه لا توجد تصنيفات يكون التقييم أصعب: نستخدم مقاييس داخلية (القصور الذاتي، الصورة الظلية، التباين المفسَّر)، والفحص البصري، ومدى **فائدة** البنية المكتشفة لمهمة لاحقة.`,
    ],
    examples: [
      ['Customer segmentation', 'تقسيم العملاء'],
      ['Visualising gene-expression data', 'تصوّر بيانات التعبير الجيني'],
      ['Market-basket analysis', 'تحليل سلة التسوق'],
      ['Anomaly detection in network traffic', 'كشف الشذوذ في حركة الشبكة'],
    ],
    algorithms: ['k-means', 'pca', 'hierarchical', 'dbscan', 'gmm', 'association-rules', 'apriori', 'fp-growth', 'tsne', 'umap'],
  },
  {
    id: 'reinforcement',
    title: ['Reinforcement Learning', 'التعلّم المعزّز'],
    tagline: ['Learn to act by trial, error and reward.', 'تعلّم التصرف بالتجربة والخطأ والمكافأة.'],
    feedback: ['A reward signal after actions (often delayed)', 'إشارة مكافأة بعد الإجراءات (غالبًا متأخرة)'],
    depth: 'deep',
    body: [
      r`In reinforcement learning (RL) an **agent** interacts with an **environment** over time. At each step it observes a **state**, chooses an **action**, and receives a **reward** and a new state. Nobody tells it the correct action — it must discover which behaviour leads to the most reward in the long run.

Two things make RL special: rewards can be **delayed** (a chess move pays off many moves later), and the agent's own actions decide which data it sees, creating the **exploration–exploitation** dilemma.

The two mandatory labs show both ideas: the **multi-armed bandit** isolates exploration vs exploitation, and the **Q-learning grid world** adds states, delayed rewards and the Bellman equation.`,
      r`في التعلّم المعزّز يتفاعل **وكيل** مع **بيئة** عبر الزمن. في كل خطوة يلاحظ **حالة**، ويختار **إجراءً**، ويتلقى **مكافأة** وحالة جديدة. لا أحد يخبره بالإجراء الصحيح — بل عليه اكتشاف السلوك الذي يقود إلى أكبر مكافأة على المدى البعيد.

يتميّز التعلّم المعزّز بأمرين: قد تكون المكافآت **متأخرة** (نقلة شطرنج تؤتي ثمارها بعد نقلات كثيرة)، وإجراءات الوكيل نفسه تحدد البيانات التي يراها، مما يخلق معضلة **الاستكشاف والاستغلال**.

يُظهر المختبران الأساسيان الفكرتين: **قاطع الطريق متعدد الأذرع** يعزل الاستكشاف مقابل الاستغلال، و**عالم الشبكة لتعلّم Q** يضيف الحالات والمكافآت المتأخرة ومعادلة بيلمان.`,
    ],
    examples: [
      ['Game-playing agents', 'وكلاء الألعاب'],
      ['Robot locomotion and control', 'حركة الروبوتات والتحكم بها'],
      ['Recommendation as a sequential decision', 'التوصية كقرار تسلسلي'],
      ['Resource and traffic-light scheduling', 'جدولة الموارد وإشارات المرور'],
    ],
    algorithms: ['q-learning', 'bandit', 'sarsa', 'dqn', 'policy-gradient', 'actor-critic'],
    glossary: [
      { term: ['Agent', 'الوكيل'], def: ['The learner and decision-maker (the robot in the grid).', 'المتعلّم وصانع القرار (الروبوت في الشبكة).'] },
      { term: ['Environment', 'البيئة'], def: ['Everything the agent interacts with; it returns new states and rewards.', 'كل ما يتفاعل معه الوكيل؛ وتعيد حالات ومكافآت جديدة.'] },
      { term: ['State $s$', 'الحالة $s$'], def: ['A description of the current situation (the agent’s cell).', 'وصف للموقف الحالي (خلية الوكيل).'] },
      { term: ['Action $a$', 'الإجراء $a$'], def: ['A choice available to the agent (up, right, down, left).', 'خيار متاح للوكيل (أعلى، يمين، أسفل، يسار).'] },
      { term: ['Reward $r$', 'المكافأة $r$'], def: ['A number telling the agent how good the last transition was.', 'رقم يخبر الوكيل بمدى جودة الانتقال الأخير.'] },
      { term: ['Policy $\\pi$', 'السياسة $\\pi$'], def: ['The agent’s behaviour: which action to take in each state.', 'سلوك الوكيل: أي إجراء يتخذه في كل حالة.'] },
      { term: ['Episode', 'الحلقة'], def: ['One run from a start state to a terminal state (goal or pit) or a step limit.', 'تشغيل واحد من حالة البداية حتى حالة نهائية (هدف أو حفرة) أو حد للخطوات.'] },
      { term: ['Exploration', 'الاستكشاف'], def: ['Trying actions to gain information, even if they look worse now.', 'تجربة إجراءات لاكتساب معلومات حتى لو بدت أسوأ الآن.'] },
      { term: ['Exploitation', 'الاستغلال'], def: ['Choosing the action currently believed to be best.', 'اختيار الإجراء الذي يُعتقد حاليًا أنه الأفضل.'] },
      { term: ['Value function', 'دالة القيمة'], def: ['Expected future return: $V(s)$ for a state, $Q(s,a)$ for a state–action pair.', 'العائد المستقبلي المتوقع: $V(s)$ للحالة، و$Q(s,a)$ لزوج الحالة والإجراء.'] },
      { term: ['Discount factor $\\gamma$', 'معامل الخصم $\\gamma$'], def: ['Weight of future rewards, $0 \\le \\gamma < 1$: return $= r_1 + \\gamma r_2 + \\gamma^2 r_3 + \\dots$', 'وزن المكافآت المستقبلية، $0 \\le \\gamma < 1$: العائد $= r_1 + \\gamma r_2 + \\gamma^2 r_3 + \\dots$'] },
      { term: ['Learning rate $\\alpha$', 'معدل التعلّم $\\alpha$'], def: ['How far each update moves an estimate toward its new target.', 'مقدار تحريك كل تحديث للتقدير نحو هدفه الجديد.'] },
      { term: ['Bellman equation', 'معادلة بيلمان'], def: ['A value equals the immediate reward plus the discounted value of what comes next: $Q^*(s,a) = \\mathbb E[r + \\gamma \\max_{a\'} Q^*(s\',a\')]$.', 'القيمة تساوي المكافأة الفورية زائد القيمة المخصومة لما يليها: $Q^*(s,a) = \\mathbb E[r + \\gamma \\max_{a\'} Q^*(s\',a\')]$.'] },
    ],
  },
  {
    id: 'semi-supervised',
    title: ['Semi-Supervised Learning', 'التعلّم شبه الموجَّه'],
    tagline: ['A few labels plus lots of unlabelled data.', 'تصنيفات قليلة مع بيانات كثيرة غير مصنّفة.'],
    feedback: ['Labels for a small subset of examples', 'تصنيفات لمجموعة صغيرة من الأمثلة'],
    depth: 'intro',
    body: [
      r`Labels are often expensive (a radiologist's time, a legal expert's review) while unlabelled data is cheap. Semi-supervised learning uses **both**.

Common ideas:
- **Self-training / pseudo-labelling** – train on the labelled data, predict labels for unlabelled examples the model is confident about, add them to the training set, repeat.
- **Label propagation** – spread labels through a similarity graph from labelled points to their neighbours.
- **Consistency regularization** – a model should give the same prediction for an example and a slightly perturbed version of it.

It works when the **cluster assumption** holds: points in the same dense region tend to share a label. If that assumption fails, pseudo-labels can reinforce mistakes.`,
      r`التصنيفات مكلفة غالبًا (وقت أخصائي الأشعة، ومراجعة الخبير القانوني) بينما البيانات غير المصنّفة رخيصة. يستخدم التعلّم شبه الموجَّه **كلتيهما**.

أفكار شائعة:
- **التدريب الذاتي / التصنيفات الزائفة** – درّب على البيانات المصنّفة، وتنبأ بتصنيفات الأمثلة غير المصنّفة التي يثق بها النموذج، وأضفها إلى بيانات التدريب، وكرّر.
- **نشر التصنيفات** – نشر التصنيفات عبر رسم تشابه من النقاط المصنّفة إلى جيرانها.
- **تنظيم الاتساق** – يجب أن يعطي النموذج التنبؤ نفسه لمثال ولنسخة مشوّشة قليلًا منه.

ينجح ذلك عندما يتحقق **افتراض العناقيد**: النقاط في المنطقة الكثيفة نفسها تميل إلى مشاركة التصنيف. وإذا لم يتحقق قد تعزّز التصنيفات الزائفة الأخطاء.`,
    ],
    examples: [
      ['Medical imaging with few expert annotations', 'التصوير الطبي مع شروح خبراء قليلة'],
      ['Web page or document classification', 'تصنيف صفحات الويب أو المستندات'],
      ['Speech recognition with limited transcripts', 'التعرّف على الكلام مع نصوص مكتوبة محدودة'],
    ],
    algorithms: ['knn', 'gmm', 'k-means'],
    futureNote: ['An interactive label-propagation lab is planned; the 2-D plotting and KNN components are reusable for it.', 'مختبر تفاعلي لنشر التصنيفات مخطط له؛ ومكونات الرسم الثنائي الأبعاد وKNN قابلة لإعادة الاستخدام فيه.'],
  },
  {
    id: 'self-supervised',
    title: ['Self-Supervised Learning', 'التعلّم الذاتي الإشراف'],
    tagline: ['Create the labels from the data itself.', 'إنشاء التصنيفات من البيانات نفسها.'],
    feedback: ['Automatically generated targets (pretext tasks)', 'أهداف مولَّدة تلقائيًا (مهام تمهيدية)'],
    depth: 'intro',
    body: [
      r`Self-supervised learning turns unlabelled data into a supervised problem by **hiding part of the data and asking the model to predict it**:

- Predict the next word, or a masked word, in a sentence (the basis of modern language models).
- Predict a missing patch of an image, or whether two augmented crops come from the same photo (**contrastive learning**).
- Predict the next frame of a video or the next audio segment.

The model learns rich **representations** while solving these pretext tasks. Those representations are then **fine-tuned** with a small labelled dataset for the real task. It differs from semi-supervised learning in that the pre-training stage needs no human labels at all.`,
      r`يحوّل التعلّم الذاتي الإشراف البيانات غير المصنّفة إلى مسألة موجَّهة **بإخفاء جزء من البيانات ومطالبة النموذج بالتنبؤ به**:

- التنبؤ بالكلمة التالية أو بكلمة محجوبة في جملة (أساس نماذج اللغة الحديثة).
- التنبؤ بجزء مفقود من صورة، أو ما إذا كان مقطعان معدّلان من الصورة نفسها (**التعلّم التبايني**).
- التنبؤ بالإطار التالي من فيديو أو المقطع الصوتي التالي.

يتعلّم النموذج **تمثيلات** غنية أثناء حل هذه المهام التمهيدية، ثم **تُضبط بدقة** هذه التمثيلات ببيانات مصنّفة قليلة للمهمة الحقيقية. ويختلف عن التعلّم شبه الموجَّه في أن مرحلة التدريب المسبق لا تحتاج أي تصنيفات بشرية إطلاقًا.`,
    ],
    examples: [
      ['Large language models (next-token prediction)', 'نماذج اللغة الكبيرة (التنبؤ بالرمز التالي)'],
      ['Image representation learning (contrastive methods)', 'تعلّم تمثيلات الصور (الطرق التباينية)'],
      ['Speech models pre-trained on raw audio', 'نماذج كلام مدرَّبة مسبقًا على صوت خام'],
    ],
    algorithms: ['pca', 'umap'],
    futureNote: ['Future module: an interactive masked-prediction demo built on the existing chart components.', 'وحدة مستقبلية: عرض تفاعلي للتنبؤ بالأجزاء المحجوبة مبني على مكونات الرسم الحالية.'],
  },
];

export const getParadigm = (id: string) => PARADIGMS.find((p) => p.id === id);
