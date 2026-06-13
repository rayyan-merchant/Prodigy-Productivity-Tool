import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearAccountStorage,
  persistLegacyAccountStorage,
  switchLegacyAccountStorage,
} from '@/lib/accountStorage';

describe('account-scoped browser state', () => {
  beforeEach(() => localStorage.clear());

  it('restores legacy preferences only for the active account', () => {
    localStorage.setItem('taskViewMode', 'kanban');
    switchLegacyAccountStorage('user-a', 'user-b');
    expect(localStorage.getItem('taskViewMode')).toBeNull();

    localStorage.setItem('taskViewMode', 'list');
    switchLegacyAccountStorage('user-b', 'user-a');
    expect(localStorage.getItem('taskViewMode')).toBe('kanban');
  });

  it('removes account state when the account cache is cleared', () => {
    localStorage.setItem('pomodoro-focus-type', 'Study');
    persistLegacyAccountStorage('user-a');
    clearAccountStorage('user-a');
    switchLegacyAccountStorage(undefined, 'user-a');
    expect(localStorage.getItem('pomodoro-focus-type')).toBeNull();
  });
});
