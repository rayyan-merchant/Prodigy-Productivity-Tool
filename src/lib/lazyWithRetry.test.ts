import { describe, expect, it } from 'vitest';
import { isLazyLoadError } from './lazyWithRetry';

describe('isLazyLoadError', () => {
  it('recognizes stale hashed-chunk failures and ignores unrelated errors', () => {
    expect(isLazyLoadError(new Error('Failed to fetch dynamically imported module: /assets/Dashboard-old.js'))).toBe(true);
    expect(isLazyLoadError(new Error('Network request failed'))).toBe(false);
  });
});
