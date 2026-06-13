-- Fix missing RLS policies and other issues

-- =============================================
-- 1. Fix habits table policies
-- =============================================
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own habits" ON public.habits;
CREATE POLICY "Users can view own habits"
  ON public.habits FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own habits" ON public.habits;
CREATE POLICY "Users can create own habits"
  ON public.habits FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own habits" ON public.habits;
CREATE POLICY "Users can update own habits"
  ON public.habits FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own habits" ON public.habits;
CREATE POLICY "Users can delete own habits"
  ON public.habits FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- 2. Fix pomodoro_sessions table policies
-- =============================================
ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own pomodoro sessions" ON public.pomodoro_sessions;
CREATE POLICY "Users can view own pomodoro sessions"
  ON public.pomodoro_sessions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own pomodoro sessions" ON public.pomodoro_sessions;
CREATE POLICY "Users can create own pomodoro sessions"
  ON public.pomodoro_sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own pomodoro sessions" ON public.pomodoro_sessions;
CREATE POLICY "Users can update own pomodoro sessions"
  ON public.pomodoro_sessions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own pomodoro sessions" ON public.pomodoro_sessions;
CREATE POLICY "Users can delete own pomodoro sessions"
  ON public.pomodoro_sessions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- 3. Fix water_intake update policy
-- =============================================
DROP POLICY IF EXISTS "Users can update own water intake" ON public.water_intake;
CREATE POLICY "Users can update own water intake"
  ON public.water_intake FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 4. Ensure all updated_at triggers exist
-- =============================================
DROP TRIGGER IF EXISTS update_habits_updated_at ON public.habits;
CREATE TRIGGER update_habits_updated_at
  BEFORE UPDATE ON public.habits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_pomodoro_sessions_updated_at ON public.pomodoro_sessions;
CREATE TRIGGER update_pomodoro_sessions_updated_at
  BEFORE UPDATE ON public.pomodoro_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_water_settings_updated_at ON public.water_settings;
CREATE TRIGGER update_water_settings_updated_at
  BEFORE UPDATE ON public.water_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
