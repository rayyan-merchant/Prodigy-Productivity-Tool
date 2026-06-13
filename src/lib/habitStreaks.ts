import { parseLocalDate, toLocalDateKey } from '@/lib/dateOnly';
import type { Habit } from '@/types/habits';

const dayBefore = (dateKey: string): string => {
  const date = parseLocalDate(dateKey);
  date.setDate(date.getDate() - 1);
  return toLocalDateKey(date);
};

export const isoWeekStart = (dateKey: string): string => {
  const date = parseLocalDate(dateKey);
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  return toLocalDateKey(date);
};

const previousWeek = (weekStart: string): string => {
  const date = parseLocalDate(weekStart);
  date.setDate(date.getDate() - 7);
  return toLocalDateKey(date);
};

export const calculateHabitStreaks = (
  dates: string[],
  frequency: Habit['frequency'],
  today = toLocalDateKey(),
) => {
  const periods = [...new Set(dates.map((date) => frequency === 'daily' ? date : isoWeekStart(date)))].sort();
  if (periods.length === 0) return { current: 0, best: 0 };

  const previousPeriod = frequency === 'daily' ? dayBefore : previousWeek;
  let best = 1;
  let run = 1;
  for (let index = 1; index < periods.length; index += 1) {
    run = periods[index - 1] === previousPeriod(periods[index]) ? run + 1 : 1;
    best = Math.max(best, run);
  }

  const currentPeriod = frequency === 'daily' ? today : isoWeekStart(today);
  const latest = periods[periods.length - 1];
  const anchor = latest === currentPeriod ? currentPeriod : previousPeriod(currentPeriod);
  if (latest !== anchor) return { current: 0, best };

  let current = 1;
  let cursor = latest;
  for (let index = periods.length - 2; index >= 0; index -= 1) {
    cursor = previousPeriod(cursor);
    if (periods[index] !== cursor) break;
    current += 1;
  }
  return { current, best };
};
