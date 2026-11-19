import type { Text } from '@/i18n/types';

export interface DemoScenario {
  id: string;
  labId: string;
  preset?: string;
  title: Text;
  goal: Text;
  steps: Text[];
  talkingPoints: Text[];
}

export const DEMOS: DemoScenario[] = [
  {
    id: 'linreg-learn',
    labId: 'linear-regression',
    preset: 'learn',
    title: ['Watching Linear Regression learn', 'مشاهدة الانحدار الخطي وهو يتعلّم'],
    goal: ['Show gradient descent moving the line and rolling down the loss surface.', 'إظهار الانحدار التدرّجي وهو يحرّك الخط وينزل على سطح الخسارة.'],
    steps: [['Press Play (or Space). Point at the loss curve dropping.', 'اضغط تشغيل (أو مسافة). أشر إلى منحنى الخسارة وهو ينخفض.'], ['Turn on “closed-form solution”: the lines meet.', 'فعّل «الحل المغلق»: يلتقي الخطان.'], ['Reset, raise α to 0.05 and press Play: divergence.', 'أعد الضبط وارفع α إلى 0.05 واضغط تشغيل: تباعد.']],
    talkingPoints: [['Learning = adjusting w and b to reduce the mean squared error.', 'التعلّم = ضبط w وb لخفض متوسط مربع الخطأ.'], ['The gradient tells us which way is downhill.', 'التدرّج يخبرنا أين يقع اتجاه النزول.'], ['The learning rate is a trade-off between speed and stability.', 'معدل التعلّم مقايضة بين السرعة والاستقرار.']],
  },
  {
    id: 'knn-k',
    labId: 'knn',
    preset: 'k1',
    title: ['Changing K in KNN', 'تغيير K في KNN'],
    goal: ['Show how the neighbourhood size changes the decision boundary.', 'إظهار كيف يغيّر حجم الجوار حد القرار.'],
    steps: [['Start with K = 1 — point out the jagged islands.', 'ابدأ بـK = 1 — أشر إلى الجزر المتعرّجة.'], ['Click to move the query point; read the distances.', 'انقر لتحريك نقطة الاستعلام واقرأ المسافات.'], ['Increase K to 15 — regions smooth out.', 'زِد K إلى 15 — تصبح المناطق أنعم.']],
    talkingPoints: [['KNN does no training — it compares distances at prediction time.', 'لا تتدرب KNN — بل تقارن المسافات وقت التنبؤ.'], ['Small K follows noise; large K over-smooths.', 'K الصغير يتبع الضوضاء، وK الكبير يبالغ في التنعيم.'], ['Feature scaling changes who your neighbours are.', 'تحجيم الخصائص يغيّر من هم جيرانك.']],
  },
  {
    id: 'tree-overfit',
    labId: 'decision-tree',
    preset: 'overfit',
    title: ['Overfitting in Decision Trees', 'فرط الملاءمة في أشجار القرار'],
    goal: ['Grow a tree level by level and watch test accuracy stop improving.', 'نمِّ شجرة مستوى بمستوى وراقب توقف تحسّن دقة الاختبار.'],
    steps: [['Press “Grow level by level”.', 'اضغط «نمِّ الشجرة مستوى بمستوى».'], ['Compare train and test accuracy as depth increases.', 'قارن دقة التدريب والاختبار مع ازدياد العمق.'], ['Click a point and follow its path through the tree.', 'انقر نقطة وتتبّع مسارها عبر الشجرة.']],
    talkingPoints: [['Each split asks one yes/no question about one feature.', 'كل تقسيم يطرح سؤال نعم/لا واحدًا حول خاصية واحدة.'], ['Deep trees memorise noise: perfect on train, worse on test.', 'الأشجار العميقة تحفظ الضوضاء: مثالية في التدريب وأسوأ في الاختبار.']],
  },
  {
    id: 'tree-vs-forest',
    labId: 'random-forest',
    preset: 'compare',
    title: ['Decision Tree vs Random Forest', 'شجرة القرار مقابل الغابة العشوائية'],
    goal: ['Show how averaging many randomised trees smooths the boundary and generalizes better.', 'إظهار كيف يعطي متوسط أشجار عشوائية كثيرة حدًا أنعم وتعميمًا أفضل.'],
    steps: [['Compare the two maps side by side.', 'قارن الخريطتين جنبًا إلى جنب.'], ['Switch to “One tree” and browse a few trees.', 'انتقل إلى «شجرة واحدة» وتصفّح بعض الأشجار.'], ['Show the accuracy vs number of trees chart.', 'اعرض مخطط الدقة مقابل عدد الأشجار.']],
    talkingPoints: [['Bootstrap samples + random features = different trees.', 'عينات bootstrap + خصائص عشوائية = أشجار مختلفة.'], ['Averaging reduces variance.', 'أخذ المتوسط يقلل التباين.'], ['Change the seed: on a single small split the tree can win — the forest wins on average.', 'غيّر البذرة: في تقسيم صغير واحد قد تفوز الشجرة — لكن الغابة تفوز في المتوسط.']],
  },
  {
    id: 'svm-margin',
    labId: 'svm',
    title: ['Changing SVM margins', 'تغيير هوامش SVM'],
    goal: ['Show the maximum-margin boundary and how C trades margin width for errors.', 'إظهار حد الهامش الأقصى وكيف يقايض C بين عرض الهامش والأخطاء.'],
    steps: [['Drag a point that is not a support vector — nothing changes.', 'اسحب نقطة ليست متجه دعم — لا يتغير شيء.'], ['Drag a support vector — the boundary moves.', 'اسحب متجه دعم — يتحرك الحد.'], ['Load “Overlapping” and sweep C.', 'حمّل «متداخلة» وغيّر C.'], ['Load “Circles”, switch to RBF.', 'حمّل «دوائر» وانتقل إلى RBF.']],
    talkingPoints: [['Only support vectors define the boundary.', 'متجهات الدعم وحدها تحدد الحد.'], ['C controls the soft margin; γ controls RBF flexibility.', 'يتحكم C في الهامش المرن، ويتحكم γ في مرونة RBF.']],
  },
  {
    id: 'kmeans-move',
    labId: 'k-means',
    title: ['K-Means centroid movement', 'حركة مراكز K-Means'],
    goal: ['Alternate assignment and update steps until convergence.', 'التناوب بين خطوتي التعيين والتحديث حتى التقارب.'],
    steps: [['Press Half-step repeatedly; narrate each phase.', 'اضغط «نصف خطوة» مرارًا واشرح كل مرحلة.'], ['Watch inertia fall.', 'راقب انخفاض القصور الذاتي.'], ['Reset with a bad initialisation or wrong K.', 'أعد الضبط بتهيئة سيئة أو K خاطئ.']],
    talkingPoints: [['Assign to nearest centroid, move centroid to the mean.', 'عيّن لأقرب مركز، وانقل المركز إلى المتوسط.'], ['Converges, but only to a local optimum.', 'يتقارب، لكن إلى حل أمثل محلي فقط.']],
  },
  {
    id: 'pca-project',
    labId: 'pca',
    title: ['Demonstrating PCA projections', 'عرض إسقاطات PCA'],
    goal: ['Show that PC1 is the direction of maximum variance and what is lost by projecting.', 'إظهار أن PC1 هو اتجاه أكبر تباين وما يُفقد عند الإسقاط.'],
    steps: [['Rotate the manual axis; read its variance.', 'دوّر المحور اليدوي واقرأ تباينه.'], ['Snap to PC1 — maximum variance.', 'طابِق PC1 — أكبر تباين.'], ['Show reconstruction lines and the explained-variance bars.', 'اعرض خطوط إعادة البناء وأعمدة التباين المفسَّر.']],
    talkingPoints: [['PCs are eigenvectors of the covariance matrix.', 'المكونات الرئيسية متجهات ذاتية لمصفوفة التغاير.'], ['Dropped components = information lost.', 'المكونات المحذوفة = معلومات مفقودة.']],
  },
  {
    id: 'dendrogram',
    labId: 'hierarchical',
    title: ['Building a Hierarchical Clustering dendrogram', 'بناء مخطط شجري للتجميع الهرمي'],
    goal: ['Merge clusters step by step while the dendrogram grows.', 'دمج العناقيد خطوة بخطوة بينما ينمو المخطط الشجري.'],
    steps: [['Press Merge a few times, then Play.', 'اضغط «ادمج» عدة مرات ثم تشغيل.'], ['Drag the cut line to choose the number of clusters.', 'اسحب خط القطع لاختيار عدد العناقيد.'], ['Compare the four linkage strategies.', 'قارن معايير الربط الأربعة.']],
    talkingPoints: [['Bottom-up: always merge the two closest clusters.', 'تصاعدي: ادمج دائمًا أقرب عنقودين.'], ['Big vertical gaps suggest natural clusters.', 'الفجوات الرأسية الكبيرة تشير إلى عناقيد طبيعية.']],
  },
  {
    id: 'qlearning-train',
    labId: 'q-learning',
    title: ['Training a Q-Learning agent', 'تدريب وكيل تعلّم Q'],
    goal: ['Show rewards propagating backwards and the policy emerging.', 'إظهار انتشار المكافآت إلى الخلف وظهور السياسة.'],
    steps: [['Watch a few moves of the untrained agent.', 'شاهد بضع حركات للوكيل غير المدرَّب.'], ['Click “+50 episodes” and show the arrows and greedy path.', 'انقر «+50 حلقة» واعرض الأسهم والمسار الجشع.'], ['Show the return curve rising.', 'اعرض منحنى العائد وهو يرتفع.']],
    talkingPoints: [['Q(s,a) estimates long-term reward of an action.', 'Q(s,a) تقدّر المكافأة طويلة المدى لإجراء ما.'], ['The Bellman update uses the best next value.', 'تحديث بيلمان يستخدم أفضل قيمة تالية.'], ['ε controls exploration.', 'تتحكم ε في الاستكشاف.']],
  },
  {
    id: 'explore-exploit',
    labId: 'bandit',
    preset: 'hidden',
    title: ['Comparing exploration vs exploitation', 'مقارنة الاستكشاف مقابل الاستغلال'],
    goal: ['Show why both pure greed and pure randomness lose.', 'إظهار لماذا يخسر الجشع الخالص والعشوائية الخالصة معًا.'],
    steps: [['Set ε = 0 and Play — it may lock onto a mediocre arm.', 'اجعل ε = 0 واضغط تشغيل — قد يتمسك بذراع متوسطة.'], ['Reveal the true means.', 'اكشف المتوسطات الحقيقية.'], ['Run the ε comparison.', 'شغّل مقارنة قيم ε.']],
    talkingPoints: [['Exploration buys information; exploitation uses it.', 'الاستكشاف يشتري المعلومات، والاستغلال يستخدمها.'], ['A little exploration usually wins in the long run.', 'القليل من الاستكشاف يفوز عادةً على المدى البعيد.']],
  },
];
