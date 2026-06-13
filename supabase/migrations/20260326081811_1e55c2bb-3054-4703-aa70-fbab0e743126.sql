
-- Water intake logs table
CREATE TABLE public.water_intake (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount_ml INTEGER NOT NULL,
  logged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Water settings table (daily goal, reminders)
CREATE TABLE public.water_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  daily_goal_ml INTEGER NOT NULL DEFAULT 2000,
  reminder_interval_minutes INTEGER DEFAULT 60,
  reminders_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.water_intake ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for water_intake
CREATE POLICY "Users can view own water intake" ON public.water_intake FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own water intake" ON public.water_intake FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own water intake" ON public.water_intake FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for water_settings
CREATE POLICY "Users can view own water settings" ON public.water_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own water settings" ON public.water_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own water settings" ON public.water_settings FOR UPDATE USING (auth.uid() = user_id);

-- Enable realtime for water_intake
ALTER PUBLICATION supabase_realtime ADD TABLE public.water_intake;

-- Trigger for updated_at on water_settings
CREATE TRIGGER update_water_settings_updated_at BEFORE UPDATE ON public.water_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
