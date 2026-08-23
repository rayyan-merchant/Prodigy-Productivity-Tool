import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const loadEnvironmentFile = (path: string) => {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
};

// This file is intentionally not added to Git. Values are read only into the
// Playwright process and are never written to reports, traces, or assertions.
loadEnvironmentFile(resolve(process.cwd(), '.env'));
loadEnvironmentFile(resolve(process.cwd(), '.qa.local'));

export const qaConfigured = Boolean(
  process.env.QA_USER_A_EMAIL
  && process.env.QA_USER_A_PASSWORD
  && process.env.QA_USER_B_EMAIL
  && process.env.QA_USER_B_PASSWORD
  && process.env.VITE_SUPABASE_URL
  && process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
);

export const qa = {
  baseUrl: process.env.QA_BASE_URL || 'https://prodigy-mu.vercel.app',
  supabaseUrl: process.env.VITE_SUPABASE_URL || '',
  publishableKey: process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
  userA: { email: process.env.QA_USER_A_EMAIL || '', password: process.env.QA_USER_A_PASSWORD || '' },
  userB: { email: process.env.QA_USER_B_EMAIL || '', password: process.env.QA_USER_B_PASSWORD || '' },
};
