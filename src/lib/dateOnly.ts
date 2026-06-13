const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const toLocalDateKey = (date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const normalizeDateOnly = (value?: string | null): string | undefined => {
  if (!value) return undefined;
  if (DATE_ONLY_PATTERN.test(value)) return value;
  const prefix = value.slice(0, 10);
  return DATE_ONLY_PATTERN.test(prefix) ? prefix : undefined;
};

export const parseLocalDate = (value: string): Date => {
  const normalized = normalizeDateOnly(value);
  if (!normalized) throw new Error('Invalid date');
  const [year, month, day] = normalized.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const formatDateOnly = (
  value?: string | null,
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' },
): string => {
  const normalized = normalizeDateOnly(value);
  return normalized ? parseLocalDate(normalized).toLocaleDateString(undefined, options) : 'No due date';
};

export const isPastDateOnly = (value: string, today = toLocalDateKey()): boolean =>
  value < today;

export const nextRecurringDate = (
  value: string,
  recurrence: 'daily' | 'weekly' | 'monthly',
): string => {
  const date = parseLocalDate(value);
  if (recurrence === 'daily') date.setDate(date.getDate() + 1);
  if (recurrence === 'weekly') date.setDate(date.getDate() + 7);
  if (recurrence === 'monthly') date.setMonth(date.getMonth() + 1);
  return toLocalDateKey(date);
};

export const startOfLocalDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

