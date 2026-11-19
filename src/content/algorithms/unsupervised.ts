import type { AlgorithmContent } from '../types';

const r = String.raw;

export const kMeans: AlgorithmContent = {
  id: 'k-means',
  name: ['K-Means Clustering', 'التجميع بخوارزمية K-Means'],
  short: ['Splits data into K groups by alternating between assigning points to the nearest centroid and moving centroids to the mean.', 'يقسم البيانات إلى K مجموعة بالتناوب بين تعيين النقاط لأقرب مركز ونقل المراكز إلى المتوسط.'],
  paradigm: 'unsupervised',
  categories: ['clustering'],
  difficulty: 'beginner',
  labId: 'k-means',
  objectives: [
    ['Execute the assignment and update steps by hand.', 'تنفيذ خطوتي التعيين والتحديث يدويًا.'],
    ['Explain why K-Means always converges, and why only to a local optimum.', 'شرح لماذا تتقارب K-Means دائمًا، ولماذا إلى حل أمثل محلي فقط.'],
    ['Choose K with the elbow method and recognise when K-Means fails.', 'اختيار K بطريقة المرفق والتعرّف على حالات فشل K-Means.'],
  ],
  intuition: [
    r`You have unlabelled points and want to discover groups. K-Means places $K$ "centres" (**centroids**) and repeats two simple moves:

1. **Assignment** – every point joins the team of its nearest centroid.
2. **Update** – every centroid walks to the average position of its team.

Each move can only reduce the total squared distance between points and their centroids (the **inertia**), so the process settles down — it **converges**. Different starting positions, however, may settle into different answers.`,
    r`لديك نقاط غير مصنّفة وتريد اكتشاف المجموعات. تضع K-Means عددًا $K$ من «المراكز» ثم تكرر حركتين بسيطتين:

1. **التعيين** – تنضم كل نقطة إلى فريق أقرب مركز إليها.
2. **التحديث** – ينتقل كل مركز إلى متوسط مواقع فريقه.

كل حركة لا يمكنها إلا أن تخفض مجموع مربعات المسافات بين النقاط ومراكزها (**القصور الذاتي**)، لذلك تستقر العملية — أي **تتقارب**. لكن المواقع الابتدائية المختلفة قد تستقر عند إجابات مختلفة.`,
  ],
  useCases: [
    ['Customer segmentation.', 'تقسيم العملاء إلى شرائح.'],
    ['Colour quantisation and image compression.', 'تكميم الألوان وضغط الصور.'],
    ['Grouping documents or sensor readings.', 'تجميع المستندات أو قراءات المستشعرات.'],
  ],
  steps: [
    ['Choose K and initialise K centroids (random points or k-means++).', 'اختر K وهيّئ K مركزًا (نقاط عشوائية أو k-means++).'],
    ['Assignment: label each point with its nearest centroid.', 'التعيين: صنّف كل نقطة بأقرب مركز لها.'],
    ['Update: move each centroid to the mean of its points.', 'التحديث: انقل كل مركز إلى متوسط نقاطه.'],
    ['Repeat until assignments stop changing.', 'كرّر حتى تتوقف التعيينات عن التغير.'],
  ],
  math: [
    r`K-Means minimises the within-cluster sum of squares (inertia):

$$J = \sum_{i=1}^{n} \lVert \mathbf x_i - \boldsymbol\mu_{c(i)} \rVert^2$$

Assignment: $c(i) = \arg\min_k \lVert\mathbf x_i - \boldsymbol\mu_k\rVert^2$ (minimises $J$ over labels). Update: $\boldsymbol\mu_k = \frac{1}{|C_k|}\sum_{i\in C_k}\mathbf x_i$ (the mean minimises squared distance). Since neither step increases $J$ and there are finitely many assignments, the algorithm terminates.

**k-means++** picks each new initial centroid with probability proportional to $D(\mathbf x)^2$, the squared distance to the nearest centroid already chosen.`,
    r`تقلل K-Means مجموع المربعات داخل العناقيد (القصور الذاتي):

$$J = \sum_{i=1}^{n} \lVert \mathbf x_i - \boldsymbol\mu_{c(i)} \rVert^2$$

التعيين: $c(i) = \arg\min_k \lVert\mathbf x_i - \boldsymbol\mu_k\rVert^2$ (يقلل $J$ بالنسبة للتصنيفات). التحديث: $\boldsymbol\mu_k = \frac{1}{|C_k|}\sum_{i\in C_k}\mathbf x_i$ (المتوسط يقلل مربع المسافة). ولأن أيًّا من الخطوتين لا يزيد $J$ وعدد التعيينات محدود، فإن الخوارزمية تنتهي.

تختار **k-means++** كل مركز ابتدائي جديد باحتمال يتناسب مع $D(\mathbf x)^2$، أي مربع المسافة إلى أقرب مركز تم اختياره.`,
  ],
  labGuide: [
    { param: ['K', 'K'], effect: ['Number of clusters to find.', 'عدد العناقيد المطلوب إيجادها.'] },
    { param: ['Initialization', 'التهيئة'], effect: ['Random, k-means++, or click to place centroids yourself.', 'عشوائية، أو k-means++، أو بالنقر لوضع المراكز بنفسك.'] },
    { param: ['Half-step', 'نصف خطوة'], effect: ['Runs exactly one assignment or one update step.', 'ينفذ خطوة تعيين واحدة أو خطوة تحديث واحدة بالضبط.'] },
  ],
  experiments: [
    ['Use "Click" initialisation and put all centroids in one corner.', 'استخدم التهيئة «بالنقر» وضع كل المراكز في زاوية واحدة.'],
    ['Try K = 2 and K = 6 on "Three blobs" and read the elbow chart.', 'جرّب K = 2 وK = 6 على «ثلاث كتل» واقرأ مخطط المرفق.'],
    ['Run on "Rings": K-Means cannot follow ring shapes.', 'شغّلها على «حلقات»: لا تستطيع K-Means تتبع الأشكال الحلقية.'],
  ],
  evaluation: [
    r`Without labels there is no accuracy. Use **inertia** (lower is tighter, but always falls as $K$ grows), the **elbow** of the inertia-vs-$K$ curve, or the **silhouette score**, which compares each point's distance to its own cluster with the nearest other cluster.`,
    r`لا توجد دقة في غياب التصنيفات. استخدم **القصور الذاتي** (الأقل يعني عناقيد أكثر تماسكًا، لكنه ينخفض دائمًا مع زيادة $K$)، أو **مرفق** منحنى القصور الذاتي مقابل $K$، أو **درجة الصورة الظلية** التي تقارن مسافة كل نقطة إلى عنقودها بأقرب عنقود آخر.`,
  ],
  advantages: [
    ['Simple, fast and scales to large datasets.', 'بسيطة وسريعة وتتوسع إلى بيانات كبيرة.'],
    ['Easy to understand and visualise.', 'سهلة الفهم والتصور.'],
  ],
  limitations: [
    ['K must be chosen in advance.', 'يجب اختيار K مسبقًا.'],
    ['Assumes compact, roughly spherical clusters of similar size.', 'تفترض عناقيد مدمجة شبه كروية ومتقاربة الحجم.'],
    ['Sensitive to initialisation, outliers and feature scaling.', 'حساسة للتهيئة والقيم الشاذة وتحجيم الخصائص.'],
  ],
  mistakes: [
    ['Choosing K by the lowest inertia (it is always the largest K).', 'اختيار K بأقل قصور ذاتي (وهو دائمًا عند أكبر K).'],
    ['Running once instead of several restarts (n_init).', 'التشغيل مرة واحدة بدل عدة إعادات (n_init).'],
    ['Forgetting to scale features.', 'نسيان تحجيم الخصائص.'],
  ],
  python: `from sklearn.cluster import KMeans
from sklearn.datasets import make_blobs
from sklearn.metrics import silhouette_score

X, _ = make_blobs(n_samples=300, centers=3, random_state=4)
for k in range(1, 7):
    km = KMeans(n_clusters=k, init="k-means++", n_init=10, random_state=0).fit(X)
    sil = silhouette_score(X, km.labels_) if k > 1 else float("nan")
    print(k, round(km.inertia_, 1), round(sil, 3))`,
  pythonNote: ['The lab runs Lloyd’s algorithm one half-step at a time; scikit-learn runs the same iterations internally (n_init restarts, keeping the best inertia).', 'ينفذ المختبر خوارزمية لويد نصف خطوة في كل مرة؛ ويجري scikit-learn التكرارات نفسها داخليًا (مع n_init إعادات والاحتفاظ بأفضل قصور ذاتي).'],
  quiz: [
    {
      q: ['In the update step, each centroid moves to…', 'في خطوة التحديث، ينتقل كل مركز إلى…'],
      options: [['The farthest point', 'أبعد نقطة'], ['The mean of the points assigned to it', 'متوسط النقاط المعيّنة له'], ['A random point', 'نقطة عشوائية'], ['The origin', 'نقطة الأصل']],
      answer: 1,
      explain: ['The mean minimises the sum of squared distances to the cluster’s points.', 'المتوسط يقلل مجموع مربعات المسافات إلى نقاط العنقود.'],
    },
    {
      q: ['Why can two runs of K-Means give different results?', 'لماذا قد يعطي تشغيلان لـK-Means نتائج مختلفة؟'],
      options: [['The data changes', 'لأن البيانات تتغير'], ['Different initial centroids lead to different local minima', 'المراكز الابتدائية المختلفة تقود إلى قيم دنيا محلية مختلفة'], ['It uses labels', 'لأنها تستخدم التصنيفات'], ['It never converges', 'لأنها لا تتقارب أبدًا']],
      answer: 1,
      explain: ['The objective is non-convex; K-Means finds a local optimum near its start.', 'الدالة الهدف غير محدّبة؛ وتجد K-Means حلًا أمثل محليًا قرب نقطة بدايتها.'],
    },
    {
      q: ['As K increases, inertia…', 'مع زيادة K، القصور الذاتي…'],
      options: [['Never increases (for the best solution)', 'لا يزداد أبدًا (لأفضل حل)'], ['Always increases', 'يزداد دائمًا'], ['Stays constant', 'يبقى ثابتًا'], ['Becomes negative', 'يصبح سالبًا']],
      answer: 0,
      explain: ['More centroids can only bring points closer; with K = n inertia is 0.', 'المراكز الإضافية لا يمكنها إلا تقريب النقاط؛ ومع K = n يصبح القصور الذاتي 0.'],
    },
  ],
  related: ['hierarchical', 'gmm', 'dbscan'],
  references: [
    { title: 'scikit-learn — K-means', url: 'https://scikit-learn.org/stable/modules/clustering.html#k-means' },
    { title: 'Arthur & Vassilvitskii (2007), k-means++: The Advantages of Careful Seeding', url: 'https://dl.acm.org/doi/10.5555/1283383.1283494' },
  ],
  compare: {
    purpose: ['Partition unlabelled data into K compact groups', 'تقسيم البيانات غير المصنّفة إلى K مجموعة مدمجة'],
    data: ['Numeric, scaled features; large datasets OK', 'خصائص عددية بعد التحجيم؛ تناسب البيانات الكبيرة'],
    assumptions: ['Spherical clusters of similar size and density', 'عناقيد كروية متقاربة الحجم والكثافة'],
    hyperparams: 'n_clusters (K), init, n_init, max_iter',
  },
};

