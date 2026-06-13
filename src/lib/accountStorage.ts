const ACCOUNT_PREFIX = 'prodigy:account';
const LEGACY_ACCOUNT_KEYS = [
  'lastLoginDate',
  'loginStreak',
  'dashboard-widget-layout',
  'focus-music-active',
  'focus-music-volume',
  'pomodoro-sound-theme',
  'pomodoro-sound-volume',
  'pomodoro-sound-enabled',
  'pomodoro-focus-type',
  'pomodoro-custom-focus',
  'pomodoro-session-notes',
  'taskViewMode',
  'recently-used-tags',
  'notifications-enabled',
  'water-last-reminder',
] as const;

export const accountStorageKey = (userId: string, key: string) =>
  `${ACCOUNT_PREFIX}:${userId}:${key}`;

export const getAccountStorage = <T>(userId: string, key: string, fallback: T): T => {
  try {
    const value = localStorage.getItem(accountStorageKey(userId, key));
    return value === null ? fallback : JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export const setAccountStorage = (userId: string, key: string, value: unknown) => {
  localStorage.setItem(accountStorageKey(userId, key), JSON.stringify(value));
};

export const removeAccountStorage = (userId: string, key: string) => {
  localStorage.removeItem(accountStorageKey(userId, key));
};

export const clearAccountStorage = (userId: string) => {
  const prefix = `${ACCOUNT_PREFIX}:${userId}:`;
  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);
    if (key?.startsWith(prefix)) localStorage.removeItem(key);
  }
};

export const persistLegacyAccountStorage = (userId: string) => {
  for (const key of LEGACY_ACCOUNT_KEYS) {
    const value = localStorage.getItem(key);
    if (value === null) removeAccountStorage(userId, `legacy:${key}`);
    else setAccountStorage(userId, `legacy:${key}`, value);
  }
};

export const switchLegacyAccountStorage = (previousUserId?: string, nextUserId?: string) => {
  if (previousUserId && previousUserId === nextUserId) return;
  if (previousUserId && previousUserId !== nextUserId) {
    persistLegacyAccountStorage(previousUserId);
  }
  for (const key of LEGACY_ACCOUNT_KEYS) localStorage.removeItem(key);
  if (!nextUserId) return;

  for (const key of LEGACY_ACCOUNT_KEYS) {
    const value = getAccountStorage<string | null>(nextUserId, `legacy:${key}`, null);
    if (value !== null) localStorage.setItem(key, value);
  }
};

export const clearPrivateCaches = async () => {
  if (!('caches' in window)) return;
  const names = await caches.keys();
  await Promise.all(
    names
      .filter((name) => name.includes('supabase') || name.includes('html-cache'))
      .map((name) => caches.delete(name)),
  );
};
