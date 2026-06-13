import { describe, expect, it } from 'vitest';
import { calculateHabitStreaks, isoWeekStart } from '@/lib/habitStreaks';

describe('habit streaks', () => {
  it('calculates consecutive daily streaks and keeps the best historical run', () => {
    expect(calculateHabitStreaks(
      ['2026-06-07', '2026-06-08', '2026-06-10', '2026-06-11', '2026-06-12'],
      'daily',
      '2026-06-12',
    )).toEqual({ current: 3, best: 3 });
  });

  it('counts one completion per ISO week and allows a current or previous-week anchor', () => {
    expect(isoWeekStart('2026-06-12')).toBe('2026-06-08');
    expect(calculateHabitStreaks(
      ['2026-05-29', '2026-06-03', '2026-06-09', '2026-06-12'],
      'weekly',
      '2026-06-12',
    )).toEqual({ current: 3, best: 3 });
  });

  it('resets the current streak when the latest period is stale', () => {
    expect(calculateHabitStreaks(['2026-05-01', '2026-05-02'], 'daily', '2026-06-12'))
      .toEqual({ current: 0, best: 2 });
  });
});