export const pca: AlgorithmContent = {
  id: 'pca',
  name: ['Principal Component Analysis (PCA)', 'تحليل المكونات الرئيسية (PCA)'],
  short: ['Rotates the data onto new axes ordered by how much variance they capture, so you can keep only the most informative ones.', 'يدوّر البيانات إلى محاور جديدة مرتّبة حسب مقدار التباين الذي تلتقطه، لتحتفظ بالأكثر إفادة منها فقط.'],
  paradigm: 'unsupervised',
  categories: ['dimensionality-reduction'],
  difficulty: 'intermediate',
  labId: 'pca',
  objectives: [
    ['Connect variance, covariance, eigenvectors and eigenvalues.', 'الربط بين التباين والتغاير والمتجهات والقيم الذاتية.'],
    ['Project data onto principal components and reconstruct it.', 'إسقاط البيانات على المكونات الرئيسية وإعادة بنائها.'],
    ['Read explained variance ratios to choose how many components to keep.', 'قراءة نسب التباين المفسَّر لاختيار عدد المكونات المحتفظ بها.'],
  ],
  intuition: [
    r`When two features are strongly correlated — say height and arm span — most points lie near a single diagonal line. Describing each point by its position **along that line** keeps almost all the information with one number instead of two.

PCA finds such lines automatically. The **first principal component (PC1)** is the direction in which the data spreads the most. PC2 is the direction of largest remaining spread that is **perpendicular** to PC1, and so on.

Keeping only the first $k$ components is **dimensionality reduction**. What you throw away is the variance along the dropped directions — the **information loss**.`,
    r`عندما تكون خاصيتان مترابطتين بقوة — مثل الطول وطول امتداد الذراعين — تقع معظم النقاط قرب خط قطري واحد. وصف كل نقطة بموقعها **على امتداد ذلك الخط** يحتفظ بمعظم المعلومات برقم واحد بدل رقمين.

يجد PCA هذه الخطوط تلقائيًا. **المكوّن الرئيسي الأول (PC1)** هو الاتجاه الذي تنتشر فيه البيانات أكثر ما يمكن. وPC2 هو اتجاه أكبر انتشار متبقٍّ **عمودي** على PC1، وهكذا.

الاحتفاظ بأول $k$ مكونات فقط هو **تقليل الأبعاد**. وما تتخلص منه هو التباين على امتداد الاتجاهات المحذوفة — أي **فقدان المعلومات**.`,
  ],
  useCases: [
    ['Visualising high-dimensional data in 2-D.', 'تصوّر البيانات عالية الأبعاد في بُعدين.'],
    ['Compressing features before training another model.', 'ضغط الخصائص قبل تدريب نموذج آخر.'],
    ['Noise reduction and finding dominant patterns (e.g. in genetics).', 'تقليل الضوضاء وإيجاد الأنماط المهيمنة (مثل علم الوراثة).'],
  ],
  steps: [
    ['Centre the data (subtract the mean); optionally standardise.', 'مركز البيانات (اطرح المتوسط)؛ ووحّدها قياسيًا اختياريًا.'],
    ['Compute the covariance matrix.', 'احسب مصفوفة التغاير.'],
    ['Find its eigenvectors (directions) and eigenvalues (variances).', 'جد متجهاتها الذاتية (الاتجاهات) وقيمها الذاتية (التباينات).'],
    ['Sort by eigenvalue and keep the top k eigenvectors.', 'رتّب حسب القيمة الذاتية واحتفظ بأعلى k متجهات ذاتية.'],
    ['Project the data onto them (and optionally map back to reconstruct).', 'أسقط البيانات عليها (وأعد البناء اختياريًا).'],
  ],
  math: [
    r`With centred data matrix $X$ ($n\times d$):

$$\Sigma = \frac{1}{n-1}X^\top X, \qquad \Sigma\,\mathbf v_k = \lambda_k\,\mathbf v_k, \quad \lambda_1\ge\lambda_2\ge\dots$$

The variance of the data projected on a unit vector $\mathbf u$ is $\mathbf u^\top\Sigma\mathbf u$, which is maximised by $\mathbf u = \mathbf v_1$, giving $\lambda_1$.

Scores and reconstruction with $V_k = [\mathbf v_1 \dots \mathbf v_k]$:

$$Z = XV_k, \qquad \hat X = ZV_k^\top + \bar{\mathbf x}, \qquad \text{explained ratio}_k = \frac{\lambda_k}{\sum_j\lambda_j}$$

The mean squared reconstruction error per point equals $\frac{n-1}{n}\sum_{j>k}\lambda_j$.`,
    r`مع مصفوفة البيانات المُمركزة $X$ ($n\times d$):

$$\Sigma = \frac{1}{n-1}X^\top X, \qquad \Sigma\,\mathbf v_k = \lambda_k\,\mathbf v_k, \quad \lambda_1\ge\lambda_2\ge\dots$$

تباين البيانات المُسقطة على متجه وحدة $\mathbf u$ يساوي $\mathbf u^\top\Sigma\mathbf u$، وتبلغ قيمته العظمى عند $\mathbf u = \mathbf v_1$ فتساوي $\lambda_1$.

الدرجات وإعادة البناء باستخدام $V_k = [\mathbf v_1 \dots \mathbf v_k]$:

$$Z = XV_k, \qquad \hat X = ZV_k^\top + \bar{\mathbf x}, \qquad \text{explained ratio}_k = \frac{\lambda_k}{\sum_j\lambda_j}$$

متوسط مربع خطأ إعادة البناء لكل نقطة يساوي $\frac{n-1}{n}\sum_{j>k}\lambda_j$.`,
  ],
  labGuide: [
    { param: ['Correlation ρ and spreads σ', 'معامل الارتباط ρ والانتشار σ'], effect: ['Shape the cloud of points; PCs follow automatically.', 'تشكّل سحابة النقاط؛ وتتبعها المكونات الرئيسية تلقائيًا.'] },
    { param: ['Manual axis angle', 'زاوية المحور اليدوي'], effect: ['A demonstration axis, clearly separate from the computed PCs; its variance is never above PC1’s.', 'محور للتوضيح منفصل بوضوح عن المكونات المحسوبة؛ وتباينه لا يتجاوز أبدًا تباين PC1.'] },
    { param: ['Components kept k', 'المكونات المحتفظ بها k'], effect: ['Controls reconstruction and information loss.', 'يتحكم في إعادة البناء وفقدان المعلومات.'] },
    { param: ['Standardize', 'التوحيد القياسي'], effect: ['PCA on the correlation matrix, so units no longer matter.', 'PCA على مصفوفة الارتباط فلا تعود الوحدات مؤثرة.'] },
  ],
  experiments: [
    ['Rotate the manual axis and watch its variance peak exactly at PC1.', 'دوّر المحور اليدوي وراقب بلوغ تباينه الذروة عند PC1 تمامًا.'],
    ['Set ρ = 0 with equal spreads: PC1 explains only ~50% — reduction loses half.', 'اجعل ρ = 0 مع انتشار متساوٍ: يفسّر PC1 نحو 50% فقط — والتقليل يفقد النصف.'],
    ['In 3-D, raise ρ(x₁,x₂) and ρ(x₁,x₃) and see two components capture nearly everything.', 'في الأبعاد الثلاثة ارفع ρ(x₁,x₂) وρ(x₁,x₃) وشاهد مكوّنين يلتقطان كل شيء تقريبًا.'],
  ],
  evaluation: [
    r`Use the **explained variance ratio** and its cumulative sum (e.g. keep enough components for 95%), the **reconstruction error**, or the downstream model's performance after reduction.`,
    r`استخدم **نسبة التباين المفسَّر** ومجموعها التراكمي (مثلًا احتفظ بمكونات كافية لـ95%)، أو **خطأ إعادة البناء**، أو أداء النموذج اللاحق بعد التقليل.`,
  ],
  advantages: [
    ['Fast, deterministic and mathematically clean.', 'سريع وحتمي ونظيف رياضيًا.'],
    ['Removes correlated redundancy and some noise.', 'يزيل التكرار المترابط وبعض الضوضاء.'],
    ['Components are orthogonal, uncorrelated features.', 'المكونات خصائص متعامدة وغير مترابطة.'],
  ],
  limitations: [
    ['Only captures linear structure.', 'يلتقط البنية الخطية فقط.'],
    ['Sensitive to feature scale and outliers.', 'حساس لمقياس الخصائص والقيم الشاذة.'],
    ['Components can be hard to interpret.', 'قد يصعب تفسير المكونات.'],
  ],
  mistakes: [
    ['Skipping standardisation when features have different units.', 'تجاوز التوحيد القياسي عندما تختلف وحدات الخصائص.'],
    ['Fitting PCA on all data before a train/test split (leakage).', 'ملاءمة PCA على كل البيانات قبل التقسيم إلى تدريب/اختبار (تسرب).'],
    ['Assuming high variance always means useful for prediction.', 'افتراض أن التباين العالي يعني دائمًا فائدة للتنبؤ.'],
  ],
  python: `import numpy as np
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler

rng = np.random.default_rng(3)
X = rng.multivariate_normal([0, 0, 0], [[4, 2.4, 0.6], [2.4, 2.25, 0.3], [0.6, 0.3, 0.36]], size=120)

Z = StandardScaler().fit_transform(X)     # optional standardisation
pca = PCA(n_components=2).fit(Z)
print("components:", pca.components_)
print("explained variance:", pca.explained_variance_)
print("ratio:", pca.explained_variance_ratio_, "cumulative:", pca.explained_variance_ratio_.cumsum())
X_back = pca.inverse_transform(pca.transform(Z))   # reconstruction`,
  pythonNote: ['The lab computes the covariance matrix (denominator n−1) and its eigendecomposition with the Jacobi method; scikit-learn uses an SVD of the centred data, which gives the same components up to sign.', 'يحسب المختبر مصفوفة التغاير (بالمقام n−1) وتحليلها الذاتي بطريقة جاكوبي؛ ويستخدم scikit-learn تحليل القيم المفردة للبيانات المُمركزة، فيعطي المكونات نفسها مع احتمال اختلاف الإشارة.'],
  quiz: [
    {
      q: ['PC1 is the direction that…', 'المكوّن PC1 هو الاتجاه الذي…'],
      options: [['Has the most variance', 'له أكبر تباين'], ['Has the least variance', 'له أقل تباين'], ['Is always the x-axis', 'هو محور x دائمًا'], ['Best separates classes', 'يفصل الفئات بأفضل شكل']],
      answer: 0,
      explain: ['PCA is unsupervised: it maximises variance, not class separation.', 'PCA غير موجَّه: يعظّم التباين لا الفصل بين الفئات.'],
    },
    {
      q: ['An eigenvalue in PCA equals…', 'القيمة الذاتية في PCA تساوي…'],
      options: [['The variance of the data along that component', 'تباين البيانات على امتداد ذلك المكوّن'], ['The number of points', 'عدد النقاط'], ['The mean of a feature', 'متوسط خاصية'], ['The correlation coefficient', 'معامل الارتباط']],
      answer: 0,
      explain: ['Σv = λv and vᵀΣv = λ for a unit eigenvector.', 'Σv = λv وvᵀΣv = λ لمتجه ذاتي وحدوي.'],
    },
    {
      q: ['Why standardise before PCA?', 'لماذا نوحّد البيانات قياسيًا قبل PCA؟'],
      options: [['To make it faster', 'لجعله أسرع'], ['So features with large units do not dominate the variance', 'لكي لا تهيمن الخصائص ذات الوحدات الكبيرة على التباين'], ['It is never needed', 'لا حاجة إليه أبدًا'], ['To add labels', 'لإضافة تصنيفات']],
      answer: 1,
      explain: ['Variance depends on units; standardising puts features on equal footing.', 'يعتمد التباين على الوحدات؛ والتوحيد القياسي يضع الخصائص على قدم المساواة.'],
    },
  ],
  related: ['tsne', 'umap', 'k-means'],
  references: [
    { title: 'scikit-learn — PCA', url: 'https://scikit-learn.org/stable/modules/decomposition.html#pca' },
    { title: 'Jolliffe & Cadima (2016), Principal component analysis: a review and recent developments', url: 'https://doi.org/10.1098/rsta.2015.0202' },
  ],
  compare: {
    purpose: ['Linear dimensionality reduction', 'تقليل أبعاد خطي'],
    data: ['Numeric features, ideally correlated; scaled', 'خصائص عددية مترابطة غالبًا؛ بعد التحجيم'],
    assumptions: ['Important structure lies along directions of high variance', 'البنية المهمة تقع على اتجاهات التباين العالي'],
    hyperparams: 'n_components, whiten, standardisation',
  },
};

