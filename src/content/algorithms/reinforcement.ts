import type { AlgorithmContent } from '../types';

const r = String.raw;
const qz = (q: [string, string], options: [string, string][], answer: number, explain: [string, string]) => ({ q, options, answer, explain });

const RL_COMPARE_DATA: [string, string] = ['Interaction with an environment (states, actions, rewards)', 'التفاعل مع بيئة (حالات، إجراءات، مكافآت)'];

export const qLearning: AlgorithmContent = {
  id: 'q-learning',
  name: ['Q-Learning', 'تعلّم Q'],
  short: ['Learns the value of each action in each state from rewards, then acts greedily on those values.', 'يتعلّم قيمة كل إجراء في كل حالة من المكافآت، ثم يتصرف بجشع وفق هذه القيم.'],
  paradigm: 'reinforcement',
  categories: ['reinforcement'],
  difficulty: 'intermediate',
  labId: 'q-learning',
  objectives: [
    ['Name the parts of an RL problem: agent, environment, state, action, reward, policy, episode.', 'تسمية مكونات مسألة التعلّم المعزّز: الوكيل، البيئة، الحالة، الإجراء، المكافأة، السياسة، الحلقة.'],
    ['Apply the Q-learning update and explain the Bellman target.', 'تطبيق تحديث تعلّم Q وشرح هدف بيلمان.'],
    ['Explain the roles of α, γ and ε.', 'شرح أدوار α وγ وε.'],
  ],
  intuition: [
    r`A robot in a maze does not know where the exit is. It tries moves, receives **rewards** (+10 at the goal, −10 in a pit, a small −0.1 per step), and gradually learns **how good each move is from each square**. These estimates are the **Q-values**, $Q(s,a)$.

After every move it nudges $Q(s,a)$ toward "the reward I just got **plus** the best value I can expect from where I landed". Good outcomes propagate backwards, one step at a time, from the goal toward the start.

The **policy** is then simple: in each state pick the action with the highest Q-value. During learning the agent sometimes picks a random action (**exploration**, probability $\varepsilon$) so it can discover better routes.`,
    r`لا يعرف روبوت في متاهة أين المخرج. يجرّب حركات، ويتلقى **مكافآت** (+10 عند الهدف، و−10 في الحفرة، و−0.1 صغيرة لكل خطوة)، ويتعلّم تدريجيًا **مدى جودة كل حركة من كل مربع**. هذه التقديرات هي **قيم Q**، أي $Q(s,a)$.

بعد كل حركة يدفع $Q(s,a)$ نحو «المكافأة التي حصلت عليها للتو **زائد** أفضل قيمة أتوقعها من حيث وصلت». فتنتشر النتائج الجيدة إلى الخلف خطوة تلو الأخرى، من الهدف نحو البداية.

ثم تصبح **السياسة** بسيطة: في كل حالة اختر الإجراء صاحب أعلى قيمة Q. وأثناء التعلّم يختار الوكيل أحيانًا إجراءً عشوائيًا (**الاستكشاف** باحتمال $\varepsilon$) ليكتشف طرقًا أفضل.`,
  ],
  useCases: [
    ['Game-playing agents and puzzles.', 'وكلاء الألعاب والألغاز.'],
    ['Robot navigation in discrete environments.', 'ملاحة الروبوتات في البيئات المتقطعة.'],
    ['The foundation of Deep Q-Networks (DQN).', 'الأساس لشبكات Q العميقة (DQN).'],
  ],
  steps: [
    ['Initialise Q(s, a) = 0 for all states and actions.', 'هيّئ Q(s, a) = 0 لكل الحالات والإجراءات.'],
    ['At state s, choose a with ε-greedy (random with probability ε, otherwise best Q).', 'في الحالة s اختر a بطريقة ε-الجشعة (عشوائي باحتمال ε، وإلا أفضل Q).'],
    ['Take a; observe reward r and next state s′.', 'نفّذ a؛ ولاحظ المكافأة r والحالة التالية s′.'],
    ['Update Q(s, a) toward r + γ·maxₐ′ Q(s′, a′).', 'حدّث Q(s, a) نحو r + γ·maxₐ′ Q(s′, a′).'],
    ['Move to s′; when the episode ends, start again from the start state.', 'انتقل إلى s′؛ وعند انتهاء الحلقة ابدأ من جديد من حالة البداية.'],
  ],
  math: [
    r`Return with discount factor $\gamma\in[0,1)$: $G_t = r_{t+1} + \gamma r_{t+2} + \gamma^2 r_{t+3} + \dots$

The optimal action-value function satisfies the **Bellman optimality equation**:

$$Q^*(s,a) = \mathbb E\big[\,r + \gamma\max_{a'}Q^*(s',a')\,\big]$$

Q-learning turns it into an incremental update with learning rate $\alpha$:

$$Q(s,a) \leftarrow Q(s,a) + \alpha\,\big[\underbrace{r + \gamma\max_{a'}Q(s',a')}_{\text{TD target}} - Q(s,a)\big]$$

The bracket is the **TD error** $\delta$. For terminal transitions the bootstrap term is $0$. Q-learning is **off-policy**: it learns the greedy policy's values while behaving $\varepsilon$-greedily.`,
    r`العائد مع معامل الخصم $\gamma\in[0,1)$: $G_t = r_{t+1} + \gamma r_{t+2} + \gamma^2 r_{t+3} + \dots$

تحقق دالة قيمة الإجراء المثلى **معادلة بيلمان للأمثلية**:

$$Q^*(s,a) = \mathbb E\big[\,r + \gamma\max_{a'}Q^*(s',a')\,\big]$$

ويحوّلها تعلّم Q إلى تحديث تدريجي بمعدل تعلّم $\alpha$:

$$Q(s,a) \leftarrow Q(s,a) + \alpha\,\big[\underbrace{r + \gamma\max_{a'}Q(s',a')}_{\text{TD target}} - Q(s,a)\big]$$

القوس هو **خطأ الفرق الزمني** $\delta$. وفي الانتقالات النهائية يساوي حد التقدير الذاتي $0$. وتعلّم Q **خارج السياسة**: يتعلّم قيم السياسة الجشعة بينما يتصرف بطريقة $\varepsilon$-الجشعة.`,
  ],
  labGuide: [
    { param: ['α (learning rate)', 'α (معدل التعلّم)'], effect: ['How strongly each new experience overwrites the old estimate.', 'مدى قوة استبدال كل تجربة جديدة للتقدير القديم.'] },
    { param: ['γ (discount)', 'γ (الخصم)'], effect: ['How far-sighted the agent is. Low γ: it may not bother walking to a distant goal.', 'مدى بُعد نظر الوكيل. γ منخفض: قد لا يكترث بالسير إلى هدف بعيد.'] },
    { param: ['ε (exploration)', 'ε (الاستكشاف)'], effect: ['Probability of a random move. With decay, exploration fades as learning progresses.', 'احتمال الحركة العشوائية. ومع التخفيض يتلاشى الاستكشاف مع تقدم التعلّم.'] },
    { param: ['Grid editor', 'محرر الشبكة'], effect: ['Paint walls, pits and goals to create new problems.', 'ارسم الجدران والحفر والأهداف لإنشاء مسائل جديدة.'] },
  ],
  experiments: [
    ['In "Watch moves", step slowly and read each Q update.', 'في «شاهد الحركات» تقدّم ببطء واقرأ كل تحديث Q.'],
    ['Train 50 episodes, then watch values spread outward from the goal.', 'درّب 50 حلقة ثم شاهد انتشار القيم من الهدف.'],
    ['Set γ = 0.1: does the greedy path still reach the goal?', 'اجعل γ = 0.1: هل لا يزال المسار الجشع يصل إلى الهدف؟'],
    ['On "Cliff walk", compare the learned path with ε = 0.3 and ε = 0.05.', 'على «حافة الجرف» قارن المسار المتعلَّم مع ε = 0.3 وε = 0.05.'],
  ],
  evaluation: [
    r`Track the **return per episode** (and its moving average), **episode length**, and whether the **greedy policy** reaches the goal. In this deterministic grid the optimal path length is known, so you can verify the learned policy is optimal.`,
    r`تابع **العائد لكل حلقة** (ومتوسطه المتحرك)، و**طول الحلقة**، وما إذا كانت **السياسة الجشعة** تصل إلى الهدف. وفي هذه الشبكة الحتمية يكون طول المسار الأمثل معروفًا، فيمكنك التحقق من أن السياسة المتعلَّمة مثلى.`,
  ],
  advantages: [['Simple, model-free and provably convergent in tabular settings.', 'بسيط ولا يحتاج نموذجًا للبيئة ومتقارب رياضيًا في الحالة الجدولية.'], ['Learns the optimal policy even while exploring (off-policy).', 'يتعلّم السياسة المثلى حتى أثناء الاستكشاف (خارج السياسة).']],
  limitations: [['A table of Q-values does not scale to huge or continuous state spaces.', 'جدول قيم Q لا يتوسع إلى فضاءات حالات ضخمة أو مستمرة.'], ['Can be slow when rewards are sparse.', 'قد يكون بطيئًا عندما تكون المكافآت نادرة.']],
  mistakes: [['Never decaying ε, so the agent keeps behaving randomly.', 'عدم تخفيض ε أبدًا فيستمر الوكيل في التصرف العشوائي.'], ['Bootstrapping from terminal states.', 'التقدير الذاتي من الحالات النهائية.'], ['Confusing the learned value with the reward of a single step.', 'الخلط بين القيمة المتعلَّمة ومكافأة خطوة واحدة.']],
  python: `import numpy as np

n_states, n_actions = 25, 4
Q = np.zeros((n_states, n_actions))
alpha, gamma, epsilon = 0.5, 0.95, 0.2
rng = np.random.default_rng(1)

def step(s, a):
    """Environment: returns (next_state, reward, done). Implement your grid here."""
    ...

for episode in range(500):
    s, done = 0, False
    while not done:
        a = rng.integers(n_actions) if rng.random() < epsilon else int(np.argmax(Q[s]))
        s2, r, done = step(s, a)
        target = r + (0 if done else gamma * Q[s2].max())
        Q[s, a] += alpha * (target - Q[s, a])
        s = s2`,
  pythonNote: ['scikit-learn has no RL module; tabular Q-learning is usually written directly with NumPy (as above), often with environments from libraries such as Gymnasium. The lab runs exactly this update in TypeScript.', 'لا يحتوي scikit-learn على وحدة للتعلّم المعزّز؛ وعادةً يُكتب تعلّم Q الجدولي مباشرة بـNumPy (كما أعلاه)، غالبًا مع بيئات من مكتبات مثل Gymnasium. وينفذ المختبر هذا التحديث نفسه بلغة TypeScript.'],
  quiz: [
    qz(['In Q(s,a) ← Q(s,a) + α[r + γ max Q(s′,·) − Q(s,a)], the bracket is called…', 'في Q(s,a) ← Q(s,a) + α[r + γ max Q(s′,·) − Q(s,a)] يُسمى ما بين القوسين…'], [['The TD error', 'خطأ الفرق الزمني'], ['The policy', 'السياسة'], ['The discount', 'الخصم'], ['The return', 'العائد']], 0, ['It measures the surprise between the target and the current estimate.', 'يقيس المفاجأة بين الهدف والتقدير الحالي.']),
    qz(['With γ = 0 the agent…', 'مع γ = 0 فإن الوكيل…'], [['Only cares about the immediate reward', 'لا يهتم إلا بالمكافأة الفورية'], ['Values the far future most', 'يقدّر المستقبل البعيد أكثر'], ['Explores more', 'يستكشف أكثر'], ['Cannot learn', 'لا يستطيع التعلّم']], 0, ['All future terms are multiplied by zero.', 'كل الحدود المستقبلية تُضرب في صفر.']),
    qz(['Why is ε-greedy exploration needed?', 'لماذا نحتاج إلى استكشاف ε-الجشع؟'], [['To discover actions that might be better than the current best estimate', 'لاكتشاف إجراءات قد تكون أفضل من أفضل تقدير حالي'], ['To make training deterministic', 'لجعل التدريب حتميًا'], ['To reduce memory', 'لتقليل الذاكرة'], ['It is not needed', 'لا حاجة إليه']], 0, ['Without exploration, early lucky estimates are never questioned.', 'دون استكشاف لا يُعاد النظر أبدًا في التقديرات المحظوظة المبكرة.']),
  ],
  related: ['bandit', 'sarsa', 'dqn'],
  references: [
    { title: 'Sutton & Barto, Reinforcement Learning: An Introduction (2nd ed.), ch. 6', url: 'http://incompleteideas.net/book/the-book-2nd.html' },
    { title: 'Watkins & Dayan (1992), Q-learning, Machine Learning 8', url: 'https://doi.org/10.1007/BF00992698' },
  ],
  compare: {
    purpose: ['Learn an optimal policy from rewards (value-based, off-policy)', 'تعلّم سياسة مثلى من المكافآت (قائم على القيمة، خارج السياسة)'],
    data: RL_COMPARE_DATA,
    assumptions: ['Markov states; small discrete state/action spaces (tabular)', 'حالات ماركوفية؛ فضاءات حالات/إجراءات متقطعة صغيرة (جدولية)'],
    hyperparams: 'alpha, gamma, epsilon (+ decay), episodes',
  },
};

