import { describe, expect, it } from 'vitest';
import { fingerprint } from '@/lib/fingerprint';

describe('fingerprint', () => {
  it('is stable and changes when source data changes', () => {
    expect(fingerprint({ a: 1, b: [2] })).toBe(fingerprint({ a: 1, b: [2] }));
    expect(fingerprint({ a: 1 })).not.toBe(fingerprint({ a: 2 }));
  });
});