export const hierarchical: AlgorithmContent = {
  id: 'hierarchical',
  name: ['Hierarchical Clustering', 'التجميع الهرمي'],
  short: ['Builds a tree of clusters by repeatedly merging the two closest clusters; cut the tree to choose the number of groups.', 'يبني شجرة عناقيد بدمج أقرب عنقودين مرارًا؛ ثم يُقطع المخطط لاختيار عدد المجموعات.'],
  paradigm: 'unsupervised',
  categories: ['clustering'],
  difficulty: 'intermediate',
  labId: 'hierarchical',
  objectives: [
    ['Run agglomerative clustering merge by merge.', 'تنفيذ التجميع التكتلي عملية دمج تلو الأخرى.'],
    ['Compare single, complete, average and Ward linkage.', 'المقارنة بين الربط الأحادي والكامل والمتوسط وWard.'],
    ['Read a dendrogram and choose a cut height.', 'قراءة المخطط الشجري واختيار ارتفاع القطع.'],
  ],
  intuition: [
    r`Start with every point as its own tiny cluster. Find the two clusters that are closest and **merge** them. Repeat until only one cluster remains.

The record of all merges forms a tree called a **dendrogram**. The height of each join is the distance at which those clusters merged. Drawing a horizontal **cut** across the dendrogram splits it into groups — you choose the number of clusters *after* seeing the structure.

"Closest" between two *groups* needs a rule — the **linkage**: nearest members (single), farthest members (complete), average of all pairs (average), or the smallest increase in within-cluster variance (Ward).`,
    r`ابدأ بجعل كل نقطة عنقودًا صغيرًا مستقلًا. جد أقرب عنقودين و**ادمجهما**. كرّر حتى يبقى عنقود واحد فقط.

يشكّل سجل جميع عمليات الدمج شجرة تسمى **المخطط الشجري (dendrogram)**. ارتفاع كل وصلة هو المسافة التي اندمج عندها العنقودان. ورسم **قطع** أفقي عبر المخطط يقسمه إلى مجموعات — فأنت تختار عدد العناقيد *بعد* رؤية البنية.

أما «الأقرب» بين *مجموعتين* فيحتاج قاعدة — هي **معيار الربط**: أقرب عضوين (أحادي)، أو أبعد عضوين (كامل)، أو متوسط كل الأزواج (متوسط)، أو أقل زيادة في التباين داخل العناقيد (Ward).`,
  ],
  useCases: [
    ['Biological taxonomies and gene-expression analysis.', 'التصنيفات الأحيائية وتحليل التعبير الجيني.'],
    ['Organising documents into topic hierarchies.', 'تنظيم المستندات في تسلسلات موضوعية.'],
    ['Exploring data when the number of clusters is unknown.', 'استكشاف البيانات عندما يكون عدد العناقيد مجهولًا.'],
  ],
  steps: [
    ['Compute all pairwise distances; each point is a cluster.', 'احسب كل المسافات الثنائية؛ وكل نقطة عنقود.'],
    ['Merge the two clusters with the smallest linkage distance.', 'ادمج العنقودين صاحبي أصغر مسافة ربط.'],
    ['Update distances from the new cluster to all others (Lance–Williams).', 'حدّث المسافات من العنقود الجديد إلى البقية (لانس–ويليامز).'],
    ['Repeat n − 1 times; record each merge height.', 'كرّر n − 1 مرة؛ وسجّل ارتفاع كل دمج.'],
    ['Cut the dendrogram at a height (or to K clusters).', 'اقطع المخطط عند ارتفاع (أو إلى K عنقودًا).'],
  ],
  math: [
    r`Linkage distances between clusters $A$ and $B$:

$$d_{\text{single}} = \min_{a,b}\lVert a-b\rVert, \quad d_{\text{complete}} = \max_{a,b}\lVert a-b\rVert, \quad d_{\text{average}} = \frac{1}{|A||B|}\sum_{a,b}\lVert a-b\rVert$$

Ward (SciPy convention) merges the pair with the smallest increase in total within-cluster sum of squares; its height is

$$d_{\text{Ward}}(A,B) = \sqrt{\frac{2|A||B|}{|A|+|B|}}\;\lVert\bar a-\bar b\rVert$$

After merging $i$ and $j$, distances to every other cluster $k$ are updated by the Lance–Williams recurrence, e.g. for average linkage $d(i\cup j,k) = \frac{|i|d(i,k) + |j|d(j,k)}{|i|+|j|}$.`,
    r`مسافات الربط بين العنقودين $A$ و$B$:

$$d_{\text{single}} = \min_{a,b}\lVert a-b\rVert, \quad d_{\text{complete}} = \max_{a,b}\lVert a-b\rVert, \quad d_{\text{average}} = \frac{1}{|A||B|}\sum_{a,b}\lVert a-b\rVert$$

يدمج Ward (باصطلاح SciPy) الزوج صاحب أقل زيادة في مجموع المربعات داخل العناقيد، وارتفاعه

$$d_{\text{Ward}}(A,B) = \sqrt{\frac{2|A||B|}{|A|+|B|}}\;\lVert\bar a-\bar b\rVert$$

بعد دمج $i$ و$j$ تُحدَّث المسافات إلى كل عنقود آخر $k$ بعلاقة لانس–ويليامز التكرارية، فمثلًا للربط المتوسط $d(i\cup j,k) = \frac{|i|d(i,k) + |j|d(j,k)}{|i|+|j|}$.`,
  ],
  labGuide: [
    { param: ['Linkage', 'معيار الربط'], effect: ['Changes which clusters count as “closest” — and therefore the whole tree.', 'يغيّر أي العناقيد تُعد «الأقرب» — وبالتالي الشجرة كلها.'] },
    { param: ['Merge / Play', 'ادمج / تشغيل'], effect: ['Performs the real merges in execution order.', 'ينفذ عمليات الدمج الحقيقية بترتيب التنفيذ.'] },
    { param: ['Cut line', 'خط القطع'], effect: ['Drag on the dendrogram to choose the number of clusters.', 'اسحبه على المخطط الشجري لاختيار عدد العناقيد.'] },
  ],
  experiments: [
    ['Step through all merges on "Three blobs" and notice the big final gaps.', 'نفّذ كل عمليات الدمج على «ثلاث كتل» ولاحظ الفجوات النهائية الكبيرة.'],
    ['Compare single vs Ward on "Elongated groups".', 'قارن الأحادي مع Ward على «مجموعات مستطيلة».'],
    ['Drag one point between two groups and watch single linkage chain them together.', 'اسحب نقطة بين مجموعتين وراقب الربط الأحادي يسلسلهما معًا.'],
  ],
  evaluation: [
    r`Look for large vertical gaps in the dendrogram, and use internal measures such as the **silhouette score** or the **cophenetic correlation** (how well dendrogram heights preserve original distances).`,
    r`ابحث عن الفجوات الرأسية الكبيرة في المخطط الشجري، واستخدم مقاييس داخلية مثل **درجة الصورة الظلية** أو **الارتباط الكوفينيتي** (مدى حفاظ ارتفاعات المخطط على المسافات الأصلية).`,
  ],
  advantages: [
    ['No need to fix K beforehand; the dendrogram shows structure at every scale.', 'لا حاجة لتحديد K مسبقًا؛ ويُظهر المخطط البنية على كل المستويات.'],
    ['Deterministic (no random initialisation).', 'حتمي (دون تهيئة عشوائية).'],
    ['Works with any distance measure.', 'يعمل مع أي مقياس مسافة.'],
  ],
  limitations: [
    ['O(n²) memory and up to O(n³) time — impractical for large n.', 'ذاكرة من رتبة O(n²) ووقت حتى O(n³) — غير عملي مع n كبير.'],
    ['Merges are greedy and never undone.', 'عمليات الدمج جشعة ولا يمكن التراجع عنها.'],
    ['Results depend strongly on the linkage choice.', 'النتائج تعتمد بشدة على اختيار معيار الربط.'],
  ],
  mistakes: [
    ['Using Ward linkage with non-Euclidean distances.', 'استخدام ربط Ward مع مسافات غير إقليدية.'],
    ['Ignoring the chaining effect of single linkage on noisy data.', 'تجاهل أثر التسلسل للربط الأحادي على البيانات المشوّشة.'],
  ],
  python: `from scipy.cluster.hierarchy import linkage, dendrogram, fcluster
from sklearn.datasets import make_blobs
import matplotlib.pyplot as plt

X, _ = make_blobs(n_samples=24, centers=3, random_state=6)
Z = linkage(X, method="average")          # 'single', 'complete', 'average', 'ward'
labels = fcluster(Z, t=3, criterion="maxclust")   # cut into 3 clusters
dendrogram(Z)
plt.show()

# scikit-learn equivalent
from sklearn.cluster import AgglomerativeClustering
print(AgglomerativeClustering(n_clusters=3, linkage="average").fit_predict(X))`,
  pythonNote: ['The lab’s merge sequence uses SciPy’s cluster numbering and the same Lance–Williams updates, so merge heights match scipy.cluster.hierarchy.linkage (unit tests check this on a known example).', 'يستخدم تسلسل الدمج في المختبر ترقيم العناقيد في SciPy وتحديثات لانس–ويليامز نفسها، لذا تطابق ارتفاعات الدمج scipy.cluster.hierarchy.linkage (وتتحقق اختبارات الوحدة من ذلك على مثال معروف).'],
  quiz: [
    {
      q: ['What does the height of a join in a dendrogram represent?', 'ماذا يمثل ارتفاع الوصلة في المخطط الشجري؟'],
      options: [['The number of points', 'عدد النقاط'], ['The linkage distance at which the clusters merged', 'مسافة الربط التي اندمج عندها العنقودان'], ['The time of the merge', 'وقت الدمج'], ['Cluster quality', 'جودة العنقود']],
      answer: 1,
      explain: ['Higher joins merge clusters that are further apart.', 'الوصلات الأعلى تدمج عناقيد أكثر تباعدًا.'],
    },
    {
      q: ['Which linkage is most prone to "chaining"?', 'أي معيار ربط هو الأكثر عرضة لـ«التسلسل»؟'],
      options: [['Single', 'الأحادي'], ['Complete', 'الكامل'], ['Ward', 'Ward'], ['Average', 'المتوسط']],
      answer: 0,
      explain: ['One close pair of points is enough to join two groups.', 'يكفي زوج واحد متقارب من النقاط لربط مجموعتين.'],
    },
    {
      q: ['Agglomerative clustering starts with…', 'يبدأ التجميع التكتلي بـ…'],
      options: [['One cluster containing everything', 'عنقود واحد يحتوي كل شيء'], ['Each point in its own cluster', 'كل نقطة في عنقود مستقل'], ['K random centroids', 'K مراكز عشوائية'], ['A trained classifier', 'مصنِّف مدرَّب']],
      answer: 1,
      explain: ['It is bottom-up; the top-down alternative is called divisive clustering.', 'إنه تصاعدي؛ والبديل التنازلي يسمى التجميع التقسيمي.'],
    },
  ],
  related: ['k-means', 'dbscan', 'gmm'],
  references: [
    { title: 'scikit-learn — Hierarchical clustering', url: 'https://scikit-learn.org/stable/modules/clustering.html#hierarchical-clustering' },
    { title: 'SciPy — scipy.cluster.hierarchy.linkage', url: 'https://docs.scipy.org/doc/scipy/reference/generated/scipy.cluster.hierarchy.linkage.html' },
    { title: 'Müllner (2011), Modern hierarchical, agglomerative clustering algorithms', url: 'https://arxiv.org/abs/1109.2378' },
  ],
  compare: {
    purpose: ['Discover a hierarchy of clusters', 'اكتشاف تسلسل هرمي للعناقيد'],
    data: ['Small–medium datasets (hundreds to a few thousand points)', 'بيانات صغيرة إلى متوسطة (مئات إلى بضعة آلاف من النقاط)'],
    assumptions: ['Meaningful distance measure; depends on linkage', 'مقياس مسافة ذو معنى؛ ويعتمد على معيار الربط'],
    hyperparams: 'linkage, distance metric, cut height / n_clusters',
  },
};