export const bandit: AlgorithmContent = {
  id: 'bandit',
  name: ['Exploration vs Exploitation (ε-greedy bandit)', 'الاستكشاف مقابل الاستغلال (قاطع الطريق ε-الجشع)'],
  short: ['A multi-armed bandit shows the core RL dilemma: try new options to learn, or use the best one known so far?', 'يوضح قاطع الطريق متعدد الأذرع المعضلة الأساسية في التعلّم المعزّز: هل تجرّب خيارات جديدة لتتعلّم، أم تستخدم أفضل خيار معروف حتى الآن؟'],
  paradigm: 'reinforcement',
  categories: ['reinforcement'],
  difficulty: 'beginner',
  labId: 'bandit',
  objectives: [
    ['Define exploration, exploitation and regret.', 'تعريف الاستكشاف والاستغلال والندم.'],
    ['Implement ε-greedy action selection with sample-average estimates.', 'تطبيق اختيار الإجراء بطريقة ε-الجشعة مع تقديرات متوسط العينات.'],
    ['Explain why both ε = 0 and ε = 1 perform poorly.', 'شرح لماذا يكون أداء كل من ε = 0 وε = 1 ضعيفًا.'],
  ],
  intuition: [
    r`You face five slot machines ("one-armed bandits"). Each pays a random amount around a hidden average. You want as much money as possible.

If you always play the machine that has paid best **so far** (**exploitation**), you may lock onto a mediocre machine that got lucky early. If you keep trying machines at random (**exploration**), you learn a lot but waste pulls on bad machines.

**ε-greedy** balances the two: with probability $\varepsilon$ pull a random arm, otherwise pull the arm with the highest estimated value. Estimates are simply the average reward observed from each arm.`,
    r`أمامك خمس آلات قمار («قطّاع طرق بذراع واحدة»). كل آلة تدفع مبلغًا عشوائيًا حول متوسط مخفي، وتريد جمع أكبر قدر ممكن من المال.

إذا لعبت دائمًا الآلة التي دفعت الأفضل **حتى الآن** (**الاستغلال**)، فقد تتمسك بآلة متوسطة حالفها الحظ مبكرًا. وإذا واصلت تجربة الآلات عشوائيًا (**الاستكشاف**)، فستتعلّم كثيرًا لكنك تهدر السحبات على آلات سيئة.

يوازن **ε-الجشع** بين الأمرين: باحتمال $\varepsilon$ اسحب ذراعًا عشوائية، وإلا اسحب الذراع ذات أعلى قيمة مقدَّرة. والتقديرات هي ببساطة متوسط المكافآت الملاحظة من كل ذراع.`,
  ],
  useCases: [['A/B testing and online experiments.', 'اختبارات A/B والتجارب عبر الإنترنت.'], ['Ad and news recommendation.', 'التوصية بالإعلانات والأخبار.'], ['Clinical trial design (adaptive allocation).', 'تصميم التجارب السريرية (التوزيع التكيفي).']],
  steps: [
    ['Set every estimate Q(a) = 0 and count N(a) = 0.', 'اجعل كل تقدير Q(a) = 0 والعدّاد N(a) = 0.'],
    ['With probability ε choose a random arm, otherwise the arm with the highest Q(a).', 'باحتمال ε اختر ذراعًا عشوائية، وإلا الذراع ذات أعلى Q(a).'],
    ['Pull it and observe reward r.', 'اسحبها ولاحظ المكافأة r.'],
    ['Update N(a) ← N(a) + 1 and Q(a) ← Q(a) + (r − Q(a)) / N(a).', 'حدّث N(a) ← N(a) + 1 وQ(a) ← Q(a) + (r − Q(a)) / N(a).'],
    ['Repeat.', 'كرّر.'],
  ],
  math: [
    r`Sample-average estimate, updated incrementally:

$$Q_{n+1}(a) = Q_n(a) + \frac{1}{N(a)}\big[r - Q_n(a)\big]$$

ε-greedy policy:

$$a_t = \begin{cases} \text{uniform random arm} & \text{with prob. } \varepsilon \\ \arg\max_a Q_t(a) & \text{with prob. } 1-\varepsilon\end{cases}$$

**Regret** after $T$ pulls measures lost reward: $\;\text{Regret}_T = T\mu^* - \sum_{t=1}^T \mu_{a_t}$, where $\mu^*$ is the best arm's true mean.`,
    r`تقدير متوسط العينات محدَّثًا تدريجيًا:

$$Q_{n+1}(a) = Q_n(a) + \frac{1}{N(a)}\big[r - Q_n(a)\big]$$

سياسة ε-الجشعة:

$$a_t = \begin{cases} \text{uniform random arm} & \text{with prob. } \varepsilon \\ \arg\max_a Q_t(a) & \text{with prob. } 1-\varepsilon\end{cases}$$

يقيس **الندم** بعد $T$ سحبة المكافأة المفقودة: $\;\text{Regret}_T = T\mu^* - \sum_{t=1}^T \mu_{a_t}$، حيث $\mu^*$ المتوسط الحقيقي لأفضل ذراع.`,
  ],
  labGuide: [
    { param: ['ε', 'ε'], effect: ['0 = always greedy, 1 = always random. Values around 0.05–0.2 usually work best.', '0 = جشع دائمًا، و1 = عشوائي دائمًا. القيم بين 0.05 و0.2 تعمل عادةً بشكل أفضل.'] },
    { param: ['Reward environment', 'بيئة المكافآت'], effect: ['Presets change how distinct and how noisy the arms are.', 'الإعدادات المسبقة تغيّر مدى تمايز الأذرع ومدى ضوضائها.'] },
    { param: ['Compare ε values', 'قارن قيم ε'], effect: ['Averages 200 independent runs per ε for a fair comparison.', 'يأخذ متوسط 200 تشغيل مستقل لكل ε لمقارنة عادلة.'] },
  ],
  experiments: [
    ['Run "Hidden gem" with ε = 0 several times (change the seed). How often is the best arm found?', 'شغّل «جوهرة مخفية» مع ε = 0 عدة مرات (غيّر البذرة). كم مرة تُكتشف الذراع الأفضل؟'],
    ['Set ε = 1: the estimates become accurate, but total reward stays low.', 'اجعل ε = 1: تصبح التقديرات دقيقة لكن مجموع المكافأة يبقى منخفضًا.'],
    ['Press "Run comparison" and find the ε with the highest long-run average reward.', 'اضغط «شغّل المقارنة» وجد قيمة ε صاحبة أعلى متوسط مكافأة على المدى الطويل.'],
  ],
  evaluation: [r`Average reward per step, percentage of optimal-arm pulls, cumulative reward and **regret**. Because outcomes are random, compare strategies averaged over many independent runs.`, r`متوسط المكافأة لكل خطوة، ونسبة سحب الذراع المثلى، والمكافأة التراكمية، و**الندم**. ولأن النتائج عشوائية قارن الاستراتيجيات بمتوسط تشغيلات مستقلة كثيرة.`],
  advantages: [['Extremely simple, with a clear knob for exploration.', 'بسيط جدًا مع مقبض واضح للاستكشاف.']],
  limitations: [['Explores uniformly, even arms already known to be bad.', 'يستكشف بشكل منتظم حتى الأذرع المعروف أنها سيئة.'], ['Constant ε keeps exploring forever (decay or UCB/Thompson sampling do better).', 'ε الثابتة تستمر في الاستكشاف للأبد (التخفيض أو UCB/عينات طومسون أفضل).']],
  mistakes: [['Judging a strategy from a single run.', 'الحكم على استراتيجية من تشغيل واحد.'], ['Breaking greedy ties always toward the first arm.', 'كسر تعادلات الاختيار الجشع دائمًا لصالح الذراع الأولى.']],
  python: `import numpy as np

def run(means, epsilon, steps=1000, sigma=1.0, seed=0):
    rng = np.random.default_rng(seed)
    k = len(means); Q = np.zeros(k); N = np.zeros(k); total = 0.0
    for t in range(steps):
        if rng.random() < epsilon:
            a = rng.integers(k)                              # explore
        else:
            a = rng.choice(np.flatnonzero(Q == Q.max()))     # exploit (random tie-break)
        r = rng.normal(means[a], sigma)
        N[a] += 1; Q[a] += (r - Q[a]) / N[a]
        total += r
    return total, Q

for eps in [0, 0.01, 0.1, 1]:
    print(eps, np.mean([run([2, 1.8, 2.2, 1.9, 3.6], eps, seed=s)[0] for s in range(200)]))`,
  pythonNote: ['Same algorithm as the lab: Gaussian rewards, sample-average estimates and uniform exploration.', 'الخوارزمية نفسها في المختبر: مكافآت غاوسية وتقديرات بمتوسط العينات واستكشاف منتظم.'],
  quiz: [
    qz(['With ε = 0 the agent…', 'مع ε = 0 فإن الوكيل…'], [['Never explores after the first estimates', 'لا يستكشف أبدًا بعد التقديرات الأولى'], ['Always explores', 'يستكشف دائمًا'], ['Chooses uniformly', 'يختار بشكل منتظم'], ['Finds the best arm for sure', 'يجد الذراع الأفضل بالتأكيد']], 0, ['It always repeats the current best estimate, which may be wrong.', 'يكرر دائمًا أفضل تقدير حالي، وقد يكون خاطئًا.']),
    qz(['Regret measures…', 'يقيس الندم…'], [['Reward lost compared with always playing the best arm', 'المكافأة المفقودة مقارنةً باللعب الدائم بالذراع الأفضل'], ['The number of arms', 'عدد الأذرع'], ['Estimation error of one arm', 'خطأ تقدير ذراع واحدة'], ['The value of ε', 'قيمة ε']], 0, ['Lower regret means less reward wasted on learning.', 'الندم الأقل يعني مكافأة أقل مهدورة على التعلّم.']),
    qz(['Why is ε = 1 a poor strategy?', 'لماذا تُعد ε = 1 استراتيجية ضعيفة؟'], [['It never uses what it learned', 'لأنه لا يستخدم ما تعلّمه أبدًا'], ['It cannot estimate values', 'لأنه لا يستطيع تقدير القيم'], ['It gets stuck on one arm', 'لأنه يعلق على ذراع واحدة'], ['It is too slow to compute', 'لأنه بطيء الحساب']], 0, ['Every pull is random, so the average reward equals the average of all arms.', 'كل سحبة عشوائية، لذا يساوي متوسط المكافأة متوسط كل الأذرع.']),
  ],
  related: ['q-learning', 'sarsa'],
  references: [{ title: 'Sutton & Barto, Reinforcement Learning: An Introduction (2nd ed.), ch. 2', url: 'http://incompleteideas.net/book/the-book-2nd.html' }, { title: 'Lattimore & Szepesvári, Bandit Algorithms', url: 'https://tor-lattimore.com/downloads/book/book.pdf' }],
  compare: {
    purpose: ['Balance exploration and exploitation in repeated choices', 'الموازنة بين الاستكشاف والاستغلال في الاختيارات المتكررة'],
    data: ['Repeated actions with stochastic rewards (single state)', 'إجراءات متكررة بمكافآت عشوائية (حالة واحدة)'],
    assumptions: ['Stationary reward distributions', 'توزيعات مكافآت ثابتة'],
    hyperparams: 'epsilon (and decay), initial estimates',
  },
};

