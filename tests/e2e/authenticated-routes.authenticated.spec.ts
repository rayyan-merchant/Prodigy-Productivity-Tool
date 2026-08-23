import { expect, test } from '@playwright/test';
import { qa, qaConfigured } from './qa-env';

test.skip(!qaConfigured, 'Requires ignored local QA credentials.');

const signIn = async (page: import('@playwright/test').Page) => {
  await page.goto('/auth');
  await page.getByLabel('Email').fill(qa.userA.email);
  await page.getByLabel('Password').fill(qa.userA.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
};

test('authenticated session persists, protected routes are guarded, and logout revokes browser access', async ({ page }) => {
  const unexpected: string[] = [];
  page.on('pageerror', () => unexpected.push('pageerror'));

  await signIn(page);
  await page.reload();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto('/tasks');
  await expect(page.getByRole('heading', { name: 'Tasks', exact: true })).toBeVisible();

  await page.locator('button').filter({ has: page.locator('[class*="avatar"]') }).click();
  await page.getByRole('menuitem', { name: /log out/i }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/auth$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/auth$/);
  expect(unexpected).toEqual([]);
});
