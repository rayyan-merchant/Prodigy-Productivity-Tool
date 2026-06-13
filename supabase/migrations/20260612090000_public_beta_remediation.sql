-- Public beta remediation. This migration is additive and preserves existing data.

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, display_name)
  VALUES (
    NEW.id,
    NULLIF(NEW.raw_user_meta_data->>'name', ''),
    NULLIF(NEW.raw_user_meta_data->>'name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.profiles (id, name, display_name)
SELECT
  u.id,
  NULLIF(u.raw_user_meta_data->>'name', ''),
  NULLIF(u.raw_user_meta_data->>'name', '')
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id AND role = 'user');
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Profile role cannot be changed by the account owner';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_role ON public.profiles;
CREATE TRIGGER protect_profile_role
  BEFORE UPDATE OF role ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS due_on DATE,
  ADD COLUMN IF NOT EXISTS recurrence_parent_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recurrence_instance_key TEXT;

CREATE OR REPLACE FUNCTION public.sync_task_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' THEN
    NEW.completed = TRUE;
    IF TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'completed' OR NEW.completed_at IS NULL THEN
      NEW.completed_at = COALESCE(NEW.completed_at, now());
    END IF;
  ELSE
    NEW.completed = FALSE;
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_task_completion ON public.tasks;
CREATE TRIGGER sync_task_completion
  BEFORE INSERT OR UPDATE OF status, completed, completed_at ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.sync_task_completion();

UPDATE public.tasks
SET completed = (status = 'completed'),
    completed_at = CASE
      WHEN status = 'completed' THEN COALESCE(completed_at, updated_at, created_at, now())
      ELSE NULL
    END
WHERE completed IS DISTINCT FROM (status = 'completed')
   OR (status = 'completed' AND completed_at IS NULL)
   OR (status <> 'completed' AND completed_at IS NOT NULL);

UPDATE public.tasks
SET due_on = (due_date AT TIME ZONE 'UTC')::date
WHERE due_on IS NULL AND due_date IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_tasks_recurrence_instance
  ON public.tasks(user_id, recurrence_instance_key)
  WHERE recurrence_instance_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_user_due_on
  ON public.tasks(user_id, due_on);

ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_title_length;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_title_length
  CHECK (char_length(title) BETWEEN 1 AND 120) NOT VALID;
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_description_length;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_description_length
  CHECK (description IS NULL OR char_length(description) <= 2000) NOT VALID;
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_estimated_time_positive;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_estimated_time_positive
  CHECK (estimated_time IS NULL OR estimated_time BETWEEN 1 AND 1440) NOT VALID;

ALTER TABLE public.pomodoro_sessions DROP CONSTRAINT IF EXISTS pomodoro_sessions_type_check;
UPDATE public.pomodoro_sessions
SET type = CASE type
  WHEN 'work' THEN 'focus'
  WHEN 'short-break' THEN 'short_break'
  WHEN 'long-break' THEN 'long_break'
  ELSE type
END;
ALTER TABLE public.pomodoro_sessions
  ALTER COLUMN type SET DEFAULT 'focus';
ALTER TABLE public.pomodoro_sessions ADD CONSTRAINT pomodoro_sessions_type_check
  CHECK (type IN ('focus', 'short_break', 'long_break')) NOT VALID;
ALTER TABLE public.pomodoro_sessions DROP CONSTRAINT IF EXISTS pomodoro_sessions_duration_positive;
ALTER TABLE public.pomodoro_sessions ADD CONSTRAINT pomodoro_sessions_duration_positive
  CHECK (duration BETWEEN 1 AND 1440) NOT VALID;

ALTER TABLE public.habits
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS target_streak INTEGER NOT NULL DEFAULT 7;
ALTER TABLE public.habits DROP CONSTRAINT IF EXISTS habits_frequency_check;
UPDATE public.habits SET frequency = 'weekly' WHERE frequency = 'monthly';
ALTER TABLE public.habits ADD CONSTRAINT habits_frequency_check
  CHECK (frequency IN ('daily', 'weekly')) NOT VALID;
ALTER TABLE public.habits DROP CONSTRAINT IF EXISTS habits_category_check;
ALTER TABLE public.habits ADD CONSTRAINT habits_category_check
  CHECK (category IN ('health', 'productivity', 'personal', 'learning', 'other')) NOT VALID;
ALTER TABLE public.habits DROP CONSTRAINT IF EXISTS habits_target_streak_positive;
ALTER TABLE public.habits ADD CONSTRAINT habits_target_streak_positive
  CHECK (target_streak BETWEEN 1 AND 3650) NOT VALID;
ALTER TABLE public.habits DROP CONSTRAINT IF EXISTS habits_title_length;
ALTER TABLE public.habits ADD CONSTRAINT habits_title_length
  CHECK (char_length(title) BETWEEN 1 AND 80) NOT VALID;
ALTER TABLE public.habits DROP CONSTRAINT IF EXISTS habits_description_length;
ALTER TABLE public.habits ADD CONSTRAINT habits_description_length
  CHECK (description IS NULL OR char_length(description) <= 1000) NOT VALID;

CREATE TABLE IF NOT EXISTS public.habit_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_on DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (habit_id, completed_on)
);

