import { supabase } from '@/integrations/supabase/client';
import { getCurrentUser } from '@/lib/auth';
import { waterAmountSchema } from '@/lib/validation';
import { toLocalDateKey } from '@/lib/dateOnly';

export interface WaterIntake {
  id: string;
  user_id: string;
  amount_ml: number;
  logged_at: string;
  created_at: string;
}

export interface WaterSettings {
  id: string;
  user_id: string;
  daily_goal_ml: number;
  reminder_interval_minutes: number;
  reminders_enabled: boolean;
}

export const getWaterSettings = async (): Promise<WaterSettings | null> => {
  const user = getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('water_settings')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw error;
  return data as WaterSettings | null;
};

export const upsertWaterSettings = async (settings: Partial<WaterSettings>): Promise<WaterSettings> => {
  const user = getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data: existing } = await supabase
    .from('water_settings')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('water_settings')
      .update(settings)
      .eq('user_id', user.id)
      .select()
      .single();
    if (error) throw error;
    return data as WaterSettings;
  } else {
    const { data, error } = await supabase
      .from('water_settings')
      .insert({ user_id: user.id, ...settings })
      .select()
      .single();
    if (error) throw error;
    return data as WaterSettings;
  }
};

export const getTodayWaterIntake = async (): Promise<WaterIntake[]> => {
  const user = getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('water_intake')
    .select('*')
    .eq('user_id', user.id)
    .gte('logged_at', today.toISOString())
    .order('logged_at', { ascending: false });

  if (error) throw error;
  return (data || []) as WaterIntake[];
};

export const getWaterIntakeHistory = async (days: number = 7): Promise<WaterIntake[]> => {
  const user = getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('water_intake')
    .select('*')
    .eq('user_id', user.id)
    .gte('logged_at', startDate.toISOString())
    .order('logged_at', { ascending: true });

  if (error) throw error;
  return (data || []) as WaterIntake[];
};

export const addWaterIntake = async (amount_ml: number): Promise<WaterIntake> => {
  const user = getCurrentUser();
  if (!user) throw new Error('Not authenticated');
  waterAmountSchema.parse(amount_ml);
  if (!navigator.onLine) throw new Error('Water entries cannot be changed while offline.');

  const { data, error } = await supabase
    .from('water_intake')
    .insert({ user_id: user.id, amount_ml })
    .select()
    .single();

  if (error) throw error;
  return data as WaterIntake;
};

export const deleteWaterIntake = async (id: string): Promise<void> => {
  const user = getCurrentUser();
  if (!user) throw new Error('Not authenticated');
  if (!navigator.onLine) throw new Error('Water entries cannot be changed while offline.');

  const { error } = await supabase
    .from('water_intake')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
};

export const getHydrationStreak = async (): Promise<number> => {
  const user = getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const settings = await getWaterSettings();
  const goalMl = settings?.daily_goal_ml || 2000;

  // Get last 60 days of data
  const history = await getWaterIntakeHistory(60);

  // Group by day
  const dailyTotals = new Map<string, number>();
  history.forEach(entry => {
    const day = toLocalDateKey(new Date(entry.logged_at));
    dailyTotals.set(day, (dailyTotals.get(day) || 0) + entry.amount_ml);
  });

  // Count streak backwards from yesterday
  let streak = 0;
  const today = new Date();
  
  // Check if today's goal is met, if so start from today
  const todayStr = toLocalDateKey(today);
  const todayTotal = dailyTotals.get(todayStr) || 0;
  
  if (todayTotal >= goalMl) {
    streak = 1;
  }

  for (let i = 1; i <= 60; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dayStr = toLocalDateKey(d);
    const total = dailyTotals.get(dayStr) || 0;
    if (total >= goalMl) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
};
