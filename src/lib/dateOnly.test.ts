import { describe, expect, it } from 'vitest';
import { formatDateOnly, nextRecurringDate, normalizeDateOnly, parseLocalDate } from '@/lib/dateOnly';

describe('date-only utilities', () => {
  it('does not reinterpret a date-only value through UTC', () => {
    expect(normalizeDateOnly('2026-06-12')).toBe('2026-06-12');
    expect(parseLocalDate('2026-06-12').getDate()).toBe(12);
    expect(formatDateOnly('2026-06-12')).not.toContain('11');
  });

  it('calculates recurrence using calendar dates', () => {
    expect(nextRecurringDate('2026-06-12', 'daily')).toBe('2026-06-13');
    expect(nextRecurringDate('2026-06-12', 'weekly')).toBe('2026-06-19');
    expect(nextRecurringDate('2026-01-31', 'monthly')).toMatch(/^2026-0[23]-/);
  });
});
