ALTER TABLE public.pomodoro_sessions
ADD COLUMN IF NOT EXISTS focus_label TEXT;