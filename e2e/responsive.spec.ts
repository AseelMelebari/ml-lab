import { expect, test } from '@playwright/test';

const PAGES = ['/', '/learn/features-labels', '/algorithms', '/algorithms/svm', '/labs/k-means', '/labs/q-learning', '/evaluation/classification', '/roadmap', '/practice', '/compare'];

for (const lang of ['en', 'ar'] as const) {
  test(`no horizontal page overflow on a phone (${lang})`, async ({ page }) => {
    await page.addInitScript((l) => localStorage.setItem('mllab.lang', l), lang);
    for (const path of PAGES) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${path} (${lang})`).toBeLessThanOrEqual(1);
    }
  });
}

test('mobile menu opens and navigates', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.locator('#mobile-nav').getByRole('link', { name: 'Practice' }).click();
  await expect(page).toHaveURL(/\/practice$/);
});
