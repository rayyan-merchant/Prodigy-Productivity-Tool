import { expect, request, test } from '@playwright/test';
import { qa, qaConfigured } from './qa-env';

test.skip(!qaConfigured, 'Requires ignored local QA credentials.');

type Identity = { accessToken: string; id: string };
type Created = { table: string; id: string };

const headers = (token: string, representation = false) => ({
  apikey: qa.publishableKey,
  Authorization: `Bearer ${token}`,
  ...(representation ? { Prefer: 'return=representation' } : {}),
});

const signIn = async (email: string, password: string): Promise<Identity> => {
  const api = await request.newContext();
  const response = await api.post(`${qa.supabaseUrl}/auth/v1/token?grant_type=password`, {
    headers: { apikey: qa.publishableKey },
    data: { email, password },
  });
  expect(response.ok()).toBe(true);
  const body = await response.json() as { access_token: string; user: { id: string } };
  await api.dispose();
  return { accessToken: body.access_token, id: body.user.id };
};

test('RLS prevents cross-user reads, updates, deletes, and spoofed ownership', async () => {
  const api = await request.newContext();
  const [a, b] = await Promise.all([signIn(qa.userA.email, qa.userA.password), signIn(qa.userB.email, qa.userB.password)]);
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const created: Created[] = [];
  const add = async (table: string, data: Record<string, unknown>) => {
    const response = await api.post(`${qa.supabaseUrl}/rest/v1/${table}`, { headers: headers(a.accessToken, true), data });
    expect(response.ok()).toBe(true);
    const rows = await response.json() as Array<{ id: string }>;
    expect(rows).toHaveLength(1);
    created.push({ table, id: rows[0].id });
    return rows[0].id;
  };

  try {
    const taskId = await add('tasks', { user_id: a.id, title: `QA-RLS-${suffix}` });
    const habitId = await add('habits', { user_id: a.id, title: `QA-RLS-Habit-${suffix}` });
    const completionId = await add('habit_completions', { user_id: a.id, habit_id: habitId, completed_on: '2026-08-24' });
    const noteId = await add('notes', { user_id: a.id, title: `QA-RLS-Note-${suffix}` });
    const goalId = await add('goals', { user_id: a.id, title: `QA-RLS-Goal-${suffix}`, target_value: 1, unit: 'session' });
    const sessionId = await add('pomodoro_sessions', { user_id: a.id, duration: 1, type: 'focus', completed: true });
    const waterId = await add('water_intake', { user_id: a.id, amount_ml: 250 });
    const rows = [
      { table: 'tasks', id: taskId, update: { title: `QA-Blocked-${suffix}` }, spoof: { user_id: a.id, title: `QA-Spoof-${suffix}` } },
      { table: 'habits', id: habitId, update: { title: `QA-Blocked-${suffix}` }, spoof: { user_id: a.id, title: `QA-Spoof-${suffix}` } },
      { table: 'habit_completions', id: completionId, update: { completed_on: '2026-08-23' }, spoof: { user_id: a.id, habit_id: habitId, completed_on: '2026-08-24' } },
      { table: 'notes', id: noteId, update: { title: `QA-Blocked-${suffix}` }, spoof: { user_id: a.id, title: `QA-Spoof-${suffix}` } },
      { table: 'goals', id: goalId, update: { title: `QA-Blocked-${suffix}` }, spoof: { user_id: a.id, title: `QA-Spoof-${suffix}`, target_value: 1, unit: 'session' } },
      { table: 'pomodoro_sessions', id: sessionId, update: { notes: `QA-Blocked-${suffix}` }, spoof: { user_id: a.id, duration: 1, type: 'focus', completed: true } },
      { table: 'water_intake', id: waterId, update: { amount_ml: 300 }, spoof: { user_id: a.id, amount_ml: 250 } },
    ];
    for (const row of rows) {
      const select = await api.get(`${qa.supabaseUrl}/rest/v1/${row.table}?id=eq.${row.id}`, { headers: headers(b.accessToken) });
      expect(select.ok()).toBe(true);
      expect(await select.json()).toEqual([]);

      const update = await api.patch(`${qa.supabaseUrl}/rest/v1/${row.table}?id=eq.${row.id}`, { headers: headers(b.accessToken, true), data: row.update });
      expect(update.ok()).toBe(true);
      expect(await update.json()).toEqual([]);

      const remove = await api.delete(`${qa.supabaseUrl}/rest/v1/${row.table}?id=eq.${row.id}`, { headers: headers(b.accessToken, true) });
      expect(remove.ok()).toBe(true);
      expect(await remove.json()).toEqual([]);

      const spoof = await api.post(`${qa.supabaseUrl}/rest/v1/${row.table}`, { headers: headers(b.accessToken, true), data: row.spoof });
      expect(spoof.ok()).toBe(false);
    }

    const profile = await api.get(`${qa.supabaseUrl}/rest/v1/profiles?id=eq.${a.id}`, { headers: headers(b.accessToken) });
    expect(profile.ok()).toBe(true);
    expect(await profile.json()).toEqual([]);
    const profileUpdate = await api.patch(`${qa.supabaseUrl}/rest/v1/profiles?id=eq.${a.id}`, { headers: headers(b.accessToken, true), data: { bio: `QA-Blocked-${suffix}` } });
    expect(profileUpdate.ok()).toBe(true);
    expect(await profileUpdate.json()).toEqual([]);
  } finally {
    for (const row of created.reverse()) {
      await api.delete(`${qa.supabaseUrl}/rest/v1/${row.table}?id=eq.${row.id}`, { headers: headers(a.accessToken) });
    }
    await api.dispose();
  }
});
