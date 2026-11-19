import { describe, expect, it, beforeEach } from 'vitest';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp, renderWithProviders } from './utils';
import { progress } from '@/progress/store';
import { Quiz, scoreQuiz } from '@/components/learning/Quiz';
import type { QuizQuestion } from '@/content/types';

beforeEach(() => {
  localStorage.clear();
  progress.reload();
  document.documentElement.dir = 'ltr';
  document.documentElement.lang = 'en';
  document.documentElement.classList.remove('presenting');
});

describe('language switching & RTL', () => {
  it('switches to Arabic, sets dir=rtl and persists the choice', async () => {
    renderApp('/');
    expect(document.documentElement.dir).toBe('ltr');
    fireEvent.click(screen.getByTestId('lang-toggle'));
    await waitFor(() => expect(document.documentElement.dir).toBe('rtl'));
    expect(document.documentElement.lang).toBe('ar');
    expect(localStorage.getItem('mllab.lang')).toBe('ar');
    expect(screen.getAllByText('الخوارزميات').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByTestId('lang-toggle'));
    await waitFor(() => expect(document.documentElement.dir).toBe('ltr'));
  });

  it('renders Arabic content on an algorithm page', async () => {
    renderApp('/algorithms/knn', 'ar');
    expect(await screen.findByRole('heading', { level: 1, name: /أقرب K جيران/ })).toBeInTheDocument();
  });

  it('theme toggle switches the dark class and persists', () => {
    renderApp('/');
    const before = document.documentElement.classList.contains('dark');
    fireEvent.click(screen.getByTestId('theme-toggle'));
    expect(document.documentElement.classList.contains('dark')).toBe(!before);
    expect(localStorage.getItem('mllab.theme')).toBe(before ? 'light' : 'dark');
  });
});

describe('navigation', () => {
  it.each([
    ['/learn', /Machine Learning fundamentals/],
    ['/paradigms', /Five ways a machine can learn/],
    ['/algorithms', /Algorithm library/],
    ['/labs', /12 working simulations/],
    ['/evaluation/validation', /k-fold cross-validation \(KNN on 100 points\)/],
    ['/compare', /Algorithm comparison/],
    ['/roadmap', /Your path through Machine Learning/],
    ['/practice', /Test yourself/],
    ['/instructor', /Teach Machine Learning live/],
    ['/about', /Interactive Machine Learning Academy/],
    ['/no-such-page', /Page not found/],
  ])('%s renders', async (path, heading) => {
    renderApp(path);
    expect(await screen.findByText(heading, {}, { timeout: 4000 })).toBeInTheDocument();
  });

  it('algorithm library filters by paradigm and lab availability', async () => {
    renderApp('/algorithms?paradigm=reinforcement');
    await screen.findByText(/Algorithm library/);
    expect(screen.getByText('6 algorithms')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Interactive lab only' }));
    expect(await screen.findByText('2 algorithms')).toBeInTheDocument();
  });

  it('explanation pages are clearly marked as not interactive', async () => {
    renderApp('/algorithms/dbscan');
    expect(await screen.findByText(/Planned interactive module/)).toBeInTheDocument();
  });
});

const QS: QuizQuestion[] = [
  { q: ['1+1?', '1+1؟'], options: [['2', '2'], ['3', '3']], answer: 0, explain: ['basic', 'أساسي'] },
  { q: ['2+2?', '2+2؟'], options: [['5', '5'], ['4', '4']], answer: 1, explain: ['basic', 'أساسي'] },
];

describe('quizzes', () => {
  it('scoreQuiz counts correct answers', () => {
    expect(scoreQuiz(QS, [0, 1])).toBe(2);
    expect(scoreQuiz(QS, [1, 1])).toBe(1);
    expect(scoreQuiz(QS, [null, null])).toBe(0);
  });

  it('scores the quiz, gives feedback and records progress', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Quiz id="test-quiz" questions={QS} />);
    const submit = screen.getByRole('button', { name: 'Check answers' });
    expect(submit).toBeDisabled();
    await user.click(screen.getByLabelText('2'));
    await user.click(screen.getByLabelText('5'));
    expect(submit).toBeEnabled();
    await user.click(submit);
    expect(screen.getByTestId('quiz-score')).toHaveTextContent('1 / 2');
    expect(progress.get().quizzes['test-quiz']).toMatchObject({ score: 1, total: 2, best: 1, attempts: 1 });
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    await user.click(screen.getByLabelText('2'));
    await user.click(screen.getByLabelText('4'));
    await user.click(screen.getByRole('button', { name: 'Check answers' }));
    expect(progress.get().quizzes['test-quiz']).toMatchObject({ score: 2, best: 2, attempts: 2 });
  });
});

