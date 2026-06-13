import { expect, test } from '@playwright/test';

test('public routes render without horizontal overflow', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/');
  await page.waitForTimeout(3_000);
  expect(errors).toEqual([]);
  await expect(page.getByRole('heading', { name: /take control of your time/i })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
  await expect(page.getByRole('button', { name: /start your journey/i })).toBeVisible();

  await page.goto('/auth');
  await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  expect(errors).toEqual([]);
});
