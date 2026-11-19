import type { Text } from '@/i18n/types';
import type { QuizQuestion } from './types';

const r = String.raw;

export type FundamentalDemo = 'venn' | 'how-ml-works' | 'dataset-table' | 'features-labels' | 'split' | 'train-infer' | 'generalization' | 'lifecycle' | 'paradigm-sorter';

export interface FundamentalModule {
  id: string;
  title: Text;
  summary: Text;
  level: 'beginner' | 'intermediate';
  body: Text;
  keyPoints: Text[];
  demo?: FundamentalDemo;
  quiz?: QuizQuestion[];
  next?: string[];
}

const q = (qq: [string, string], options: [string, string][], answer: number, explain: [string, string]): QuizQuestion => ({ q: qq, options, answer, explain });

export const FUNDAMENTALS: FundamentalModule[] = [
  {
    id: 'what-is-ai',
    title: ['What is Artificial Intelligence?', 'ما الذكاء الاصطناعي؟'],
    summary: ['The broad goal of building computer systems that perform tasks we associate with intelligence.', 'الهدف الواسع لبناء أنظمة حاسوبية تؤدي مهام نربطها بالذكاء.'],
    level: 'beginner',
    body: [
      r`**Artificial Intelligence (AI)** is the field of building computer systems that can perform tasks which normally require human intelligence: understanding language, recognising images, planning, making decisions or playing games.

AI is an umbrella term. Some AI systems follow **hand-written rules** ("if the temperature is above 30 °C, turn on the fan"). Others **learn their behaviour from data** — that subset is Machine Learning.

Most AI in use today is **narrow AI**: it is very good at one specific task (translating text, detecting spam) but has no general understanding of the world.`,
      r`**الذكاء الاصطناعي** هو مجال بناء أنظمة حاسوبية تستطيع أداء مهام تتطلب عادةً ذكاءً بشريًا: فهم اللغة، والتعرّف على الصور، والتخطيط، واتخاذ القرارات، ولعب الألعاب.

الذكاء الاصطناعي مصطلح شامل. فبعض أنظمته تتبع **قواعد مكتوبة يدويًا** («إذا تجاوزت الحرارة 30 درجة فشغّل المروحة»)، وبعضها **يتعلّم سلوكه من البيانات** — وهذه المجموعة الفرعية هي تعلّم الآلة.

معظم الذكاء الاصطناعي المستخدم اليوم **ذكاء ضيق**: بارع جدًا في مهمة محددة (ترجمة النصوص، كشف الرسائل المزعجة) لكنه لا يملك فهمًا عامًا للعالم.`,
    ],
    keyPoints: [
      ['AI = systems performing tasks that seem to need intelligence.', 'الذكاء الاصطناعي = أنظمة تؤدي مهام تبدو بحاجة إلى ذكاء.'],
      ['It includes rule-based systems and learning systems.', 'يشمل الأنظمة القائمة على القواعد والأنظمة المتعلّمة.'],
      ['Today’s AI is narrow: excellent at specific tasks.', 'الذكاء الاصطناعي اليوم ضيق: ممتاز في مهام محددة.'],
    ],
    demo: 'venn',
    next: ['what-is-ml'],
  },
  {
    id: 'what-is-ml',
    title: ['What is Machine Learning?', 'ما تعلّم الآلة؟'],
    summary: ['Instead of writing rules, we let the computer learn patterns from examples.', 'بدل كتابة القواعد، نترك الحاسوب يتعلّم الأنماط من الأمثلة.'],
    level: 'beginner',
    body: [
      r`**Machine Learning (ML)** is a branch of AI in which a program **improves at a task by learning from data**, rather than by being explicitly programmed with rules.

Think about detecting spam. Writing rules by hand ("contains the word *prize*") is fragile: spammers adapt and good emails get blocked. With ML, we show the computer thousands of emails already labelled *spam* or *not spam*, and an algorithm finds the patterns that distinguish them.

A classic definition (Tom Mitchell, 1997): a program learns from experience **E** with respect to a task **T** and performance measure **P** if its performance at T, as measured by P, improves with E.`,
      r`**تعلّم الآلة** فرع من الذكاء الاصطناعي **يتحسّن فيه البرنامج في مهمة ما بالتعلّم من البيانات** بدل برمجته صراحةً بقواعد.

فكّر في كشف الرسائل المزعجة. كتابة القواعد يدويًا («تحتوي كلمة *جائزة*») أمر هش: يتكيّف المرسلون المزعجون وتُحجب رسائل سليمة. أما مع تعلّم الآلة فنعرض على الحاسوب آلاف الرسائل المصنّفة مسبقًا *مزعجة* أو *غير مزعجة*، فتجد الخوارزمية الأنماط التي تميّز بينها.

تعريف كلاسيكي (توم ميتشل، 1997): يتعلّم البرنامج من الخبرة **E** بالنسبة لمهمة **T** ومقياس أداء **P** إذا تحسّن أداؤه في T، مقيسًا بـP، مع ازدياد E.`,
    ],
    keyPoints: [
      ['ML learns patterns from data instead of following hand-written rules.', 'يتعلّم تعلّم الآلة الأنماط من البيانات بدل اتباع قواعد مكتوبة يدويًا.'],
      ['Task, experience (data) and a performance measure define a learning problem.', 'المهمة والخبرة (البيانات) ومقياس الأداء تحدد مسألة التعلّم.'],
    ],
    demo: 'how-ml-works',
    quiz: [
      q(['Which situation is best suited to machine learning?', 'أي موقف هو الأنسب لتعلّم الآلة؟'], [['Recognising handwritten digits from many examples', 'التعرّف على الأرقام المكتوبة يدويًا من أمثلة كثيرة'], ['Adding two numbers', 'جمع عددين'], ['Sorting a list alphabetically', 'ترتيب قائمة أبجديًا'], ['Converting Celsius to Fahrenheit', 'تحويل الدرجة المئوية إلى فهرنهايت']], 0, ['The rules for handwriting are hard to write down but easy to learn from examples.', 'قواعد الخط اليدوي صعبة الكتابة لكن سهلة التعلّم من الأمثلة.']),
    ],
    next: ['what-is-dl', 'how-ml-works'],
  },
  {
    id: 'what-is-dl',
    title: ['What is Deep Learning?', 'ما التعلّم العميق؟'],
    summary: ['Machine learning with many-layered neural networks that learn their own features.', 'تعلّم آلة بشبكات عصبية متعددة الطبقات تتعلّم خصائصها بنفسها.'],
    level: 'beginner',
    body: [
      r`**Deep Learning (DL)** is a subset of machine learning that uses **artificial neural networks with many layers**. Each layer transforms its input into a slightly more abstract representation: in an image model, early layers detect edges, later ones detect shapes, and the last ones detect objects.

The key difference from "classic" ML is **representation learning**: you can feed raw data (pixels, audio, text tokens) and the network learns useful features itself. The price is that deep learning typically needs **much more data and computation**, and its decisions are harder to interpret.

Deep learning powers speech recognition, machine translation, image generation and large language models.`,
      r`**التعلّم العميق** مجموعة فرعية من تعلّم الآلة تستخدم **شبكات عصبية اصطناعية متعددة الطبقات**. تحوّل كل طبقة مُدخلها إلى تمثيل أكثر تجريدًا قليلًا: في نماذج الصور تكتشف الطبقات الأولى الحواف، واللاحقة الأشكال، والأخيرة الأجسام.

الفرق الجوهري عن تعلّم الآلة «التقليدي» هو **تعلّم التمثيلات**: يمكنك إدخال البيانات الخام (بكسلات، صوت، رموز نصية) فتتعلّم الشبكة الخصائص المفيدة بنفسها. والثمن أن التعلّم العميق يحتاج عادةً **بيانات وحوسبة أكثر بكثير**، وقراراته أصعب في التفسير.

يقف التعلّم العميق وراء التعرّف على الكلام، والترجمة الآلية، وتوليد الصور، ونماذج اللغة الكبيرة.`,
    ],
    keyPoints: [
      ['Deep learning = ML with multi-layer neural networks.', 'التعلّم العميق = تعلّم آلة بشبكات عصبية متعددة الطبقات.'],
      ['It learns features directly from raw data.', 'يتعلّم الخصائص مباشرة من البيانات الخام.'],
      ['Needs more data and compute; less interpretable.', 'يحتاج بيانات وحوسبة أكثر؛ وأقل قابلية للتفسير.'],
    ],
    demo: 'venn',
    next: ['ai-ml-dl'],
  },
  {
    id: 'ai-ml-dl',
    title: ['AI vs ML vs Deep Learning', 'الذكاء الاصطناعي مقابل تعلّم الآلة مقابل التعلّم العميق'],
    summary: ['Three nested ideas: every deep learning system is ML, and every ML system is AI.', 'ثلاث أفكار متداخلة: كل نظام تعلّم عميق هو تعلّم آلة، وكل نظام تعلّم آلة هو ذكاء اصطناعي.'],
    level: 'beginner',
    body: [
      r`The three terms are **nested**, not competing:

- **AI** – the whole goal of intelligent behaviour (including rule-based expert systems and search algorithms).
- **ML** – the part of AI that learns from data (linear regression, decision trees, K-Means, Q-learning…).
- **DL** – the part of ML that uses deep neural networks.

When choosing an approach, ask: Can I write the rules? (classic programming / rule-based AI). Do I have structured data and need interpretability? (classic ML). Do I have huge amounts of raw data like images or text? (deep learning).`,
      r`المصطلحات الثلاثة **متداخلة** لا متنافسة:

- **الذكاء الاصطناعي** – الهدف الكامل للسلوك الذكي (بما فيه الأنظمة الخبيرة القائمة على القواعد وخوارزميات البحث).
- **تعلّم الآلة** – جزء الذكاء الاصطناعي الذي يتعلّم من البيانات (الانحدار الخطي، أشجار القرار، K-Means، تعلّم Q…).
- **التعلّم العميق** – جزء تعلّم الآلة الذي يستخدم الشبكات العصبية العميقة.

عند اختيار النهج اسأل: هل أستطيع كتابة القواعد؟ (برمجة تقليدية / ذكاء قائم على القواعد). هل لدي بيانات منظّمة وأحتاج قابلية التفسير؟ (تعلّم آلة تقليدي). هل لدي كميات ضخمة من البيانات الخام كالصور والنصوص؟ (تعلّم عميق).`,
    ],
    keyPoints: [['DL ⊂ ML ⊂ AI.', 'التعلّم العميق ⊂ تعلّم الآلة ⊂ الذكاء الاصطناعي.'], ['Choose the simplest approach that solves the problem.', 'اختر أبسط نهج يحل المشكلة.']],
    demo: 'venn',
    quiz: [
      q(['Which statement is true?', 'أي عبارة صحيحة؟'], [['Every deep learning model is a machine learning model', 'كل نموذج تعلّم عميق هو نموذج تعلّم آلة'], ['Every AI system learns from data', 'كل نظام ذكاء اصطناعي يتعلّم من البيانات'], ['Machine learning is a type of deep learning', 'تعلّم الآلة نوع من التعلّم العميق'], ['AI and ML are unrelated', 'الذكاء الاصطناعي وتعلّم الآلة غير مرتبطين']], 0, ['DL is a subset of ML. Some AI (rule-based) does not learn at all.', 'التعلّم العميق مجموعة فرعية من تعلّم الآلة، وبعض الذكاء الاصطناعي (القائم على القواعد) لا يتعلّم أصلًا.']),
    ],
    next: ['how-ml-works'],
  },
  {
    id: 'how-ml-works',
    title: ['How Machine Learning works', 'كيف يعمل تعلّم الآلة'],
    summary: ['Data + a model with adjustable parameters + a loss to minimise + an optimiser.', 'بيانات + نموذج بمعاملات قابلة للضبط + خسارة نقللها + مُحسِّن.'],
    level: 'beginner',
    body: [
      r`Almost every ML method has the same four ingredients:

1. **Data** – examples to learn from.
2. **A model** – a family of functions with adjustable **parameters** (e.g. a line $\hat y = wx+b$ with parameters $w$ and $b$).
3. **A loss function** – a number that says how wrong the model's predictions are (e.g. mean squared error).
4. **An optimiser** – a procedure that changes the parameters to reduce the loss (e.g. gradient descent).

"Learning" means searching for the parameter values that make the loss small on the training data — while still working on **new** data. Try it: the Linear Regression lab shows all four ingredients at once.`,
      r`تشترك معظم طرق تعلّم الآلة في أربعة مكونات:

1. **البيانات** – أمثلة نتعلّم منها.
2. **النموذج** – عائلة من الدوال بـ**معاملات** قابلة للضبط (مثل الخط $\hat y = wx+b$ بالمعاملين $w$ و$b$).
3. **دالة الخسارة** – رقم يبيّن مدى خطأ تنبؤات النموذج (مثل متوسط مربع الخطأ).
4. **المُحسِّن** – إجراء يغيّر المعاملات لخفض الخسارة (مثل الانحدار التدرّجي).

«التعلّم» يعني البحث عن قيم المعاملات التي تجعل الخسارة صغيرة على بيانات التدريب — مع بقائها جيدة على البيانات **الجديدة**. جرّب ذلك: مختبر الانحدار الخطي يعرض المكونات الأربعة معًا.`,
    ],
    keyPoints: [['Data, model, loss, optimiser.', 'البيانات، النموذج، الخسارة، المُحسِّن.'], ['Training = adjusting parameters to reduce loss.', 'التدريب = ضبط المعاملات لخفض الخسارة.']],
    demo: 'how-ml-works',
    next: ['datasets', 'training-inference'],
  },
  {
    id: 'datasets',
    title: ['What are datasets?', 'ما مجموعات البيانات؟'],
    summary: ['A table of examples: each row is one example, each column one measured property.', 'جدول من الأمثلة: كل صف مثال واحد، وكل عمود خاصية مقيسة.'],
    level: 'beginner',
    body: [
      r`A **dataset** is a collection of examples. In tabular form each **row** is one example (also called a sample, record or observation) and each **column** is one property measured for every example.

Datasets come in many forms: tables, images, audio, text, time series, graphs. Their **quality** matters more than almost anything else: missing values, measurement errors, duplicated rows and **biased sampling** (some groups under-represented) all limit what a model can learn.

All datasets used in this platform's labs are **small synthetic educational datasets**, generated with a fixed random seed so that experiments are reproducible.`,
      r`**مجموعة البيانات** تجميع من الأمثلة. في الشكل الجدولي يكون كل **صف** مثالًا واحدًا (ويسمى أيضًا عينة أو سجلًا أو مشاهدة)، وكل **عمود** خاصية مقيسة لكل مثال.

تأتي البيانات بأشكال كثيرة: جداول، صور، صوت، نصوص، سلاسل زمنية، رسوم بيانية. و**جودتها** أهم من أي شيء تقريبًا: القيم المفقودة، وأخطاء القياس، والصفوف المكررة، و**المعاينة المنحازة** (تمثيل ناقص لبعض الفئات) كلها تحدّ مما يستطيع النموذج تعلّمه.

جميع البيانات المستخدمة في مختبرات هذه المنصة **بيانات تعليمية اصطناعية صغيرة**، تولَّد ببذرة عشوائية ثابتة لتكون التجارب قابلة للتكرار.`,
    ],
    keyPoints: [['Rows = examples, columns = properties.', 'الصفوف = أمثلة، والأعمدة = خصائص.'], ['Data quality and representativeness limit every model.', 'جودة البيانات وتمثيلها يحدّان أي نموذج.']],
    demo: 'dataset-table',
    next: ['features-labels'],
  },
  {
    id: 'features-labels',
    title: ['Features and labels', 'الخصائص والتصنيفات'],
    summary: ['Features are what the model sees; the label is what it must predict.', 'الخصائص هي ما يراه النموذج، والتصنيف هو ما يجب أن يتنبأ به.'],
    level: 'beginner',
    body: [
      r`**Features** (inputs, attributes, $\mathbf x$) are the measurable properties the model uses to make a prediction — e.g. a house's size, number of rooms and age.

The **label** (target, output, $y$) is the answer we want to predict — e.g. the price. In supervised learning every training example has a known label. When the label is a **number** the task is **regression**; when it is a **category** the task is **classification**.

Choosing and constructing good features (**feature engineering**) is often the biggest lever for performance. Beware of features that would not be available at prediction time — that is **data leakage**.`,
      r`**الخصائص** (المدخلات، السمات، $\mathbf x$) هي الخواص القابلة للقياس التي يستخدمها النموذج للتنبؤ — مثل مساحة المنزل وعدد غرفه وعمره.

أما **التصنيف** (الهدف، المُخرج، $y$) فهو الإجابة التي نريد التنبؤ بها — مثل السعر. في التعلّم الموجَّه يملك كل مثال تدريب تصنيفًا معروفًا. وعندما يكون الهدف **عددًا** تكون المهمة **انحدارًا**، وعندما يكون **فئة** تكون المهمة **تصنيفًا**.

اختيار الخصائص الجيدة وبناؤها (**هندسة الخصائص**) غالبًا أكبر رافعة للأداء. واحذر الخصائص التي لن تكون متاحة وقت التنبؤ — فهذا **تسرب للبيانات**.`,
    ],
    keyPoints: [['Features x → model → prediction ŷ, compared with label y.', 'الخصائص x ← النموذج ← التنبؤ ŷ، ويُقارن بالتصنيف y.'], ['Numeric label → regression; categorical label → classification.', 'هدف عددي ← انحدار؛ هدف فئوي ← تصنيف.']],
    demo: 'features-labels',
    quiz: [
      q(['Predicting whether a tumour is benign or malignant is…', 'التنبؤ بما إذا كان الورم حميدًا أم خبيثًا هو…'], [['Classification', 'تصنيف'], ['Regression', 'انحدار'], ['Clustering', 'تجميع'], ['Dimensionality reduction', 'تقليل أبعاد']], 0, ['The label is a category.', 'الهدف فئة.']),
      q(['In a dataset predicting exam scores from study hours, “study hours” is…', 'في بيانات تتنبأ بدرجات الامتحان من ساعات المذاكرة، تُعد «ساعات المذاكرة»…'], [['A feature', 'خاصية'], ['The label', 'التصنيف'], ['A parameter', 'معاملًا'], ['The loss', 'الخسارة']], 0, ['It is an input used to predict the score.', 'إنها مُدخل يُستخدم للتنبؤ بالدرجة.']),
    ],
    next: ['input-output'],
  },
  {
    id: 'input-output',
    title: ['Input and output variables', 'متغيرات الإدخال والإخراج'],
    summary: ['A model is a function from input variables to output variables; their types decide the task.', 'النموذج دالة من متغيرات الإدخال إلى متغيرات الإخراج؛ وأنواعها تحدد المهمة.'],
    level: 'beginner',
    body: [
      r`Mathematically, a supervised model is a function $f$ that maps an **input vector** $\mathbf x = (x_1,\dots,x_d)$ to an **output** $\hat y = f(\mathbf x)$.

Variables have **types**:
- **Numerical** – continuous (temperature 23.4) or discrete (number of rooms 3).
- **Categorical** – nominal, no order (colour: red/blue) or ordinal, with order (size: S/M/L).
- **Text, images, audio** – unstructured inputs that must be converted to numbers (encoding, embeddings, pixels).

Most algorithms need numeric inputs, so categorical variables are **encoded** (e.g. one-hot). The type of the **output** decides the task: number → regression, category → classification, several outputs → multi-output learning.`,
      r`رياضيًا، النموذج الموجَّه دالة $f$ تحوّل **متجه المدخلات** $\mathbf x = (x_1,\dots,x_d)$ إلى **مُخرج** $\hat y = f(\mathbf x)$.

للمتغيرات **أنواع**:
- **عددية** – مستمرة (حرارة 23.4) أو متقطعة (عدد الغرف 3).
- **فئوية** – اسمية بلا ترتيب (اللون: أحمر/أزرق) أو ترتيبية لها ترتيب (المقاس: صغير/وسط/كبير).
- **نصوص وصور وصوت** – مدخلات غير منظّمة يجب تحويلها إلى أرقام (ترميز، تضمينات، بكسلات).

تحتاج معظم الخوارزميات مدخلات عددية، لذا **تُرمَّز** المتغيرات الفئوية (مثل الترميز الأحادي one-hot). ونوع **المُخرج** يحدد المهمة: عدد ← انحدار، فئة ← تصنيف، عدة مخرجات ← تعلّم متعدد المخرجات.`,
    ],
    keyPoints: [['ŷ = f(x).', 'ŷ = f(x).'], ['Numerical vs categorical variables; encode categories.', 'متغيرات عددية مقابل فئوية؛ ورمّز الفئات.']],
    demo: 'features-labels',
    next: ['train-val-test'],
  },
  {
    id: 'train-val-test',
    title: ['Training, validation and testing', 'التدريب والتحقق والاختبار'],
    summary: ['Split data so you can tune on one part and honestly measure on another.', 'قسّم البيانات لتضبط على جزء وتقيس بأمانة على جزء آخر.'],
    level: 'beginner',
    body: [
      r`If you grade a student using the exact questions they practised, you measure memory, not understanding. The same is true for models. So we split the data:

- **Training set** – used to fit the model's parameters.
- **Validation set** – used to compare models and tune hyperparameters (e.g. tree depth, K in KNN).
- **Test set** – kept aside and used **once** at the end to estimate performance on unseen data.

Typical splits are 70/15/15 or 80/10/10. Shuffle before splitting (unless the data is a time series), keep class proportions similar (**stratification**), and never let test data influence any training decision.`,
      r`إذا قيّمت طالبًا بالأسئلة نفسها التي تدرّب عليها فأنت تقيس الحفظ لا الفهم. والأمر نفسه ينطبق على النماذج. لذلك نقسّم البيانات:

- **بيانات التدريب** – تُستخدم لملاءمة معاملات النموذج.
- **بيانات التحقق** – تُستخدم لمقارنة النماذج وضبط المعاملات الفائقة (مثل عمق الشجرة أو K في KNN).
- **بيانات الاختبار** – تُحجز جانبًا وتُستخدم **مرة واحدة** في النهاية لتقدير الأداء على بيانات غير مرئية.

التقسيمات الشائعة 70/15/15 أو 80/10/10. اخلط البيانات قبل التقسيم (ما لم تكن سلسلة زمنية)، وحافظ على نسب الفئات متشابهة (**التقسيم الطبقي**)، ولا تدع بيانات الاختبار تؤثر أبدًا في أي قرار تدريب.`,
    ],
    keyPoints: [['Train to fit, validate to tune, test once to report.', 'درّب للملاءمة، وتحقق للضبط، واختبر مرة واحدة لإعلان النتيجة.'], ['Never tune on the test set.', 'لا تضبط أبدًا على بيانات الاختبار.']],
    demo: 'split',
    quiz: [
      q(['Which set should be used to choose the depth of a decision tree?', 'أي مجموعة يجب استخدامها لاختيار عمق شجرة القرار؟'], [['Validation set', 'بيانات التحقق'], ['Test set', 'بيانات الاختبار'], ['Training set only', 'بيانات التدريب فقط'], ['Any of them', 'أي منها']], 0, ['Tuning on the test set would make its score optimistic.', 'الضبط على بيانات الاختبار يجعل نتيجتها متفائلة أكثر من اللازم.']),
    ],
    next: ['training-inference', 'generalization'],
  },
  {
    id: 'training-inference',
    title: ['Model training and inference', 'تدريب النموذج والاستدلال'],
    summary: ['Training learns the parameters (slow, once); inference uses them to predict (fast, many times).', 'التدريب يتعلّم المعاملات (بطيء ومرة واحدة)؛ والاستدلال يستخدمها للتنبؤ (سريع ومرات كثيرة).'],
    level: 'beginner',
    body: [
      r`ML systems have two phases:

**Training** – the algorithm sees labelled data and adjusts its parameters to reduce the loss. It can take seconds or weeks, and is done once (or periodically).

**Inference** (prediction) – the trained model receives new inputs and produces outputs using the frozen parameters. It must be fast and reliable because it happens every time a user needs a prediction.

Some algorithms do most work at training time (linear models, trees); others, like **KNN**, do almost nothing at training time and all the work at inference time.`,
      r`لأنظمة تعلّم الآلة مرحلتان:

**التدريب** – ترى الخوارزمية بيانات مصنّفة وتضبط معاملاتها لخفض الخسارة. قد يستغرق ثوانيَ أو أسابيع، ويُجرى مرة واحدة (أو دوريًا).

**الاستدلال** (التنبؤ) – يتلقى النموذج المدرَّب مدخلات جديدة وينتج مخرجات باستخدام المعاملات المثبّتة. ويجب أن يكون سريعًا وموثوقًا لأنه يحدث كلما احتاج المستخدم تنبؤًا.

بعض الخوارزميات تؤدي معظم العمل وقت التدريب (النماذج الخطية، الأشجار)، وأخرى مثل **KNN** لا تفعل شيئًا تقريبًا وقت التدريب وتؤدي كل العمل وقت الاستدلال.`,
    ],
    keyPoints: [['Training: learn parameters from data.', 'التدريب: تعلّم المعاملات من البيانات.'], ['Inference: apply fixed parameters to new inputs.', 'الاستدلال: تطبيق معاملات ثابتة على مدخلات جديدة.']],
    demo: 'train-infer',
    next: ['generalization'],
  },
  {
    id: 'generalization',
    title: ['Generalization', 'التعميم'],
    summary: ['The real goal: perform well on new data, not just the data you trained on.', 'الهدف الحقيقي: أداء جيد على بيانات جديدة لا على بيانات التدريب فقط.'],
    level: 'intermediate',
    body: [
      r`A model **generalizes** when it performs well on data it has never seen. Two failure modes:

- **Underfitting** – the model is too simple to capture the pattern (high error on training *and* test data).
- **Overfitting** – the model is so flexible that it memorises noise (low training error, high test error).

The gap between training and test performance is the **generalization gap**. We control it with model complexity, more data, regularization and validation. Drag the degree slider below: a degree-1 polynomial underfits, degree 3–4 fits well, and degree 12 chases every noisy point.`,
      r`**يعمّم** النموذج عندما يؤدي جيدًا على بيانات لم يرها قط. وهناك نمطا فشل:

- **نقص الملاءمة** – النموذج أبسط من أن يلتقط النمط (خطأ مرتفع على بيانات التدريب *و*الاختبار).
- **فرط الملاءمة** – النموذج مرن لدرجة أنه يحفظ الضوضاء (خطأ تدريب منخفض وخطأ اختبار مرتفع).

الفجوة بين أداء التدريب والاختبار هي **فجوة التعميم**، ونتحكم فيها بتعقيد النموذج، وزيادة البيانات، والتنظيم، والتحقق. اسحب منزلق الدرجة أدناه: كثير الحدود من الدرجة 1 يعاني نقص الملاءمة، والدرجة 3–4 تلائم جيدًا، والدرجة 12 تطارد كل نقطة مشوّشة.`,
    ],
    keyPoints: [['Underfitting: too simple. Overfitting: memorises noise.', 'نقص الملاءمة: بساطة زائدة. فرط الملاءمة: حفظ الضوضاء.'], ['Judge models on unseen data.', 'احكم على النماذج ببيانات غير مرئية.']],
    demo: 'generalization',
    quiz: [
      q(['Training error 1%, test error 30%. This is…', 'خطأ التدريب 1% وخطأ الاختبار 30%. هذا…'], [['Overfitting', 'فرط ملاءمة'], ['Underfitting', 'نقص ملاءمة'], ['Good generalization', 'تعميم جيد'], ['Data leakage for sure', 'تسرب بيانات بالتأكيد']], 0, ['A large train/test gap is the signature of overfitting.', 'الفجوة الكبيرة بين التدريب والاختبار علامة فرط الملاءمة.']),
    ],
    next: ['lifecycle'],
  },
  {
    id: 'lifecycle',
    title: ['The Machine Learning lifecycle', 'دورة حياة تعلّم الآلة'],
    summary: ['From defining the problem to monitoring a deployed model — and back again.', 'من تحديد المشكلة إلى مراقبة النموذج المنشور — ثم العودة من جديد.'],
    level: 'intermediate',
    body: [
      r`Real ML projects are iterative cycles, not one-off training runs:

1. **Define the problem** and success metric (with stakeholders).
2. **Collect data** and check its quality, consent and representativeness.
3. **Prepare data** – clean, encode, scale, split.
4. **Train models**, starting with simple baselines.
5. **Evaluate** on validation data; tune; finally test once.
6. **Deploy** – integrate the model into a product.
7. **Monitor** – data and user behaviour change over time (**drift**); retrain when performance degrades.

Most of the time is usually spent on data, not on algorithms.`,
      r`مشاريع تعلّم الآلة الحقيقية دورات تكرارية لا عمليات تدريب لمرة واحدة:

1. **حدّد المشكلة** ومقياس النجاح (مع أصحاب المصلحة).
2. **اجمع البيانات** وتحقق من جودتها والموافقة على استخدامها ومدى تمثيلها.
3. **جهّز البيانات** – نظّف ورمّز وحجّم وقسّم.
4. **درّب النماذج** بدءًا بنماذج مرجعية بسيطة.
5. **قيّم** على بيانات التحقق، واضبط، ثم اختبر مرة واحدة أخيرًا.
6. **انشر** – ادمج النموذج في منتج.
7. **راقب** – البيانات وسلوك المستخدمين يتغيران مع الزمن (**الانجراف**)؛ وأعد التدريب عند تراجع الأداء.

معظم الوقت يُصرف عادةً على البيانات لا على الخوارزميات.`,
    ],
    keyPoints: [['ML is an iterative loop.', 'تعلّم الآلة حلقة تكرارية.'], ['Monitoring after deployment is part of the job.', 'المراقبة بعد النشر جزء من العمل.']],
    demo: 'lifecycle',
    next: ['paradigms-overview'],
  },
  {
    id: 'paradigms-overview',
    title: ['Major Machine Learning paradigms', 'الأنماط الرئيسية لتعلّم الآلة'],
    summary: ['Supervised, unsupervised, reinforcement — plus semi- and self-supervised learning.', 'الموجَّه وغير الموجَّه والمعزّز — إضافة إلى شبه الموجَّه والذاتي الإشراف.'],
    level: 'beginner',
    body: [
      r`ML problems are grouped by **what kind of feedback** the learner receives:

- **Supervised learning** – every example has the correct answer (label). Learn a mapping from inputs to labels. *Regression and classification.*
- **Unsupervised learning** – no labels. Discover structure: groups, low-dimensional representations, associations.
- **Reinforcement learning** – an agent acts in an environment and receives rewards. Learn a policy that maximises long-term reward.
- **Semi-supervised learning** – a few labelled examples plus many unlabelled ones.
- **Self-supervised learning** – create labels automatically from the data itself (e.g. predict a hidden word), then reuse what was learned.

Sort the examples below into the right paradigm to practise.`,
      r`تُصنَّف مسائل تعلّم الآلة حسب **نوع التغذية الراجعة** التي يتلقاها المتعلّم:

- **التعلّم الموجَّه** – لكل مثال إجابة صحيحة (تصنيف). تعلّم التحويل من المدخلات إلى التصنيفات. *الانحدار والتصنيف.*
- **التعلّم غير الموجَّه** – لا توجد تصنيفات. اكتشف البنية: المجموعات، والتمثيلات منخفضة الأبعاد، والارتباطات.
- **التعلّم المعزّز** – وكيل يتصرف في بيئة ويتلقى مكافآت. تعلّم سياسة تعظّم المكافأة على المدى البعيد.
- **التعلّم شبه الموجَّه** – أمثلة مصنّفة قليلة مع أمثلة كثيرة غير مصنّفة.
- **التعلّم الذاتي الإشراف** – إنشاء تصنيفات تلقائيًا من البيانات نفسها (مثل التنبؤ بكلمة مخفية)، ثم إعادة استخدام ما تُعلِّم.

صنّف الأمثلة أدناه في النمط الصحيح للتدرّب.`,
    ],
    keyPoints: [['The paradigm depends on the feedback available.', 'يعتمد النمط على التغذية الراجعة المتاحة.']],
    demo: 'paradigm-sorter',
    next: ['applications'],
  },
  {
    id: 'applications',
    title: ['Common real-world applications', 'تطبيقات شائعة في الواقع'],
    summary: ['Where ML is used today, and which kind of algorithm sits behind each use.', 'أين يُستخدم تعلّم الآلة اليوم، وأي نوع من الخوارزميات يقف وراء كل استخدام.'],
    level: 'beginner',
    body: [
      r`- **Healthcare** – detecting disease in medical images (classification), predicting hospital readmission risk (logistic regression, ensembles).
- **Finance** – fraud detection (classification, anomaly detection), credit scoring (interpretable models such as trees).
- **Retail** – recommendations, customer segmentation (clustering), demand forecasting (regression).
- **Language** – translation, speech recognition, chat assistants (deep learning).
- **Transport** – route optimisation, driver-assistance perception.
- **Science** – protein structure prediction, climate modelling, particle physics.
- **Robotics and games** – control policies (reinforcement learning).

In every case the system is only as good as its data, its evaluation, and the care taken in deploying it.`,
      r`- **الرعاية الصحية** – كشف الأمراض في الصور الطبية (تصنيف)، والتنبؤ بخطر إعادة الدخول إلى المستشفى (انحدار لوجستي، مجموعات نماذج).
- **المالية** – كشف الاحتيال (تصنيف، كشف شذوذ)، والتصنيف الائتماني (نماذج قابلة للتفسير مثل الأشجار).
- **التجزئة** – التوصيات، وتقسيم العملاء (تجميع)، وتوقع الطلب (انحدار).
- **اللغة** – الترجمة، والتعرّف على الكلام، والمساعدات الحوارية (تعلّم عميق).
- **النقل** – تحسين المسارات، وإدراك أنظمة مساعدة السائق.
- **العلوم** – التنبؤ ببنية البروتينات، ونمذجة المناخ، وفيزياء الجسيمات.
- **الروبوتات والألعاب** – سياسات التحكم (تعلّم معزّز).

وفي كل حالة لا يكون النظام أفضل من بياناته وتقييمه والعناية المبذولة في نشره.`,
    ],
    keyPoints: [['Most applications combine several techniques.', 'معظم التطبيقات تجمع عدة تقنيات.']],
    next: ['limitations'],
  },
  {
    id: 'limitations',
    title: ['Limitations of Machine Learning', 'قيود تعلّم الآلة'],
    summary: ['ML finds correlations in data; it can fail silently when the world differs from the data.', 'يجد تعلّم الآلة ارتباطات في البيانات، وقد يفشل بصمت عندما يختلف العالم عن البيانات.'],
    level: 'intermediate',
    body: [
      r`- **Data dependence** – a model cannot know what is not in its data. Biased or small datasets produce biased or unreliable models.
- **Correlation ≠ causation** – ML learns associations. A feature can predict an outcome without causing it.
- **Distribution shift** – when new data differs from training data (new users, new sensors, a pandemic), performance can drop sharply and silently.
- **Interpretability** – complex models are hard to explain, which matters in high-stakes decisions.
- **Uncertainty** – models often give confident answers even when they should not.
- **Adversarial and edge cases** – small, deliberate changes to an input can flip a prediction.

Good practice is to know these limits and design checks around them.`,
      r`- **الاعتماد على البيانات** – لا يستطيع النموذج معرفة ما ليس في بياناته. والبيانات المنحازة أو الصغيرة تنتج نماذج منحازة أو غير موثوقة.
- **الارتباط ≠ السببية** – يتعلّم تعلّم الآلة الارتباطات. قد تتنبأ خاصية بنتيجة دون أن تسببها.
- **تحوّل التوزيع** – عندما تختلف البيانات الجديدة عن بيانات التدريب (مستخدمون جدد، مستشعرات جديدة، جائحة) قد ينخفض الأداء بحدة وبصمت.
- **قابلية التفسير** – يصعب شرح النماذج المعقدة، وهذا مهم في القرارات عالية الخطورة.
- **عدم اليقين** – كثيرًا ما تعطي النماذج إجابات واثقة حتى حين لا ينبغي لها ذلك.
- **الحالات العدائية والحدّية** – تغييرات صغيرة متعمدة في المُدخل قد تقلب التنبؤ.

الممارسة الجيدة هي معرفة هذه الحدود وتصميم فحوصات حولها.`,
    ],
    keyPoints: [['Models inherit the limits of their data.', 'ترث النماذج حدود بياناتها.'], ['Monitor for distribution shift.', 'راقب تحوّل التوزيع.']],
    next: ['responsible-ml'],
  },
  {
    id: 'responsible-ml',
    title: ['Responsible Machine Learning', 'تعلّم الآلة المسؤول'],
    summary: ['Fairness, privacy, transparency and accountability are part of building ML systems.', 'العدالة والخصوصية والشفافية والمساءلة جزء من بناء أنظمة تعلّم الآلة.'],
    level: 'intermediate',
    body: [
      r`ML systems affect people, so responsibility is part of the engineering:

- **Fairness** – check performance separately for different groups; a high overall accuracy can hide poor results for a minority group.
- **Privacy** – collect only necessary data, protect it, respect consent and regulations.
- **Transparency** – document data sources, intended use and limitations (e.g. model cards, datasheets).
- **Human oversight** – keep humans in the loop for high-stakes decisions and provide ways to contest outcomes.
- **Safety and robustness** – test edge cases and monitor after deployment.
- **Environmental cost** – large models consume significant energy.

A useful habit: before training, ask *who could be harmed if this model is wrong, and how would we know?*`,
      r`تؤثر أنظمة تعلّم الآلة في الناس، لذا فالمسؤولية جزء من الهندسة:

- **العدالة** – افحص الأداء لكل فئة على حدة؛ فالدقة الإجمالية المرتفعة قد تخفي نتائج ضعيفة لفئة أقلية.
- **الخصوصية** – اجمع البيانات الضرورية فقط، واحمها، واحترم الموافقة والأنظمة.
- **الشفافية** – وثّق مصادر البيانات والاستخدام المقصود والقيود (مثل بطاقات النماذج وأوراق بيانات المجموعات).
- **الإشراف البشري** – أبقِ البشر في الحلقة للقرارات عالية الخطورة، ووفّر طرقًا للاعتراض على النتائج.
- **السلامة والمتانة** – اختبر الحالات الحدّية وراقب بعد النشر.
- **الكلفة البيئية** – تستهلك النماذج الكبيرة طاقة كبيرة.

عادة مفيدة: قبل التدريب اسأل *من قد يتضرر إذا أخطأ هذا النموذج، وكيف سنعرف؟*`,
    ],
    keyPoints: [['Evaluate per group, not just overall.', 'قيّم لكل فئة لا إجماليًا فقط.'], ['Document, monitor and keep humans in the loop.', 'وثّق وراقب وأبقِ البشر في الحلقة.']],
    quiz: [
      q(['A model has 95% overall accuracy but 60% for one demographic group. What should you do?', 'لنموذج دقة إجمالية 95% لكنها 60% لفئة سكانية واحدة. ماذا يجب أن تفعل؟'], [['Investigate and address the disparity before deployment', 'تحقق من التفاوت وعالجه قبل النشر'], ['Deploy: 95% is excellent', 'انشر: 95% ممتازة'], ['Remove that group from the test set', 'احذف تلك الفئة من بيانات الاختبار'], ['Report only overall accuracy', 'أعلن الدقة الإجمالية فقط']], 0, ['Aggregate metrics can hide harmful failures for specific groups.', 'المقاييس الإجمالية قد تخفي إخفاقات ضارة لفئات محددة.']),
    ],
  },
];

export const getFundamental = (id: string) => FUNDAMENTALS.find((m) => m.id === id);
