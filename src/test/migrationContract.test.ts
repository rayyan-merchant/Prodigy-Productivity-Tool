import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260612090000_public_beta_remediation.sql'),
  'utf8',
);

describe('public beta migration contract', () => {
  it('enables RLS and scopes completion history to the authenticated user', () => {
    expect(migration).toContain('ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY');
    expect(migration).toContain('USING (auth.uid() = user_id)');
    expect(migration).toContain('WITH CHECK (');
  });

  it('protects authoritative task completion and profile roles with triggers', () => {
    expect(migration).toContain('CREATE TRIGGER sync_task_completion');
    expect(migration).toContain('CREATE TRIGGER protect_profile_role');
    expect(migration).toContain('NEW.completed_at = NULL');
  });

  it('keeps avatars private and account-scoped', () => {
    expect(migration).toContain("VALUES ('avatars', 'avatars', false");
    expect(migration).toContain("(storage.foldername(name))[1] = auth.uid()::text");
  });

  it('provides server-side AI quota accounting', () => {
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS public.ai_usage');
    expect(migration).toContain('CREATE OR REPLACE FUNCTION public.consume_ai_quota');
  });
});