export const sarsa: AlgorithmContent = {
  ...qLearning,
  id: 'sarsa',
  name: ['SARSA', 'SARSA'],
  short: ['An on-policy cousin of Q-learning that updates toward the action it will actually take next.', 'قريب لتعلّم Q ضمن السياسة، يحدّث نحو الإجراء الذي سيتخذه فعلًا في الخطوة التالية.'],
  labId: undefined,
  labGuide: undefined,
  experiments: undefined,
  objectives: [['Contrast on-policy (SARSA) with off-policy (Q-learning) learning.', 'المقارنة بين التعلّم ضمن السياسة (SARSA) وخارجها (تعلّم Q).'], ['Explain why SARSA learns safer paths near hazards.', 'شرح لماذا يتعلّم SARSA مسارات أكثر أمانًا قرب المخاطر.']],
  intuition: [
    r`The name lists what one update uses: **S**tate, **A**ction, **R**eward, next **S**tate, next **A**ction. Q-learning updates toward the *best* next action; SARSA updates toward the *next action it actually chooses*, including exploratory ones.

On a cliff walk, Q-learning learns the shortest path along the edge (and sometimes falls while exploring). SARSA "knows" it occasionally takes random steps, so it learns a safer path further from the cliff.`,
    r`الاسم يسرد ما يستخدمه التحديث الواحد: **الحالة** و**الإجراء** و**المكافأة** و**الحالة التالية** و**الإجراء التالي**. يحدّث تعلّم Q نحو *أفضل* إجراء تالٍ، بينما يحدّث SARSA نحو *الإجراء التالي الذي يختاره فعلًا* بما في ذلك الاستكشافي.

في مسار حافة الجرف يتعلّم تعلّم Q أقصر طريق بمحاذاة الحافة (ويسقط أحيانًا أثناء الاستكشاف)، أما SARSA «فيعلم» أنه يتخذ أحيانًا خطوات عشوائية، فيتعلّم مسارًا أكثر أمانًا بعيدًا عن الجرف.`,
  ],
  steps: [['Choose a from s with ε-greedy.', 'اختر a من s بطريقة ε-الجشعة.'], ['Take a; observe r and s′; choose a′ from s′ with ε-greedy.', 'نفّذ a؛ ولاحظ r وs′؛ واختر a′ من s′ بطريقة ε-الجشعة.'], ['Update Q(s,a) toward r + γQ(s′,a′).', 'حدّث Q(s,a) نحو r + γQ(s′,a′).'], ['Set s ← s′, a ← a′.', 'اجعل s ← s′ وa ← a′.']],
  math: [r`$$Q(s,a) \leftarrow Q(s,a) + \alpha\big[r + \gamma\,Q(s',a') - Q(s,a)\big]$$

where $a'$ is drawn from the same ε-greedy behaviour policy.`, r`$$Q(s,a) \leftarrow Q(s,a) + \alpha\big[r + \gamma\,Q(s',a') - Q(s,a)\big]$$

حيث يُسحب $a'$ من سياسة السلوك ε-الجشعة نفسها.`],
  advantages: [['Accounts for exploration risk; often more stable during learning.', 'يأخذ مخاطر الاستكشاف في الحسبان؛ وغالبًا أكثر ثباتًا أثناء التعلّم.']],
  limitations: [['Learns the value of the ε-greedy policy, not the optimal greedy one (unless ε → 0).', 'يتعلّم قيمة السياسة ε-الجشعة لا السياسة الجشعة المثلى (ما لم تقترب ε من 0).']],
  mistakes: [['Using max over next actions — that turns SARSA into Q-learning.', 'استخدام القيمة العظمى على الإجراءات التالية — فهذا يحوّل SARSA إلى تعلّم Q.']],
  python: `# One SARSA episode (NumPy), assuming step(s, a) -> (s2, r, done)
def choose(s):
    return rng.integers(n_actions) if rng.random() < epsilon else int(np.argmax(Q[s]))

s = 0; a = choose(s); done = False
while not done:
    s2, r, done = step(s, a)
    a2 = choose(s2)
    target = r + (0 if done else gamma * Q[s2, a2])   # uses the action actually chosen
    Q[s, a] += alpha * (target - Q[s, a])
    s, a = s2, a2`,
  pythonNote: ['Explanation page — the Q-learning lab’s grid world is designed to host a SARSA mode in a future release.', 'صفحة شرح — صُممت بيئة الشبكة في مختبر تعلّم Q لتستضيف نمط SARSA في إصدار لاحق.'],
  quiz: [qz(['SARSA is called on-policy because…', 'يُسمى SARSA ضمن السياسة لأن…'], [['It updates toward the action its behaviour policy actually takes', 'يحدّث نحو الإجراء الذي تتخذه سياسة سلوكه فعلًا'], ['It has no policy', 'ليس له سياسة'], ['It uses a neural network', 'يستخدم شبكة عصبية'], ['It ignores rewards', 'يتجاهل المكافآت']], 0, ['Q-learning instead uses the max, i.e. the greedy target policy.', 'أما تعلّم Q فيستخدم القيمة العظمى أي سياسة الهدف الجشعة.'])],
  related: ['q-learning', 'actor-critic'],
  references: [{ title: 'Sutton & Barto, Reinforcement Learning: An Introduction (2nd ed.), §6.4–6.5', url: 'http://incompleteideas.net/book/the-book-2nd.html' }],
  compare: { ...qLearning.compare, purpose: ['Value-based, on-policy control', 'تحكم قائم على القيمة ضمن السياسة'] },
};

