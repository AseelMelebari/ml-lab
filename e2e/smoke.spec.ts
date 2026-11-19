import { expect, test } from '@playwright/test';

test('home page loads with live preview and navigation', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('ML LAB');
  await expect(page.getByRole('img', { name: /Live K-nearest-neighbours/ })).toBeVisible();
  await page.getByRole('link', { name: 'Explore algorithms' }).click();
  await expect(page).toHaveURL(/\/algorithms$/);
  expect(errors).toEqual([]);
});

test('switching to Arabic flips the layout to RTL and persists after reload', async ({ page }) => {
  await page.goto('/learn');
  await page.getByTestId('lang-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('أساسيات تعلّم الآلة');
});

test('linear regression lab: adding a point and training changes the model', async ({ page }) => {
  await page.goto('/labs/linear-regression');
  await expect(page.getByText('30/120')).toBeVisible();
  const plot = page.getByTestId('plot-area').first();
  await plot.click({ position: { x: 80, y: 60 } });
  await expect(page.getByText('31/120')).toBeVisible();
  await page.getByRole('button', { name: 'Play' }).first().click();
  await expect(page.getByText(/MSE · Iteration [1-9]/)).toBeVisible();
  await page.getByRole('button', { name: 'Pause' }).first().click();
});

test('q-learning: 100 training episodes produce a greedy policy that reaches the goal', async ({ page }) => {
  await page.goto('/labs/q-learning');
  await page.getByRole('button', { name: '+50 episodes' }).click();
  await page.getByRole('button', { name: '+50 episodes' }).click();
  await expect(page.getByText('reaches the goal')).toBeVisible();
});

test('quiz submission shows a score', async ({ page }) => {
  await page.goto('/algorithms/k-means#quiz');
  const quiz = page.getByTestId('quiz-algo:k-means');
  await expect(quiz.locator('fieldset')).toHaveCount(3);
  for (const fs of await quiz.locator('fieldset').all()) await fs.locator('input[type=radio]').first().check();
  await quiz.getByRole('button', { name: 'Check answers' }).click();
  await expect(quiz.getByTestId('quiz-score')).toContainText('/ 3');
});

test('instructor mode: keyboard navigation between demos', async ({ page }) => {
  await page.goto('/instructor/kmeans-move');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('K-Means centroid movement');
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Demonstrating PCA projections');
  await expect(page.locator('html')).toHaveClass(/presenting/);
});

test('all labs render without runtime errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  for (const id of ['linear-regression', 'logistic-regression', 'knn', 'decision-tree', 'random-forest', 'svm', 'naive-bayes', 'k-means', 'pca', 'hierarchical', 'q-learning', 'bandit']) {
    await page.goto(`/labs/${id}`);
    await expect(page.getByRole('complementary', { name: 'Lab controls' }).first()).toBeVisible();
  }
  expect(errors).toEqual([]);
});
