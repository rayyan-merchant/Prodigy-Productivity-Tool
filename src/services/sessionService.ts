import { supabase } from '@/integrations/supabase/client';
import { getCurrentUser } from '@/lib/auth';

export interface PomodoroSession {
  id?: string;
  duration: number;
  date: Date | string;
  type: 'focus' | 'short-break' | 'long-break';
  interruptions?: number;
  completed: boolean;
  project?: string;
  tags?: string[];
  notes?: string;
  taskId?: string;
  taskTitle?: string;
  focusLabel?: string;
  userId?: string;
  createdAt?: Date;
}

type PersistedSessionType = 'focus' | 'short_break' | 'long_break';

const toPersistedType = (type: PomodoroSession['type']): PersistedSessionType => {
  if (type === 'short-break') return 'short_break';
  if (type === 'long-break') return 'long_break';
  return 'focus';
};

const toUiType = (type: string): PomodoroSession['type'] => {
  if (type === 'short_break' || type === 'short-break') return 'short-break';
  if (type === 'long_break' || type === 'long-break') return 'long-break';
  return 'focus';
};

export const saveSession = async (session: Omit<PomodoroSession, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('pomodoro_sessions')
      .insert([{
        duration: session.duration,
        type: toPersistedType(session.type),
        completed: session.completed,
        notes: session.notes,
        task_id: session.taskId,
        focus_label: session.focusLabel,
        user_id: user.id
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Error saving session:', error);
    throw error;
  }
};

export const getAllSessions = async (): Promise<PomodoroSession[]> => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data: sessions, error } = await supabase
      .from('pomodoro_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return (sessions || []).map(s => ({
      id: s.id,
      duration: s.duration,
      date: s.created_at,
      type: toUiType(s.type),
      completed: s.completed,
      notes: s.notes,
      taskId: s.task_id,
      focusLabel: s.focus_label || undefined
    }));
  } catch (error) {
    console.error('Error getting all sessions:', error);
    return [];
  }
};

export const getSessionsByDateRange = async (startDate: Date, endDate: Date): Promise<PomodoroSession[]> => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data: sessions, error } = await supabase
      .from('pomodoro_sessions')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return (sessions || []).map(s => ({
      id: s.id,
      duration: s.duration,
      date: s.created_at,
      type: toUiType(s.type),
      completed: s.completed,
      notes: s.notes,
      taskId: s.task_id,
      focusLabel: s.focus_label || undefined
    }));
  } catch (error) {
    console.error('Error getting sessions by date range:', error);
    return [];
  }
};

export const getSessionById = async (sessionId: string): Promise<PomodoroSession | null> => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data: session, error } = await supabase
      .from('pomodoro_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    
    return {
      id: session.id,
      duration: session.duration,
      date: session.created_at,
      type: toUiType(session.type),
      completed: session.completed,
      notes: session.notes,
      taskId: session.task_id,
      focusLabel: session.focus_label || undefined
    };
  } catch (error) {
    console.error('Error getting session:', error);
    throw error;
  }
};

export const updateSession = async (sessionId: string, sessionData: Partial<PomodoroSession>): Promise<void> => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const updateData: {
      duration?: number;
      completed?: boolean;
      notes?: string;
      focus_label?: string;
      type?: PersistedSessionType;
    } = {};
    if (sessionData.duration !== undefined) updateData.duration = sessionData.duration;
    if (sessionData.completed !== undefined) updateData.completed = sessionData.completed;
    if (sessionData.notes !== undefined) updateData.notes = sessionData.notes;
    if (sessionData.focusLabel !== undefined) updateData.focus_label = sessionData.focusLabel;
    if (sessionData.type !== undefined) updateData.type = toPersistedType(sessionData.type);

    const { error } = await supabase
      .from('pomodoro_sessions')
      .update(updateData)
      .eq('id', sessionId)
      .eq('user_id', user.id);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error updating session:', error);
    throw error;
  }
};

export const deleteSession = async (sessionId: string): Promise<void> => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('pomodoro_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', user.id);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting session:', error);
    throw error;
  }
};

export const getSessionStats = async (): Promise<{
  totalSessions: number;
  totalFocusTime: number;
  totalInterruptions: number;
  averageSessionLength: number;
}> => {
  try {
    const sessions = await getAllSessions();
    const focusSessions = sessions.filter(s => s.type === 'focus' && s.completed);
    
    const totalSessions = focusSessions.length;
    const totalFocusTime = focusSessions.reduce((total, session) => total + session.duration, 0);
    const totalInterruptions = focusSessions.reduce((total, session) => total + (session.interruptions || 0), 0);
    const averageSessionLength = totalSessions > 0 ? totalFocusTime / totalSessions : 0;
    
    return { totalSessions, totalFocusTime, totalInterruptions, averageSessionLength };
  } catch (error) {
    console.error('Error getting session stats:', error);
    return { totalSessions: 0, totalFocusTime: 0, totalInterruptions: 0, averageSessionLength: 0 };
  }
};