/* ---------------------------- Explanation pages ---------------------------- */

const simpleQuiz = (q: [string, string], options: [string, string][], answer: number, explain: [string, string]) => ({ q, options, answer, explain });

export const dbscan: AlgorithmContent = {
  id: 'dbscan',
  name: ['DBSCAN', 'DBSCAN'],
  short: ['Density-based clustering: groups points that are packed closely together and labels isolated points as noise.', 'تجميع قائم على الكثافة: يجمع النقاط المتكدسة بإحكام ويصنّف النقاط المعزولة كضوضاء.'],
  paradigm: 'unsupervised',
  categories: ['clustering'],
  difficulty: 'intermediate',
  objectives: [
    ['Define core, border and noise points.', 'تعريف النقاط الجوهرية والحدّية والضوضاء.'],
    ['Explain the roles of ε (eps) and minPts.', 'شرح دور ε (eps) وminPts.'],
    ['Know when DBSCAN beats K-Means.', 'معرفة متى تتفوق DBSCAN على K-Means.'],
  ],
  intuition: [
    r`DBSCAN looks for **crowded regions**. A point is a **core point** if at least *minPts* points lie within distance $\varepsilon$ of it. Core points that are within $\varepsilon$ of each other belong to the same cluster, and clusters grow by hopping from core point to core point. Points near a cluster but not dense themselves are **border points**; everything else is **noise**.

Because clusters follow density rather than distance to a centre, DBSCAN finds rings, moons and other arbitrary shapes, and does not need $K$.`,
    r`تبحث DBSCAN عن **المناطق المزدحمة**. تكون النقطة **جوهرية** إذا وقعت *minPts* نقطة على الأقل ضمن المسافة $\varepsilon$ منها. النقاط الجوهرية التي تقع ضمن $\varepsilon$ من بعضها تنتمي إلى العنقود نفسه، وتنمو العناقيد بالقفز من نقطة جوهرية إلى أخرى. أما النقاط القريبة من عنقود دون أن تكون كثيفة بذاتها فهي **حدّية**، وكل ما عدا ذلك **ضوضاء**.

ولأن العناقيد تتبع الكثافة لا المسافة إلى مركز، تجد DBSCAN الحلقات والأهلّة والأشكال الاعتباطية الأخرى، ولا تحتاج إلى $K$.`,
  ],
  useCases: [['Geographic hotspot detection (e.g. GPS clusters).', 'اكتشاف البؤر الجغرافية (مثل تجمعات GPS).'], ['Anomaly detection — noise points are outliers.', 'كشف الشذوذ — نقاط الضوضاء قيم شاذة.'], ['Clustering shapes K-Means cannot capture.', 'تجميع الأشكال التي لا تلتقطها K-Means.']],
  steps: [
    ['For each point, count neighbours within ε.', 'لكل نقطة، عدّ الجيران ضمن ε.'],
    ['Mark points with ≥ minPts neighbours as core points.', 'علّم النقاط التي لها ≥ minPts جارًا كنقاط جوهرية.'],
    ['Connect core points closer than ε into clusters.', 'اربط النقاط الجوهرية الأقرب من ε في عناقيد.'],
    ['Attach border points to a neighbouring cluster; the rest is noise.', 'ألحق النقاط الحدّية بعنقود مجاور؛ والباقي ضوضاء.'],
  ],
  math: [
    r`$\varepsilon$-neighbourhood: $N_\varepsilon(\mathbf p) = \{\mathbf q : d(\mathbf p,\mathbf q)\le\varepsilon\}$. Core point: $|N_\varepsilon(\mathbf p)|\ge \text{minPts}$. A cluster is a maximal set of **density-connected** points. A common way to pick $\varepsilon$ is the "knee" of the sorted distance-to-$k$-th-nearest-neighbour plot.`,
    r`جوار $\varepsilon$: $N_\varepsilon(\mathbf p) = \{\mathbf q : d(\mathbf p,\mathbf q)\le\varepsilon\}$. النقطة الجوهرية: $|N_\varepsilon(\mathbf p)|\ge \text{minPts}$. العنقود مجموعة عظمى من النقاط **المتصلة كثافيًا**. ومن الطرق الشائعة لاختيار $\varepsilon$ «ركبة» منحنى المسافات المرتّبة إلى الجار رقم $k$.`,
  ],
  evaluation: [r`Silhouette score (excluding noise), fraction of points labelled noise, and visual inspection.`, r`درجة الصورة الظلية (مع استبعاد الضوضاء)، ونسبة النقاط المصنّفة ضوضاء، والفحص البصري.`],
  advantages: [['Finds arbitrary shapes; no K needed.', 'تجد أشكالًا اعتباطية؛ ولا تحتاج K.'], ['Explicitly identifies noise/outliers.', 'تحدد الضوضاء/القيم الشاذة صراحةً.']],
  limitations: [['Struggles when clusters have very different densities.', 'تواجه صعوبة عندما تختلف كثافات العناقيد كثيرًا.'], ['Sensitive to ε; distances degrade in high dimensions.', 'حساسة لقيمة ε؛ وتفقد المسافات معناها في الأبعاد العالية.']],
  mistakes: [['Using unscaled features.', 'استخدام خصائص غير محجّمة.'], ['Guessing ε without a k-distance plot.', 'تخمين ε دون منحنى المسافة-k.']],
  python: `from sklearn.cluster import DBSCAN
from sklearn.datasets import make_moons
X, _ = make_moons(n_samples=300, noise=0.07, random_state=0)
labels = DBSCAN(eps=0.2, min_samples=5).fit_predict(X)
print("clusters:", len(set(labels)) - (1 if -1 in labels else 0), "noise points:", (labels == -1).sum())`,
  pythonNote: ['Explanation page — an interactive DBSCAN lab is planned. Label −1 means noise in scikit-learn.', 'صفحة شرح — مختبر DBSCAN تفاعلي مخطط له. التصنيف −1 يعني ضوضاء في scikit-learn.'],
  quiz: [
    simpleQuiz(['A point with fewer than minPts neighbours within ε, and no core point nearby, is…', 'النقطة التي لها أقل من minPts جارًا ضمن ε ولا توجد نقطة جوهرية قريبة منها هي…'], [['A core point', 'نقطة جوهرية'], ['Noise', 'ضوضاء'], ['A centroid', 'مركز'], ['A border point', 'نقطة حدّية']], 1, ['It is neither dense nor near a dense region.', 'ليست كثيفة ولا قريبة من منطقة كثيفة.']),
    simpleQuiz(['Which shape can DBSCAN find but K-Means cannot?', 'أي شكل تستطيع DBSCAN إيجاده ولا تستطيعه K-Means؟'], [['Two interleaving moons', 'هلالان متداخلان'], ['Three round blobs', 'ثلاث كتل مستديرة'], ['One single blob', 'كتلة واحدة'], ['None', 'لا شيء']], 0, ['Density-connectivity follows curved shapes.', 'الاتصال الكثافي يتبع الأشكال المنحنية.']),
  ],
  related: ['k-means', 'hierarchical', 'gmm'],
  references: [
    { title: 'Ester et al. (1996), A density-based algorithm for discovering clusters (KDD)', url: 'https://dl.acm.org/doi/10.5555/3001460.3001507' },
    { title: 'scikit-learn — DBSCAN', url: 'https://scikit-learn.org/stable/modules/clustering.html#dbscan' },
  ],
  compare: {
    purpose: ['Density-based clustering with noise detection', 'تجميع قائم على الكثافة مع كشف الضوضاء'],
    data: ['Low-dimensional, scaled; clusters of similar density', 'بيانات منخفضة الأبعاد بعد التحجيم؛ عناقيد متقاربة الكثافة'],
    assumptions: ['Clusters are dense regions separated by sparse regions', 'العناقيد مناطق كثيفة تفصلها مناطق متناثرة'],
    hyperparams: 'eps, min_samples, metric',
  },
};

