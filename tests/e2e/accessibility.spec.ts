import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('public landing and authentication pages have no serious accessibility violations', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('prodigy-intro-shown', 'true'));
  for (const route of ['/', '/auth']) {
    await page.goto(route);
    await expect(page.getByRole('main').or(page.getByRole('heading').first())).toBeVisible();
    if (route === '/') {
      await page.waitForFunction(() => {
        const button = [...document.querySelectorAll('button')]
          .find((element) => element.textContent?.includes('Start your Journey'));
        return button?.parentElement && getComputedStyle(button.parentElement).opacity === '1';
      });
    }
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    const seriousViolations = results.violations.filter((violation) => ['critical', 'serious'].includes(violation.impact ?? ''));
    const details = seriousViolations.map((violation) => ({
      id: violation.id,
      nodes: violation.nodes.map((node) => node.html),
    }));
    expect(seriousViolations, `${route}: ${JSON.stringify(details)}`).toEqual([]);
  }
});