export const dqn: AlgorithmContent = {
  ...qLearning,
  id: 'dqn',
  name: ['Deep Q-Networks (DQN)', 'شبكات Q العميقة (DQN)'],
  short: ['Replaces the Q-table with a neural network so Q-learning can handle huge state spaces such as game screens.', 'تستبدل جدول Q بشبكة عصبية ليتمكن تعلّم Q من التعامل مع فضاءات حالات ضخمة مثل شاشات الألعاب.'],
  difficulty: 'advanced',
  labId: undefined,
  labGuide: undefined,
  experiments: undefined,
  objectives: [['Explain function approximation for Q-values.', 'شرح تقريب الدوال لقيم Q.'], ['Describe experience replay and target networks.', 'وصف إعادة التجربة وشبكات الهدف.']],
  intuition: [
    r`A table cannot store a value for every possible screen of a video game. DQN uses a **neural network** $Q_\theta(s,a)$ that takes the state (e.g. pixels) and outputs a value for each action. Two tricks make training stable: **experience replay** (learn from random mini-batches of stored past transitions) and a **target network** (a slowly updated copy used to compute targets).`,
    r`لا يستطيع الجدول تخزين قيمة لكل شاشة ممكنة في لعبة فيديو. تستخدم DQN **شبكة عصبية** $Q_\theta(s,a)$ تأخذ الحالة (مثل البكسلات) وتُخرج قيمة لكل إجراء. وتجعل حيلتان التدريب مستقرًا: **إعادة التجربة** (التعلّم من دفعات صغيرة عشوائية من الانتقالات السابقة المخزنة) و**شبكة الهدف** (نسخة تُحدَّث ببطء تُستخدم لحساب الأهداف).`,
  ],
  steps: [['Act ε-greedily with the network; store (s, a, r, s′, done) in a replay buffer.', 'تصرّف بطريقة ε-الجشعة بالشبكة؛ وخزّن (s, a, r, s′, done) في ذاكرة إعادة.'], ['Sample a random mini-batch from the buffer.', 'اسحب دفعة صغيرة عشوائية من الذاكرة.'], ['Compute targets with the target network and minimise the squared TD error.', 'احسب الأهداف بشبكة الهدف وقلّل مربع خطأ الفرق الزمني.'], ['Periodically copy the online weights to the target network.', 'انسخ أوزان الشبكة الحية إلى شبكة الهدف دوريًا.']],
  math: [r`$$\mathcal L(\theta) = \mathbb E_{(s,a,r,s')\sim\mathcal D}\Big[\big(r + \gamma\max_{a'}Q_{\theta^-}(s',a') - Q_\theta(s,a)\big)^2\Big]$$

with target-network parameters $\theta^-$.`, r`$$\mathcal L(\theta) = \mathbb E_{(s,a,r,s')\sim\mathcal D}\Big[\big(r + \gamma\max_{a'}Q_{\theta^-}(s',a') - Q_\theta(s,a)\big)^2\Big]$$

حيث $\theta^-$ معاملات شبكة الهدف.`],
  advantages: [['Scales Q-learning to high-dimensional inputs (images).', 'يوسّع تعلّم Q إلى المدخلات عالية الأبعاد (الصور).']],
  limitations: [['Sample-hungry and sensitive to hyperparameters; overestimates values (addressed by Double DQN).', 'يحتاج عينات كثيرة وحساس للمعاملات؛ ويبالغ في تقدير القيم (يعالجه Double DQN).'], ['Discrete actions only.', 'إجراءات متقطعة فقط.']],
  mistakes: [['Training on consecutive, highly correlated transitions without replay.', 'التدريب على انتقالات متتالية شديدة الترابط دون إعادة.']],
  python: `# Sketch with PyTorch (third-party). Complete agents: e.g. Stable-Baselines3 DQN.
import torch, torch.nn as nn
q_net = nn.Sequential(nn.Linear(obs_dim, 128), nn.ReLU(), nn.Linear(128, n_actions))
target_net = nn.Sequential(nn.Linear(obs_dim, 128), nn.ReLU(), nn.Linear(128, n_actions))
target_net.load_state_dict(q_net.state_dict())

s, a, r, s2, done = replay_buffer.sample(64)          # tensors
with torch.no_grad():
    target = r + gamma * (1 - done) * target_net(s2).max(dim=1).values
q = q_net(s).gather(1, a.unsqueeze(1)).squeeze(1)
loss = nn.functional.mse_loss(q, target)`,
  pythonNote: ['Explanation page. Training a DQN needs a deep-learning framework and many interactions, so it is beyond the in-browser labs of this release.', 'صفحة شرح. يتطلب تدريب DQN إطار تعلّم عميق وتفاعلات كثيرة، لذا يتجاوز المختبرات داخل المتصفح في هذا الإصدار.'],
  quiz: [qz(['What is the purpose of experience replay?', 'ما الغرض من إعادة التجربة؟'], [['Break correlations between consecutive samples and reuse data', 'كسر الترابط بين العينات المتتالية وإعادة استخدام البيانات'], ['Increase ε', 'زيادة ε'], ['Store the policy', 'تخزين السياسة'], ['Render the game', 'عرض اللعبة']], 0, ['Random mini-batches look more like independent samples, which stabilises gradient descent.', 'الدفعات العشوائية الصغيرة أقرب إلى عينات مستقلة، مما يثبّت الانحدار التدرّجي.'])],
  related: ['q-learning', 'policy-gradient', 'actor-critic'],
  references: [{ title: 'Mnih et al. (2015), Human-level control through deep reinforcement learning (Nature)', url: 'https://doi.org/10.1038/nature14236' }],
  compare: { ...qLearning.compare, purpose: ['Value-based RL with neural function approximation', 'تعلّم معزّز قائم على القيمة بتقريب دوال عصبي'], assumptions: ['Discrete actions; lots of interaction data', 'إجراءات متقطعة؛ وبيانات تفاعل كثيرة'], hyperparams: 'network, replay size, batch, target update, epsilon schedule' },
};