export const gmm: AlgorithmContent = {
  id: 'gmm',
  name: ['Gaussian Mixture Models', 'نماذج الخليط الغاوسي'],
  short: ['Models data as a blend of several Gaussian “bells”, giving each point a probability of belonging to each cluster.', 'ينمذج البيانات كمزيج من عدة «أجراس» غاوسية، فيعطي كل نقطة احتمال انتمائها لكل عنقود.'],
  paradigm: 'unsupervised',
  categories: ['clustering'],
  difficulty: 'advanced',
  objectives: [['Describe soft clustering with probabilities.', 'وصف التجميع الناعم بالاحتمالات.'], ['Outline the Expectation–Maximization (EM) algorithm.', 'تلخيص خوارزمية التوقع–التعظيم (EM).'], ['Relate GMMs to K-Means.', 'ربط نماذج الخليط الغاوسي بـK-Means.']],
  intuition: [
    r`K-Means gives each point a hard label. A GMM is softer: it imagines the data was produced by $K$ Gaussian distributions, each with its own centre, shape (covariance) and weight. Every point gets a **responsibility** — the probability that each Gaussian generated it. Clusters can be elongated and tilted, not just round.`,
    r`تعطي K-Means كل نقطة تصنيفًا قاطعًا، أما GMM فأكثر نعومة: تتخيل أن البيانات ولّدتها $K$ توزيعات غاوسية، لكل منها مركز وشكل (تغاير) ووزن. وتحصل كل نقطة على **مسؤولية** — أي احتمال أن كل توزيع غاوسي هو من ولّدها. ويمكن للعناقيد أن تكون مستطيلة ومائلة لا مستديرة فقط.`,
  ],
  useCases: [['Soft customer segmentation.', 'تقسيم ناعم للعملاء.'], ['Density estimation and anomaly scoring.', 'تقدير الكثافة وتقييم الشذوذ.'], ['Speaker identification (classically).', 'التعرّف على المتحدث (تقليديًا).']],
  steps: [
    ['Initialise means, covariances and weights.', 'هيّئ المتوسطات والتغايرات والأوزان.'],
    ['E-step: compute each point’s responsibilities.', 'خطوة E: احسب مسؤوليات كل نقطة.'],
    ['M-step: re-estimate parameters from the responsibilities.', 'خطوة M: أعد تقدير المعاملات من المسؤوليات.'],
    ['Repeat until the log-likelihood stops improving.', 'كرّر حتى يتوقف لوغاريتم الأرجحية عن التحسّن.'],
  ],
  math: [
    r`$$p(\mathbf x) = \sum_{k=1}^K \pi_k\,\mathcal N(\mathbf x\mid\boldsymbol\mu_k,\Sigma_k), \qquad \gamma_{ik} = \frac{\pi_k\,\mathcal N(\mathbf x_i\mid\boldsymbol\mu_k,\Sigma_k)}{\sum_j \pi_j\,\mathcal N(\mathbf x_i\mid\boldsymbol\mu_j,\Sigma_j)}$$

M-step: $N_k=\sum_i\gamma_{ik}$, $\boldsymbol\mu_k = \frac{1}{N_k}\sum_i\gamma_{ik}\mathbf x_i$, $\pi_k = N_k/n$. With equal spherical covariances shrinking to zero, EM becomes K-Means.`,
    r`$$p(\mathbf x) = \sum_{k=1}^K \pi_k\,\mathcal N(\mathbf x\mid\boldsymbol\mu_k,\Sigma_k), \qquad \gamma_{ik} = \frac{\pi_k\,\mathcal N(\mathbf x_i\mid\boldsymbol\mu_k,\Sigma_k)}{\sum_j \pi_j\,\mathcal N(\mathbf x_i\mid\boldsymbol\mu_j,\Sigma_j)}$$

خطوة M: $N_k=\sum_i\gamma_{ik}$، و$\boldsymbol\mu_k = \frac{1}{N_k}\sum_i\gamma_{ik}\mathbf x_i$، و$\pi_k = N_k/n$. ومع تغايرات كروية متساوية تتقلص إلى الصفر تصبح EM هي K-Means.`,
  ],
  evaluation: [r`Log-likelihood, and **BIC/AIC** to choose $K$ (penalising extra parameters).`, r`لوغاريتم الأرجحية، و**BIC/AIC** لاختيار $K$ (بمعاقبة المعاملات الإضافية).`],
  advantages: [['Soft assignments with probabilities.', 'تعيينات ناعمة باحتمالات.'], ['Flexible elliptical cluster shapes.', 'أشكال عناقيد إهليلجية مرنة.']],
  limitations: [['Needs K; EM finds local optima.', 'تحتاج K؛ وتجد EM حلولًا مثلى محلية.'], ['Many parameters with full covariances; can collapse on tiny clusters.', 'معاملات كثيرة مع التغايرات الكاملة؛ وقد تنهار على عناقيد صغيرة جدًا.']],
  mistakes: [['Choosing K by likelihood alone (always prefers more components).', 'اختيار K بالأرجحية وحدها (تفضّل دائمًا مكونات أكثر).']],
  python: `from sklearn.mixture import GaussianMixture
from sklearn.datasets import make_blobs
X, _ = make_blobs(n_samples=300, centers=3, random_state=2)
for k in range(1, 6):
    gm = GaussianMixture(n_components=k, covariance_type="full", random_state=0).fit(X)
    print(k, round(gm.bic(X), 1))
print(gm.predict_proba(X[:3]))   # soft memberships`,
  pythonNote: ['Explanation page — an interactive EM lab is planned.', 'صفحة شرح — مختبر تفاعلي لخوارزمية EM مخطط له.'],
  quiz: [simpleQuiz(['What does a GMM give each point?', 'ماذا تعطي GMM لكل نقطة؟'], [['Only a hard label', 'تصنيفًا قاطعًا فقط'], ['A probability for each cluster', 'احتمالًا لكل عنقود'], ['A distance', 'مسافة'], ['Nothing', 'لا شيء']], 1, ['These are the responsibilities from the E-step.', 'هذه هي المسؤوليات من خطوة E.'])],
  related: ['k-means', 'naive-bayes', 'dbscan'],
  references: [{ title: 'scikit-learn — Gaussian mixture models', url: 'https://scikit-learn.org/stable/modules/mixture.html' }, { title: 'Bishop, Pattern Recognition and Machine Learning (ch. 9)', url: 'https://www.microsoft.com/en-us/research/people/cmbishop/prml-book/' }],
  compare: {
    purpose: ['Probabilistic (soft) clustering and density estimation', 'تجميع احتمالي (ناعم) وتقدير الكثافة'],
    data: ['Numeric, moderate dimension', 'بيانات عددية متوسطة الأبعاد'],
    assumptions: ['Data is a mixture of Gaussians', 'البيانات خليط من توزيعات غاوسية'],
    hyperparams: 'n_components, covariance_type, init',
  },
};