describe('progress store', () => {
  it('records visits, completion and lab events and persists them', () => {
    progress.markVisited('learn:x');
    progress.setCompleted('learn:x', true);
    progress.recordLab('svm', 'trained');
    progress.recordLab('svm', 'trained');
    const saved = JSON.parse(localStorage.getItem('mllab.progress.v1')!);
    expect(saved.completed['learn:x']).toBeTypeOf('number');
    expect(saved.labs.svm).toEqual(['trained']);
    progress.setCompleted('learn:x', false);
    expect(progress.get().completed['learn:x']).toBeUndefined();
    progress.reset();
    expect(progress.get().visited).toEqual({});
  });

  it('survives corrupted storage', () => {
    localStorage.setItem('mllab.progress.v1', '{not json');
    progress.reload();
    expect(progress.get()).toEqual({ visited: {}, completed: {}, quizzes: {}, labs: {} });
  });

  it('mark-complete toggle on a lesson updates the roadmap state', async () => {
    renderApp('/learn/what-is-ml');
    const toggle = await screen.findByTestId('complete-toggle');
    fireEvent.click(toggle);
    expect(progress.get().completed['learn:what-is-ml']).toBeDefined();
    expect(progress.get().visited['learn:what-is-ml']).toBeDefined();
  });
});

describe('Instructor Mode', () => {
  it('renders a demo in presentation layout and navigates between demos', async () => {
    renderApp('/instructor/linreg-learn');
    expect(await screen.findByTestId('instructor-demo')).toBeInTheDocument();
    expect(document.documentElement.classList.contains('presenting')).toBe(true);
    expect(screen.getByRole('heading', { level: 1, name: 'Watching Linear Regression learn' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next demo' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Changing K in KNN' })).toBeInTheDocument();
    // The real lab is mounted, not a placeholder.
    expect(await screen.findByText(/Distance calculations/, {}, { timeout: 4000 })).toBeInTheDocument();
  });
});

describe('labs', () => {
  it('linear regression lab steps gradient descent and resets data', async () => {
    renderApp('/labs/linear-regression');
    const step = await screen.findByRole('button', { name: 'Step' }, { timeout: 4000 });
    expect(screen.getByText(/MSE · Iteration 0/)).toBeInTheDocument();
    fireEvent.click(step);
    fireEvent.click(step);
    expect(screen.getByText(/MSE · Iteration 2/)).toBeInTheDocument();
    expect(progress.get().labs['linear-regression']).toContain('trained');
    // dataset reset regenerates the configured number of points
    fireEvent.click(screen.getByRole('button', { name: 'Reset data' }));
    expect(screen.getByText('30/120')).toBeInTheDocument();
    expect(screen.getByText(/MSE · Iteration 0/)).toBeInTheDocument();
  });

  it('accessible data table edits and removes points', async () => {
    renderApp('/labs/linear-regression');
    const toggle = await screen.findByRole('button', { name: /Show data table/ }, { timeout: 4000 });
    fireEvent.click(toggle);
    fireEvent.click(screen.getByRole('button', { name: 'Remove #1' }));
    expect(screen.getByText('29/120')).toBeInTheDocument();
    const x2 = screen.getByLabelText('x #2') as HTMLInputElement;
    fireEvent.change(x2, { target: { value: 'abc' } });
    expect(Number.isFinite(Number(x2.value))).toBe(true);
  });

  it('SVM lab trains and reports support vectors', async () => {
    renderApp('/labs/svm');
    expect(await screen.findByText(/KKT satisfied/, {}, { timeout: 4000 })).toBeInTheDocument();
  });

  it('bandit lab pulls arms and updates totals', async () => {
    renderApp('/labs/bandit');
    const pull = await screen.findByRole('button', { name: 'Pull once' }, { timeout: 4000 });
    act(() => {
      fireEvent.click(pull);
      fireEvent.click(pull);
    });
    const stat = screen.getByText('Pulls').parentElement!;
    expect(within(stat).getByText('2')).toBeInTheDocument();
  });
});