export const policyGradient: AlgorithmContent = {
  ...qLearning,
  id: 'policy-gradient',
  name: ['Policy Gradient Methods', 'طرق تدرّج السياسة'],
  short: ['Learn the policy directly by nudging action probabilities in the direction that increases expected return.', 'تتعلّم السياسة مباشرة بدفع احتمالات الإجراءات في الاتجاه الذي يزيد العائد المتوقع.'],
  difficulty: 'advanced',
  labId: undefined,
  labGuide: undefined,
  experiments: undefined,
  objectives: [['Contrast value-based and policy-based RL.', 'المقارنة بين التعلّم المعزّز القائم على القيمة والقائم على السياسة.'], ['State the REINFORCE update.', 'صياغة تحديث REINFORCE.']],
  intuition: [
    r`Instead of learning values and deriving a policy, learn a **stochastic policy** $\pi_\theta(a\mid s)$ directly. After an episode, make the actions that led to high returns **more likely** and the others less likely. This works naturally with continuous actions (e.g. steering angles).`,
    r`بدل تعلّم القيم واشتقاق سياسة منها، تعلّم **سياسة عشوائية** $\pi_\theta(a\mid s)$ مباشرة. بعد كل حلقة اجعل الإجراءات التي قادت إلى عوائد عالية **أكثر احتمالًا** والبقية أقل احتمالًا. ويعمل ذلك بشكل طبيعي مع الإجراءات المستمرة (مثل زوايا التوجيه).`,
  ],
  steps: [['Run an episode with the current policy.', 'نفّذ حلقة بالسياسة الحالية.'], ['Compute the return Gₜ from each step.', 'احسب العائد Gₜ من كل خطوة.'], ['Increase log π(aₜ|sₜ) in proportion to Gₜ (minus a baseline).', 'زِد log π(aₜ|sₜ) بالتناسب مع Gₜ (مطروحًا منه خط أساس).']],
  math: [r`Policy gradient theorem (REINFORCE):

$$\nabla_\theta J(\theta) = \mathbb E_{\pi_\theta}\Big[\sum_t \nabla_\theta\log\pi_\theta(a_t\mid s_t)\,(G_t - b(s_t))\Big]$$

A baseline $b$ (often a value estimate) reduces variance without adding bias.`, r`مبرهنة تدرّج السياسة (REINFORCE):

$$\nabla_\theta J(\theta) = \mathbb E_{\pi_\theta}\Big[\sum_t \nabla_\theta\log\pi_\theta(a_t\mid s_t)\,(G_t - b(s_t))\Big]$$

يقلل خط الأساس $b$ (غالبًا تقدير للقيمة) التباين دون إضافة انحياز.`],
  advantages: [['Handles continuous actions and stochastic policies.', 'يتعامل مع الإجراءات المستمرة والسياسات العشوائية.']],
  limitations: [['High-variance gradient estimates; sample-inefficient.', 'تقديرات تدرّج عالية التباين؛ وكفاءة منخفضة في استخدام العينات.']],
  mistakes: [['Omitting a baseline, leading to very noisy learning.', 'إهمال خط الأساس مما يؤدي إلى تعلّم شديد الضوضاء.']],
  python: `# REINFORCE update for one episode (PyTorch sketch, third-party)
returns = compute_discounted_returns(rewards, gamma)            # G_t for each step
returns = (returns - returns.mean()) / (returns.std() + 1e-8)   # simple baseline / normalisation
loss = -(torch.stack(log_probs) * returns).sum()
optimizer.zero_grad(); loss.backward(); optimizer.step()`,
  pythonNote: ['Explanation page — requires gradient-trained policy networks; planned for a future interactive module.', 'صفحة شرح — يتطلب شبكات سياسة تُدرَّب بالتدرّج؛ ومخطط لوحدة تفاعلية مستقبلية.'],
  quiz: [qz(['Policy gradient methods learn…', 'تتعلّم طرق تدرّج السياسة…'], [['The policy parameters directly', 'معاملات السياسة مباشرة'], ['Only a Q-table', 'جدول Q فقط'], ['Cluster centroids', 'مراكز العناقيد'], ['A decision tree', 'شجرة قرار']], 0, ['They adjust π_θ by gradient ascent on expected return.', 'تعدّل π_θ بالصعود التدرّجي على العائد المتوقع.'])],
  related: ['actor-critic', 'dqn', 'q-learning'],
  references: [{ title: 'Williams (1992), Simple statistical gradient-following algorithms (REINFORCE)', url: 'https://doi.org/10.1007/BF00992696' }, { title: 'Sutton & Barto (2nd ed.), ch. 13', url: 'http://incompleteideas.net/book/the-book-2nd.html' }],
  compare: { ...qLearning.compare, purpose: ['Policy-based RL by gradient ascent', 'تعلّم معزّز قائم على السياسة بالصعود التدرّجي'], assumptions: ['Differentiable stochastic policy', 'سياسة عشوائية قابلة للاشتقاق'], hyperparams: 'learning rate, baseline, gamma, batch of episodes' },
};