export const associationRules: AlgorithmContent = {
  id: 'association-rules',
  name: ['Association Rule Learning', 'تعلّم قواعد الارتباط'],
  short: ['Discovers “if X then Y” patterns in transaction data, measured by support, confidence and lift.', 'يكتشف أنماط «إذا X فإن Y» في بيانات المعاملات، وتُقاس بالدعم والثقة والرفع.'],
  paradigm: 'unsupervised',
  categories: ['association'],
  difficulty: 'beginner',
  objectives: [['Define support, confidence and lift.', 'تعريف الدعم والثقة والرفع.'], ['Interpret a rule such as {bread} → {butter}.', 'تفسير قاعدة مثل {خبز} ← {زبدة}.'], ['Explain why frequent-itemset mining comes first.', 'شرح لماذا يأتي التنقيب عن المجموعات المتكررة أولًا.']],
  intuition: [
    r`Supermarkets noticed that some products are bought together. Association rule learning finds such patterns automatically from lists of transactions ("baskets"). A rule $X \Rightarrow Y$ says: baskets containing $X$ often also contain $Y$.

Not every rule is interesting. **Support** asks how often the items appear together at all; **confidence** asks how often $Y$ appears when $X$ does; **lift** asks whether that happens more than chance would predict.`,
    r`لاحظت المتاجر أن بعض المنتجات تُشترى معًا. يجد تعلّم قواعد الارتباط هذه الأنماط تلقائيًا من قوائم المعاملات («السلال»). القاعدة $X \Rightarrow Y$ تعني: السلال التي تحتوي $X$ تحتوي غالبًا $Y$ أيضًا.

وليست كل قاعدة مهمة. يسأل **الدعم** عن مدى ظهور العناصر معًا أصلًا، وتسأل **الثقة** عن مدى ظهور $Y$ عند ظهور $X$، ويسأل **الرفع** هل يحدث ذلك أكثر مما تتوقعه الصدفة.`,
  ],
  useCases: [['Market-basket analysis and product placement.', 'تحليل سلة التسوق وترتيب المنتجات.'], ['“Frequently bought together” recommendations.', 'توصيات «يُشترى غالبًا معًا».'], ['Finding co-occurring symptoms or web pages.', 'إيجاد الأعراض أو صفحات الويب المتلازمة.']],
  steps: [['Find all itemsets with support ≥ a minimum (Apriori or FP-Growth).', 'جد كل المجموعات التي دعمها ≥ حد أدنى (Apriori أو FP-Growth).'], ['From each frequent itemset, form candidate rules X → Y.', 'من كل مجموعة متكررة كوّن قواعد مرشحة X ← Y.'], ['Keep rules with enough confidence and lift > 1.', 'احتفظ بالقواعد ذات الثقة الكافية والرفع > 1.']],
  math: [
    r`$$\text{supp}(X) = \frac{\#\{\text{baskets} \supseteq X\}}{N},\quad \text{conf}(X\Rightarrow Y) = \frac{\text{supp}(X\cup Y)}{\text{supp}(X)},\quad \text{lift} = \frac{\text{conf}(X\Rightarrow Y)}{\text{supp}(Y)}$$

Lift $>1$: positive association; $=1$: independence; $<1$: the items tend not to co-occur.`,
    r`$$\text{supp}(X) = \frac{\#\{\text{baskets} \supseteq X\}}{N},\quad \text{conf}(X\Rightarrow Y) = \frac{\text{supp}(X\cup Y)}{\text{supp}(X)},\quad \text{lift} = \frac{\text{conf}(X\Rightarrow Y)}{\text{supp}(Y)}$$

الرفع $>1$: ارتباط موجب؛ و$=1$: استقلال؛ و$<1$: تميل العناصر إلى عدم الظهور معًا.`,
  ],
  evaluation: [r`Support, confidence and lift (plus leverage or conviction). Validate interesting rules on new data — with many items, some rules look strong by chance.`, r`الدعم والثقة والرفع (إضافة إلى الرافعة أو القناعة). تحقق من القواعد المثيرة على بيانات جديدة — فمع كثرة العناصر تبدو بعض القواعد قوية بالصدفة.`],
  advantages: [['Unsupervised and highly interpretable.', 'غير موجَّه وقابل للتفسير بدرجة عالية.']],
  limitations: [['The number of possible itemsets explodes combinatorially.', 'عدد المجموعات الممكنة ينفجر توافقيًا.'], ['Correlation, not causation; many trivial rules.', 'ارتباط لا سببية؛ وقواعد بديهية كثيرة.']],
  mistakes: [['Ranking rules by confidence alone, ignoring how common Y already is.', 'ترتيب القواعد بالثقة وحدها مع تجاهل مدى شيوع Y أصلًا.']],
  python: `import pandas as pd
from mlxtend.frequent_patterns import apriori, association_rules   # third-party: pip install mlxtend

baskets = pd.DataFrame([
    {"bread": 1, "butter": 1, "milk": 0},
    {"bread": 1, "butter": 1, "milk": 1},
    {"bread": 1, "butter": 0, "milk": 1},
    {"bread": 0, "butter": 0, "milk": 1},
]).astype(bool)
freq = apriori(baskets, min_support=0.5, use_colnames=True)
print(association_rules(freq, metric="lift", min_threshold=1.0)[["antecedents", "consequents", "support", "confidence", "lift"]])`,
  pythonNote: ['scikit-learn has no association-rule module; mlxtend is a widely used third-party library. Explanation page — interactive lab planned.', 'لا يحتوي scikit-learn على وحدة لقواعد الارتباط؛ وmlxtend مكتبة خارجية شائعة الاستخدام. صفحة شرح — المختبر التفاعلي مخطط له.'],
  quiz: [simpleQuiz(['Lift = 1 for rule X → Y means…', 'الرفع = 1 للقاعدة X ← Y يعني…'], [['X and Y are independent', 'X وY مستقلان'], ['X always implies Y', 'X يؤدي دائمًا إلى Y'], ['Y never appears', 'Y لا يظهر أبدًا'], ['Support is 1', 'الدعم يساوي 1']], 0, ['Seeing X does not change the chance of Y.', 'رؤية X لا تغيّر احتمال Y.'])],
  related: ['apriori', 'fp-growth'],
  references: [{ title: 'Agrawal, Imieliński & Swami (1993), Mining association rules between sets of items (SIGMOD)', url: 'https://doi.org/10.1145/170035.170072' }, { title: 'mlxtend — association rules', url: 'https://rasbt.github.io/mlxtend/user_guide/frequent_patterns/association_rules/' }],
  compare: {
    purpose: ['Find co-occurrence rules in transactions', 'إيجاد قواعد التلازم في المعاملات'],
    data: ['Sets of items (baskets), binary/categorical', 'مجموعات عناصر (سلال)، ثنائية/فئوية'],
    assumptions: ['Frequent co-occurrence is informative', 'التلازم المتكرر ذو دلالة'],
    hyperparams: 'min_support, min_confidence, min_lift',
  },
};

