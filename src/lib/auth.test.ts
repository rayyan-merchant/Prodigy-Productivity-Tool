import type { Session } from '@supabase/supabase-js';
import { afterEach, describe, expect, it } from 'vitest';
import { isEmailVerified, setCurrentAuthSession } from './auth';

describe('isEmailVerified', () => {
  afterEach(() => setCurrentAuthSession(null));

  it('is false without an authenticated user', () => {
    setCurrentAuthSession(null);
    expect(isEmailVerified()).toBe(false);
  });

  it('only returns true for a confirmed email', () => {
    setCurrentAuthSession({ user: { id: 'qa-user', email_confirmed_at: null } } as unknown as Session);
    expect(isEmailVerified()).toBe(false);

    setCurrentAuthSession({ user: { id: 'qa-user', email_confirmed_at: '2026-08-23T00:00:00.000Z' } } as unknown as Session);
    expect(isEmailVerified()).toBe(true);
  });
});