INSERT INTO public.habit_completions (habit_id, user_id, completed_on)
SELECT id, user_id, (last_completed AT TIME ZONE 'UTC')::date
FROM public.habits
WHERE last_completed IS NOT NULL
ON CONFLICT (habit_id, completed_on) DO NOTHING;

ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own habit completions"
  ON public.habit_completions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own habit completions"
  ON public.habit_completions FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.habits h
      WHERE h.id = habit_id AND h.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can delete own habit completions"
  ON public.habit_completions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_user_date
  ON public.habit_completions(user_id, completed_on DESC);
CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_date
  ON public.habit_completions(habit_id, completed_on DESC);

ALTER TABLE public.water_intake DROP CONSTRAINT IF EXISTS water_intake_amount_range;
ALTER TABLE public.water_intake ADD CONSTRAINT water_intake_amount_range
  CHECK (amount_ml BETWEEN 1 AND 2000) NOT VALID;
ALTER TABLE public.water_settings DROP CONSTRAINT IF EXISTS water_settings_goal_range;
ALTER TABLE public.water_settings ADD CONSTRAINT water_settings_goal_range
  CHECK (daily_goal_ml BETWEEN 250 AND 10000) NOT VALID;
ALTER TABLE public.water_settings DROP CONSTRAINT IF EXISTS water_settings_interval_range;
ALTER TABLE public.water_settings ADD CONSTRAINT water_settings_interval_range
  CHECK (reminder_interval_minutes IS NULL OR reminder_interval_minutes BETWEEN 15 AND 720) NOT VALID;

CREATE TABLE IF NOT EXISTS public.ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  request_count INTEGER NOT NULL DEFAULT 0,
  last_requested_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, feature, usage_date)
);
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own AI usage"
  ON public.ai_usage FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.consume_ai_quota(
  p_feature TEXT,
  p_daily_limit INTEGER,
  p_cooldown_seconds INTEGER DEFAULT 10
)
RETURNS TABLE(allowed BOOLEAN, remaining INTEGER, retry_after_seconds INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_row public.ai_usage%ROWTYPE;
  v_retry INTEGER := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.ai_usage (user_id, feature, usage_date, request_count, last_requested_at)
  VALUES (v_user_id, p_feature, CURRENT_DATE, 0, NULL)
  ON CONFLICT (user_id, feature, usage_date) DO NOTHING;

  SELECT * INTO v_row
  FROM public.ai_usage
  WHERE user_id = v_user_id AND feature = p_feature AND usage_date = CURRENT_DATE
  FOR UPDATE;

  IF v_row.last_requested_at IS NOT NULL THEN
    v_retry := GREATEST(
      0,
      p_cooldown_seconds - FLOOR(EXTRACT(EPOCH FROM (now() - v_row.last_requested_at)))::INTEGER
    );
  END IF;

  IF v_row.request_count >= p_daily_limit OR v_retry > 0 THEN
    RETURN QUERY SELECT FALSE, GREATEST(0, p_daily_limit - v_row.request_count), v_retry;
    RETURN;
  END IF;

  UPDATE public.ai_usage
  SET request_count = request_count + 1,
      last_requested_at = now(),
      updated_at = now()
  WHERE id = v_row.id;

  RETURN QUERY SELECT TRUE, GREATEST(0, p_daily_limit - v_row.request_count - 1), 0;
END;
$$;
REVOKE ALL ON FUNCTION public.consume_ai_quota(TEXT, INTEGER, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_ai_quota(TEXT, INTEGER, INTEGER) TO authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', false, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Users can read own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can read own avatar"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.protect_profile_role() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_task_completion() FROM anon, authenticated, PUBLIC;