export const apriori: AlgorithmContent = {
  ...associationRules,
  id: 'apriori',
  name: ['Apriori', 'خوارزمية Apriori'],
  short: ['Finds frequent itemsets level by level, pruning any candidate that has an infrequent subset.', 'تجد المجموعات المتكررة مستوى تلو الآخر، وتقلّم أي مرشح له مجموعة جزئية غير متكررة.'],
  difficulty: 'intermediate',
  objectives: [['State the Apriori (downward-closure) property.', 'صياغة خاصية Apriori (الإغلاق التنازلي).'], ['Trace candidate generation and pruning.', 'تتبّع توليد المرشحين وتقليمهم.']],
  intuition: [
    r`Apriori relies on one simple fact: **every subset of a frequent itemset is also frequent**. Equivalently, if {bread, jam} is rare, then {bread, jam, milk} must be rare too — no need to count it.

So it works in levels: count single items, keep the frequent ones, combine them into pairs, keep the frequent pairs, combine into triples, and so on — pruning any candidate with an infrequent subset.`,
    r`تعتمد Apriori على حقيقة بسيطة: **كل مجموعة جزئية من مجموعة متكررة متكررةٌ أيضًا**. وبالمكافئ: إذا كانت {خبز، مربى} نادرة، فإن {خبز، مربى، حليب} نادرة حتمًا — ولا داعي لعدّها.

لذلك تعمل على مستويات: تعدّ العناصر المفردة وتحتفظ بالمتكررة، ثم تجمعها في أزواج وتحتفظ بالأزواج المتكررة، ثم في ثلاثيات، وهكذا — مع تقليم أي مرشح له مجموعة جزئية غير متكررة.`,
  ],
  steps: [['L₁ = frequent single items.', 'L₁ = العناصر المفردة المتكررة.'], ['Join Lₖ with itself to form candidates of size k+1.', 'اربط Lₖ بنفسها لتكوين مرشحين بحجم k+1.'], ['Prune candidates with any infrequent k-subset.', 'قلّم المرشحين الذين لديهم أي مجموعة جزئية بحجم k غير متكررة.'], ['Scan the data to count support; keep frequent ones as Lₖ₊₁.', 'امسح البيانات لعدّ الدعم؛ واحتفظ بالمتكررة كـLₖ₊₁.'], ['Stop when no new frequent itemsets appear.', 'توقف عندما لا تظهر مجموعات متكررة جديدة.']],
  math: [r`Anti-monotonicity of support: $X\subseteq Y \Rightarrow \text{supp}(X)\ge\text{supp}(Y)$. Each level needs a full pass over the data, so Apriori can be slow when many candidates survive.`, r`الرتابة العكسية للدعم: $X\subseteq Y \Rightarrow \text{supp}(X)\ge\text{supp}(Y)$. يحتاج كل مستوى مرورًا كاملًا على البيانات، لذا قد تكون Apriori بطيئة عندما يبقى مرشحون كثيرون.`],
  advantages: [['Simple, easy to explain, and correct.', 'بسيطة وسهلة الشرح وصحيحة.']],
  limitations: [['Many database scans and potentially huge candidate sets.', 'مسح متكرر للبيانات ومجموعات مرشحين قد تكون ضخمة.']],
  mistakes: [['Setting min_support too low, producing millions of itemsets.', 'ضبط min_support منخفضًا جدًا مما ينتج ملايين المجموعات.']],
  python: `from mlxtend.frequent_patterns import apriori   # third-party
# baskets: one-hot DataFrame (rows = transactions, columns = items)
frequent = apriori(baskets, min_support=0.3, use_colnames=True, max_len=3)
print(frequent.sort_values("support", ascending=False))`,
  quiz: [simpleQuiz(['If {A, B} is infrequent, then {A, B, C} is…', 'إذا كانت {A, B} غير متكررة، فإن {A, B, C}…'], [['Certainly infrequent', 'غير متكررة حتمًا'], ['Certainly frequent', 'متكررة حتمًا'], ['Unknown', 'مجهولة'], ['Equal in support', 'مساوية في الدعم']], 0, ['Support can only decrease when items are added.', 'الدعم لا يمكن إلا أن ينخفض عند إضافة عناصر.'])],
  related: ['association-rules', 'fp-growth'],
  references: [{ title: 'Agrawal & Srikant (1994), Fast Algorithms for Mining Association Rules (VLDB)', url: 'https://www.vldb.org/conf/1994/P487.PDF' }, { title: 'mlxtend — apriori', url: 'https://rasbt.github.io/mlxtend/user_guide/frequent_patterns/apriori/' }],
  compare: { ...associationRules.compare, purpose: ['Frequent-itemset mining by level-wise search', 'التنقيب عن المجموعات المتكررة بالبحث مستوى بمستوى'] },
};

export const fpGrowth: AlgorithmContent = {
  ...associationRules,
  id: 'fp-growth',
  name: ['FP-Growth', 'خوارزمية FP-Growth'],
  short: ['Mines frequent itemsets without generating candidates by compressing transactions into an FP-tree.', 'تنقّب عن المجموعات المتكررة دون توليد مرشحين بضغط المعاملات في شجرة FP.'],
  difficulty: 'advanced',
  objectives: [['Describe the FP-tree structure.', 'وصف بنية شجرة FP.'], ['Explain why FP-Growth is usually faster than Apriori.', 'شرح لماذا تكون FP-Growth عادةً أسرع من Apriori.']],
  intuition: [
    r`Instead of guessing candidates and re-scanning the data, FP-Growth reads the data **twice**: once to count items, once to insert each transaction (items sorted by frequency) into a prefix tree — the **FP-tree** — where shared prefixes are stored only once. Frequent itemsets are then grown recursively from small "conditional" trees.`,
    r`بدل تخمين المرشحين وإعادة مسح البيانات، تقرأ FP-Growth البيانات **مرتين** فقط: مرة لعدّ العناصر، ومرة لإدخال كل معاملة (بعناصر مرتّبة حسب التكرار) في شجرة بادئات — هي **شجرة FP** — حيث تُخزَّن البادئات المشتركة مرة واحدة. ثم تُنمّى المجموعات المتكررة تعاوديًا من أشجار «شرطية» صغيرة.`,
  ],
  steps: [['Count item supports; drop infrequent items.', 'عدّ دعم العناصر؛ واحذف غير المتكررة.'], ['Insert each transaction, sorted by support, into the FP-tree.', 'أدخل كل معاملة مرتّبة حسب الدعم في شجرة FP.'], ['For each item, build its conditional pattern base and conditional FP-tree.', 'لكل عنصر، ابنِ قاعدة الأنماط الشرطية وشجرة FP الشرطية.'], ['Recursively mine frequent itemsets from conditional trees.', 'نقّب تعاوديًا عن المجموعات المتكررة من الأشجار الشرطية.']],
  math: [r`Divide-and-conquer on the FP-tree: frequent itemsets ending in item $i$ are found from $i$'s conditional tree, so no candidate set is ever materialised.`, r`فرّق تسُد على شجرة FP: تُوجد المجموعات المتكررة المنتهية بالعنصر $i$ من الشجرة الشرطية لـ$i$، فلا تُنشأ مجموعة مرشحين أبدًا.`],
  advantages: [['Only two data scans; no candidate explosion.', 'مسحان فقط للبيانات؛ دون انفجار في المرشحين.']],
  limitations: [['The FP-tree can be large for sparse, diverse data; harder to implement.', 'قد تكون شجرة FP كبيرة مع البيانات المتناثرة المتنوعة؛ وأصعب في التطبيق.']],
  mistakes: [['Assuming FP-Growth finds different itemsets than Apriori — the results are identical, only speed differs.', 'افتراض أن FP-Growth تجد مجموعات مختلفة عن Apriori — النتائج متطابقة والفرق في السرعة فقط.']],
  python: `from mlxtend.frequent_patterns import fpgrowth   # third-party
frequent = fpgrowth(baskets, min_support=0.3, use_colnames=True)
print(frequent)`,
  quiz: [simpleQuiz(['Compared with Apriori, FP-Growth returns…', 'مقارنةً بـApriori، تُرجع FP-Growth…'], [['The same frequent itemsets, usually faster', 'المجموعات المتكررة نفسها وعادةً أسرع'], ['Fewer itemsets', 'مجموعات أقل'], ['Approximate results', 'نتائج تقريبية'], ['Only pairs', 'أزواجًا فقط']], 0, ['Both are exact algorithms for the same problem.', 'كلتاهما خوارزمية دقيقة للمسألة نفسها.'])],
  related: ['apriori', 'association-rules'],
  references: [{ title: 'Han, Pei & Yin (2000), Mining frequent patterns without candidate generation (SIGMOD)', url: 'https://doi.org/10.1145/335191.335372' }, { title: 'mlxtend — fpgrowth', url: 'https://rasbt.github.io/mlxtend/user_guide/frequent_patterns/fpgrowth/' }],
  compare: { ...associationRules.compare, purpose: ['Frequent-itemset mining with an FP-tree', 'التنقيب عن المجموعات المتكررة بشجرة FP'] },
};

