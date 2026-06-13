import { supabase } from '@/integrations/supabase/client';
import { getCurrentUser } from '@/lib/auth';
import { createHabitActivity } from './activityService';
import type { Habit } from '@/types/habits';
import type { Database } from '@/integrations/supabase/types';
import { toLocalDateKey } from '@/lib/dateOnly';
import { calculateHabitStreaks, isoWeekStart } from '@/lib/habitStreaks';

type HabitRow = Database['public']['Tables']['habits']['Row'];

export const getTodayLocalDateKey = () => toLocalDateKey();

const requireUser = () => {
  const user = getCurrentUser();
  if (!user) throw new Error('Your session has expired. Sign in again.');
  return user;
};

const requireOnline = () => {
  if (!navigator.onLine) throw new Error('Habits are read-only while you are offline.');
};

export { calculateHabitStreaks } from '@/lib/habitStreaks';

const mapHabit = (habit: HabitRow, completedDates: string[]): Habit => {
  const frequency: Habit['frequency'] = habit.frequency === 'weekly' ? 'weekly' : 'daily';
  const streaks = calculateHabitStreaks(completedDates, frequency);
  return {
    id: habit.id,
    name: habit.title,
    description: habit.description || '',
    category: (habit.category || 'other') as Habit['category'],
    frequency,
    targetStreak: habit.target_streak || 1,
    currentStreak: streaks.current,
    longestStreak: Math.max(streaks.best, habit.best_streak || 0),
    bestStreak: Math.max(streaks.best, habit.best_streak || 0),
    isActive: habit.is_active ?? true,
    completedDates: [...completedDates].sort(),
    createdAt: habit.created_at,
    updatedAt: habit.updated_at,
  };
};

export const isHabitCompletedForCurrentPeriod = (habit: Habit): boolean => {
  const today = getTodayLocalDateKey();
  if (habit.frequency === 'daily') return habit.completedDates.includes(today);
  const currentWeek = isoWeekStart(today);
  return habit.completedDates.some((date) => isoWeekStart(date) === currentWeek);
};

export const canCompleteHabitToday = (habit: Habit): boolean =>
  !isHabitCompletedForCurrentPeriod(habit);

export const getHabits = async (): Promise<Habit[]> => {
  const user = requireUser();
  const [{ data: habits, error: habitError }, { data: completions, error: completionError }] = await Promise.all([
    supabase.from('habits').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }),
    supabase.from('habit_completions').select('habit_id, completed_on').eq('user_id', user.id).order('completed_on'),
  ]);
  if (habitError) throw habitError;
  if (completionError) throw completionError;

  const completionMap = new Map<string, string[]>();
  for (const completion of completions || []) {
    const dates = completionMap.get(completion.habit_id) || [];
    dates.push(completion.completed_on);
    completionMap.set(completion.habit_id, dates);
  }
  return (habits || []).map((habit) => mapHabit(habit, completionMap.get(habit.id) || []));
};

export const createHabit = async (habitData: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>): Promise<Habit> => {
  requireOnline();
  const user = requireUser();
  const { data, error } = await supabase.from('habits').insert({
    title: habitData.name.trim(),
    description: habitData.description?.trim() || null,
    category: habitData.category,
    frequency: habitData.frequency,
    target_streak: habitData.targetStreak,
    current_streak: 0,
    best_streak: 0,
    is_active: habitData.isActive !== false,
    user_id: user.id,
  }).select().single();
  if (error) throw error;
  await createHabitActivity('New habit created', `"${data.title}" was created`, data.id);
  return mapHabit(data, []);
};

