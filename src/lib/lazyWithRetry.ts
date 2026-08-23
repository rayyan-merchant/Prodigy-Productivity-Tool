import { lazy, type ComponentType } from 'react';

const RETRY_WINDOW_MS = 60_000;

export const isLazyLoadError = (error: unknown) =>
  error instanceof Error && /failed to fetch dynamically imported module|importing a module script failed|chunkloaderror/i.test(error.message);

/** Reloads once when a deployment replaces a hashed lazy chunk held by an older tab. */
export const lazyWithRetry = <T extends ComponentType<never>>(
  loader: () => Promise<{ default: T }>,
) => lazy(async () => {
  try {
    return await loader();
  } catch (error) {
    const retryKey = `prodigy:lazy-retry:${window.location.pathname}`;
    const lastRetry = Number(sessionStorage.getItem(retryKey) || 0);
    if (isLazyLoadError(error) && Date.now() - lastRetry > RETRY_WINDOW_MS) {
      sessionStorage.setItem(retryKey, String(Date.now()));
      window.location.reload();
      return new Promise<never>(() => undefined);
    }
    throw error;
  }
});
