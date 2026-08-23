import { defineConfig } from '@playwright/test';
import './tests/e2e/qa-env';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.authenticated.spec.ts',
  fullyParallel: false,
  forbidOnly: true,
  use: {
    baseURL: process.env.QA_BASE_URL || 'https://prodigy-mu.vercel.app',
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
  projects: [{ name: 'production-qa', use: { browserName: 'chromium', viewport: { width: 1440, height: 900 } } }],
});
