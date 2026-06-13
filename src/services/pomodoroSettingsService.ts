import { getCurrentUser } from '@/lib/auth';

export interface PomodoroSettings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  soundEnabled: boolean;
  soundTheme: string;
  notifications: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const DEFAULT_SETTINGS: PomodoroSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  soundEnabled: true,
  soundTheme: 'default',
  notifications: true
};

const SETTINGS_KEY = 'pomodoro_settings';

export const getPomodoroSettings = async (): Promise<PomodoroSettings> => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const stored = localStorage.getItem(`${SETTINGS_KEY}_${user.id}`);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error getting pomodoro settings:', error);
    return DEFAULT_SETTINGS;
  }
};

export const savePomodoroSettings = async (settings: Partial<PomodoroSettings>): Promise<PomodoroSettings> => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const currentSettings = await getPomodoroSettings();
    const newSettings = {
      ...currentSettings,
      ...settings,
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem(`${SETTINGS_KEY}_${user.id}`, JSON.stringify(newSettings));
    return newSettings;
  } catch (error) {
    console.error('Error saving pomodoro settings:', error);
    throw error;
  }
};