export const actorCritic: AlgorithmContent = {
  ...policyGradient,
  id: 'actor-critic',
  name: ['Actor-Critic Methods', 'طرق الممثّل–الناقد'],
  short: ['Combine a policy (actor) with a learned value function (critic) that scores the actor’s choices.', 'تجمع بين سياسة (الممثّل) ودالة قيمة متعلَّمة (الناقد) تقيّم اختيارات الممثّل.'],
  objectives: [['Describe the actor and critic roles.', 'وصف دوري الممثّل والناقد.'], ['Explain the advantage signal.', 'شرح إشارة الأفضلية.']],
  intuition: [
    r`REINFORCE waits for the end of an episode and its returns are noisy. In actor-critic methods a **critic** learns a value function and judges each action immediately with the TD error ("better or worse than I expected?"). The **actor** (the policy) then updates in that direction. Modern algorithms such as A2C, PPO and SAC are actor-critic methods.`,
    r`ينتظر REINFORCE نهاية الحلقة وعوائده مشوّشة. أما في طرق الممثّل–الناقد فيتعلّم **الناقد** دالة قيمة ويحكم على كل إجراء فورًا بخطأ الفرق الزمني («أفضل أم أسوأ مما توقعت؟»). ثم يتحدّث **الممثّل** (السياسة) في هذا الاتجاه. والخوارزميات الحديثة مثل A2C وPPO وSAC كلها من طرق الممثّل–الناقد.`,
  ],
  steps: [['Actor picks a ~ π_θ(·|s); observe r, s′.', 'يختار الممثّل a ~ π_θ(·|s)؛ ولاحظ r وs′.'], ['Critic computes δ = r + γV(s′) − V(s).', 'يحسب الناقد δ = r + γV(s′) − V(s).'], ['Critic update: move V(s) toward the target.', 'تحديث الناقد: حرّك V(s) نحو الهدف.'], ['Actor update: θ ← θ + β δ ∇ log π_θ(a|s).', 'تحديث الممثّل: θ ← θ + β δ ∇ log π_θ(a|s).']],
  math: [r`$$\delta_t = r_{t+1} + \gamma V_w(s_{t+1}) - V_w(s_t)$$

$$w \leftarrow w + \alpha_w\delta_t\nabla_w V_w(s_t), \qquad \theta \leftarrow \theta + \alpha_\theta\,\delta_t\,\nabla_\theta\log\pi_\theta(a_t\mid s_t)$$

The TD error estimates the **advantage** $A(s,a) = Q(s,a) - V(s)$.`, r`$$\delta_t = r_{t+1} + \gamma V_w(s_{t+1}) - V_w(s_t)$$

$$w \leftarrow w + \alpha_w\delta_t\nabla_w V_w(s_t), \qquad \theta \leftarrow \theta + \alpha_\theta\,\delta_t\,\nabla_\theta\log\pi_\theta(a_t\mid s_t)$$

يقدّر خطأ الفرق الزمني **الأفضلية** $A(s,a) = Q(s,a) - V(s)$.`],
  advantages: [['Lower variance than pure policy gradients; learns online.', 'تباين أقل من تدرّج السياسة الخالص؛ ويتعلّم أثناء التفاعل.']],
  limitations: [['Two coupled learners can be unstable; more hyperparameters.', 'متعلّمان مترابطان قد يكونان غير مستقرين؛ ومعاملات أكثر.']],
  mistakes: [['Letting the actor learn faster than the critic can track.', 'ترك الممثّل يتعلّم أسرع مما يستطيع الناقد مواكبته.']],
  python: `# One actor-critic step (PyTorch sketch, third-party)
value, next_value = critic(s), critic(s2).detach()
delta = r + gamma * (1 - done) * next_value - value          # TD error ≈ advantage
critic_loss = delta.pow(2)
actor_loss = -actor.log_prob(s, a) * delta.detach()
(critic_loss + actor_loss).backward(); optimizer.step()`,
  quiz: [qz(['In actor-critic, the critic…', 'في طريقة الممثّل–الناقد، الناقد…'], [['Estimates values to evaluate the actor’s actions', 'يقدّر القيم لتقييم إجراءات الممثّل'], ['Chooses the actions', 'يختار الإجراءات'], ['Generates rewards', 'يولّد المكافآت'], ['Clusters the states', 'يجمّع الحالات']], 0, ['The actor chooses; the critic evaluates.', 'الممثّل يختار والناقد يقيّم.'])],
  related: ['policy-gradient', 'dqn', 'sarsa'],
  references: [{ title: 'Sutton & Barto (2nd ed.), §13.5 Actor–Critic Methods', url: 'http://incompleteideas.net/book/the-book-2nd.html' }, { title: 'Schulman et al. (2017), Proximal Policy Optimization (arXiv:1707.06347)', url: 'https://arxiv.org/abs/1707.06347' }],
  compare: { ...policyGradient.compare, purpose: ['Policy learning guided by a learned value function', 'تعلّم السياسة بتوجيه دالة قيمة متعلَّمة'], hyperparams: 'actor/critic learning rates, gamma, entropy bonus' },
};

export const REINFORCEMENT = [qLearning, bandit, sarsa, dqn, policyGradient, actorCritic];