export const tsne: AlgorithmContent = {
  id: 'tsne',
  name: ['t-SNE', 't-SNE'],
  short: ['A non-linear method that maps high-dimensional data to 2-D/3-D for visualisation by preserving local neighbourhoods.', 'طريقة غير خطية تنقل البيانات عالية الأبعاد إلى بُعدين أو ثلاثة للتصور مع الحفاظ على الجوارات المحلية.'],
  paradigm: 'unsupervised',
  categories: ['dimensionality-reduction'],
  difficulty: 'advanced',
  objectives: [['Explain neighbourhood probabilities and the KL objective.', 'شرح احتمالات الجوار ودالة KL الهدف.'], ['Know what t-SNE plots can and cannot tell you.', 'معرفة ما يمكن وما لا يمكن لمخططات t-SNE إخبارك به.']],
  intuition: [
    r`t-SNE asks: "which points are neighbours in the original space?" and tries to arrange points on a 2-D map so that the same points remain neighbours. It is excellent at revealing clusters, but distances *between* clusters and cluster sizes on the map are not meaningful.`,
    r`يسأل t-SNE: «أي النقاط متجاورة في الفضاء الأصلي؟» ثم يحاول ترتيب النقاط على خريطة ثنائية الأبعاد بحيث تبقى النقاط نفسها متجاورة. وهو ممتاز في كشف العناقيد، لكن المسافات *بين* العناقيد وأحجامها على الخريطة ليست ذات معنى.`,
  ],
  useCases: [['Visualising word or image embeddings.', 'تصوّر تضمينات الكلمات أو الصور.'], ['Exploring single-cell biology data.', 'استكشاف بيانات الخلايا المفردة في الأحياء.']],
  steps: [['Convert distances to neighbour probabilities p_ij with a per-point bandwidth (set by perplexity).', 'حوّل المسافات إلى احتمالات جوار p_ij بعرض نطاق لكل نقطة (يحدده الالتباس perplexity).'], ['Place points randomly in 2-D; define q_ij with a heavy-tailed Student-t kernel.', 'ضع النقاط عشوائيًا في بُعدين؛ وعرّف q_ij بنواة ستيودنت-t ثقيلة الذيل.'], ['Move points by gradient descent to minimise KL(P‖Q).', 'حرّك النقاط بالانحدار التدرّجي لتقليل KL(P‖Q).']],
  math: [r`$$\text{KL}(P\Vert Q) = \sum_{i\ne j} p_{ij}\log\frac{p_{ij}}{q_{ij}}, \qquad q_{ij} = \frac{(1+\lVert\mathbf y_i-\mathbf y_j\rVert^2)^{-1}}{\sum_{k\ne l}(1+\lVert\mathbf y_k-\mathbf y_l\rVert^2)^{-1}}$$`, r`$$\text{KL}(P\Vert Q) = \sum_{i\ne j} p_{ij}\log\frac{p_{ij}}{q_{ij}}, \qquad q_{ij} = \frac{(1+\lVert\mathbf y_i-\mathbf y_j\rVert^2)^{-1}}{\sum_{k\ne l}(1+\lVert\mathbf y_k-\mathbf y_l\rVert^2)^{-1}}$$`],
  evaluation: [r`Mostly qualitative. Check stability across random seeds and perplexities; trustworthiness scores measure neighbourhood preservation.`, r`تقييمه نوعي في الغالب. افحص الثبات عبر البذور العشوائية وقيم الالتباس؛ وتقيس درجات الموثوقية مدى الحفاظ على الجوارات.`],
  advantages: [['Reveals local cluster structure beautifully.', 'يكشف بنية العناقيد المحلية بوضوح.']],
  limitations: [['Slow on large data; stochastic; no transform for new points.', 'بطيء على البيانات الكبيرة؛ عشوائي؛ ولا يحوّل النقاط الجديدة.'], ['Global geometry is not preserved.', 'لا يحافظ على الهندسة العامة.']],
  mistakes: [['Interpreting cluster sizes or gaps between clusters.', 'تفسير أحجام العناقيد أو الفجوات بينها.'], ['Using a single perplexity value.', 'استخدام قيمة التباس واحدة فقط.']],
  python: `from sklearn.manifold import TSNE
from sklearn.datasets import load_digits
X, y = load_digits(return_X_y=True)
emb = TSNE(n_components=2, perplexity=30, random_state=0).fit_transform(X)
print(emb.shape)   # (1797, 2)`,
  pythonNote: ['Explanation page — an interactive embedding lab is planned.', 'صفحة شرح — مختبر تفاعلي للتضمين مخطط له.'],
  quiz: [simpleQuiz(['In a t-SNE map, which is most reliable?', 'في خريطة t-SNE، ما الأكثر موثوقية؟'], [['Which points are near each other', 'أي النقاط قريبة من بعضها'], ['Distances between clusters', 'المسافات بين العناقيد'], ['Cluster sizes', 'أحجام العناقيد'], ['Axis meaning', 'معنى المحاور']], 0, ['t-SNE preserves local neighbourhoods, not global geometry.', 'يحافظ t-SNE على الجوارات المحلية لا الهندسة العامة.'])],
  related: ['pca', 'umap'],
  references: [{ title: 'van der Maaten & Hinton (2008), Visualizing Data using t-SNE (JMLR)', url: 'https://jmlr.org/papers/v9/vandermaaten08a.html' }, { title: 'Wattenberg et al. (2016), How to Use t-SNE Effectively (Distill)', url: 'https://distill.pub/2016/misread-tsne/' }],
  compare: {
    purpose: ['Non-linear 2-D/3-D visualisation', 'تصوّر غير خطي في بُعدين/ثلاثة'],
    data: ['Up to tens of thousands of points', 'حتى عشرات الآلاف من النقاط'],
    assumptions: ['Local neighbourhoods carry the structure', 'الجوارات المحلية تحمل البنية'],
    hyperparams: 'perplexity, learning_rate, n_iter, random_state',
  },
};

export const umap: AlgorithmContent = {
  ...tsne,
  id: 'umap',
  name: ['UMAP', 'UMAP'],
  short: ['A fast non-linear embedding based on neighbour graphs that preserves more global structure than t-SNE.', 'تضمين غير خطي سريع قائم على رسوم الجوار يحافظ على بنية عامة أكثر من t-SNE.'],
  objectives: [['Describe UMAP’s neighbour-graph approach.', 'وصف نهج UMAP القائم على رسم الجوار.'], ['Compare UMAP with t-SNE and PCA.', 'مقارنة UMAP مع t-SNE وPCA.']],
  intuition: [
    r`UMAP builds a weighted **k-nearest-neighbour graph** of the data, then finds a low-dimensional layout whose own neighbour graph is as similar as possible. It is typically much faster than t-SNE, scales to millions of points, can transform new data, and tends to keep more of the global arrangement.`,
    r`يبني UMAP **رسمًا بيانيًا موزونًا لأقرب k جيران** للبيانات، ثم يجد ترتيبًا منخفض الأبعاد يكون رسم جواره أقرب ما يمكن للأصل. وهو عادةً أسرع بكثير من t-SNE، ويتوسع إلى ملايين النقاط، ويستطيع تحويل البيانات الجديدة، ويميل إلى الحفاظ على قدر أكبر من الترتيب العام.`,
  ],
  steps: [['Build a k-NN graph with locally adaptive distances.', 'ابنِ رسم أقرب k جيران بمسافات متكيفة محليًا.'], ['Turn it into a fuzzy graph of edge weights.', 'حوّله إلى رسم ضبابي لأوزان الحواف.'], ['Optimise a 2-D layout with a cross-entropy objective using stochastic gradient descent.', 'حسّن ترتيبًا ثنائي الأبعاد بدالة إنتروبيا متقاطعة باستخدام الانحدار التدرّجي العشوائي.']],
  math: [r`UMAP minimises the fuzzy-set cross-entropy between high- and low-dimensional edge weights $v_{ij}$ and $w_{ij}$: $\sum_{ij} v_{ij}\log\frac{v_{ij}}{w_{ij}} + (1-v_{ij})\log\frac{1-v_{ij}}{1-w_{ij}}$.`, r`يقلل UMAP الإنتروبيا المتقاطعة للمجموعات الضبابية بين أوزان الحواف في الأبعاد العالية والمنخفضة $v_{ij}$ و$w_{ij}$: $\sum_{ij} v_{ij}\log\frac{v_{ij}}{w_{ij}} + (1-v_{ij})\log\frac{1-v_{ij}}{1-w_{ij}}$.`],
  advantages: [['Fast and scalable; supports transforming new points.', 'سريع وقابل للتوسع؛ ويدعم تحويل النقاط الجديدة.']],
  limitations: [['Still distorts densities and distances; results depend on n_neighbors and min_dist.', 'لا يزال يشوّه الكثافات والمسافات؛ والنتائج تعتمد على n_neighbors وmin_dist.']],
  mistakes: [['Treating the embedding axes as interpretable features.', 'معاملة محاور التضمين كخصائص قابلة للتفسير.']],
  python: `import umap   # third-party: pip install umap-learn
from sklearn.datasets import load_digits
X, y = load_digits(return_X_y=True)
emb = umap.UMAP(n_neighbors=15, min_dist=0.1, random_state=0).fit_transform(X)
print(emb.shape)`,
  pythonNote: ['UMAP is provided by the third-party umap-learn package. Explanation page — interactive lab planned.', 'يوفّر UMAP عبر الحزمة الخارجية umap-learn. صفحة شرح — المختبر التفاعلي مخطط له.'],
  quiz: [simpleQuiz(['A practical advantage of UMAP over t-SNE is…', 'من المزايا العملية لـUMAP على t-SNE…'], [['It is usually much faster and can embed new points', 'أنه أسرع عادةً بكثير ويستطيع تضمين نقاط جديدة'], ['It is linear', 'أنه خطي'], ['It needs labels', 'أنه يحتاج تصنيفات'], ['It has no parameters', 'أنه بلا معاملات']], 0, ['UMAP learns a reusable transform and scales well.', 'يتعلّم UMAP تحويلًا قابلًا لإعادة الاستخدام ويتوسع جيدًا.'])],
  related: ['tsne', 'pca'],
  references: [{ title: 'McInnes, Healy & Melville (2018), UMAP (arXiv:1802.03426)', url: 'https://arxiv.org/abs/1802.03426' }, { title: 'umap-learn documentation', url: 'https://umap-learn.readthedocs.io/' }],
  compare: { ...tsne.compare, data: ['Scales to millions of points', 'يتوسع إلى ملايين النقاط'], hyperparams: 'n_neighbors, min_dist, metric' },
};

export const UNSUPERVISED = [kMeans, pca, hierarchical, dbscan, gmm, associationRules, apriori, fpGrowth, tsne, umap];