export const updateHabit = async (
  habitId: string,
  habitData: Partial<Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<void> => {
  requireOnline();
  const user = requireUser();
  const update: Database['public']['Tables']['habits']['Update'] = {};
  if (habitData.name !== undefined) update.title = habitData.name.trim();
  if (habitData.description !== undefined) update.description = habitData.description.trim();
  if (habitData.frequency !== undefined) update.frequency = habitData.frequency;
  if (habitData.category !== undefined) update.category = habitData.category;
  if (habitData.targetStreak !== undefined) update.target_streak = habitData.targetStreak;
  if (habitData.isActive !== undefined) update.is_active = habitData.isActive;
  const { error } = await supabase.from('habits').update(update).eq('id', habitId).eq('user_id', user.id);
  if (error) throw error;
  if (habitData.name) await createHabitActivity('Habit updated', `"${habitData.name}" was updated`, habitId);
};

const refreshPersistedStreak = async (habitId: string, userId: string) => {
  const [{ data: habit, error: habitError }, { data: completions, error: completionError }] = await Promise.all([
    supabase.from('habits').select('frequency').eq('id', habitId).eq('user_id', userId).single(),
    supabase.from('habit_completions').select('completed_on').eq('habit_id', habitId).eq('user_id', userId),
  ]);
  if (habitError) throw habitError;
  if (completionError) throw completionError;
  const dates = (completions || []).map((completion) => completion.completed_on);
  const streaks = calculateHabitStreaks(dates, habit.frequency as Habit['frequency']);
  const lastDate = [...dates].sort().at(-1);
  const { error } = await supabase.from('habits').update({
    current_streak: streaks.current,
    best_streak: streaks.best,
    last_completed: lastDate ? new Date(`${lastDate}T12:00:00`).toISOString() : null,
  }).eq('id', habitId).eq('user_id', userId);
  if (error) throw error;
  return streaks;
};

export const completeHabit = async (habitId: string, habitTitle: string): Promise<void> => {
  requireOnline();
  const user = requireUser();
  const habit = (await getHabits()).find((candidate) => candidate.id === habitId);
  if (!habit) throw new Error('Habit not found');
  if (!canCompleteHabitToday(habit)) throw new Error(`This ${habit.frequency} habit is already complete for the current period`);
  const { error } = await supabase.from('habit_completions').insert({
    habit_id: habitId,
    user_id: user.id,
    completed_on: getTodayLocalDateKey(),
  });
  if (error) throw error;
  const streaks = await refreshPersistedStreak(habitId, user.id);
  await createHabitActivity('Habit completed', `"${habitTitle}" completed - ${streaks.current} streak`, habitId, streaks.current);
};

export const undoHabitCompletion = async (habitId: string): Promise<void> => {
  requireOnline();
  const user = requireUser();
  const { data: habit, error: habitError } = await supabase
    .from('habits')
    .select('frequency')
    .eq('id', habitId)
    .eq('user_id', user.id)
    .single();
  if (habitError) throw habitError;

  let query = supabase
    .from('habit_completions')
    .select('id, completed_on')
    .eq('habit_id', habitId)
    .eq('user_id', user.id);
  if (habit.frequency === 'daily') {
    query = query.eq('completed_on', getTodayLocalDateKey());
  } else {
    query = query
      .gte('completed_on', isoWeekStart(getTodayLocalDateKey()))
      .lte('completed_on', getTodayLocalDateKey());
  }
  const { data: completions, error: completionError } = await query.order('completed_on', { ascending: false }).limit(1);
  if (completionError) throw completionError;
  const completion = completions?.[0];
  if (!completion) throw new Error('No completion exists for the current period');

  const { error: deleteError } = await supabase
    .from('habit_completions')
    .delete()
    .eq('id', completion.id)
    .eq('user_id', user.id);
  if (deleteError) throw deleteError;
  await refreshPersistedStreak(habitId, user.id);
};

export const deleteHabit = async (habitId: string): Promise<void> => {
  requireOnline();
  const user = requireUser();
  const habit = (await getHabits()).find((candidate) => candidate.id === habitId);
  const { error } = await supabase.from('habits').delete().eq('id', habitId).eq('user_id', user.id);
  if (error) throw error;
  await createHabitActivity('Habit deleted', `"${habit?.name || 'Habit'}" was deleted`, habitId);
};
