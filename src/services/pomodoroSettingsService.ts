import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
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

export const getPomodoroSettings = async (): Promise<PomodoroSettings> => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const settingsRef = doc(db, 'users', user.uid, 'settings', 'pomodoro');
    const settingsDoc = await getDoc(settingsRef);

    if (settingsDoc.exists()) {
      const data = settingsDoc.data();
      return {
        ...DEFAULT_SETTINGS,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
      };
    } else {

      return await savePomodoroSettings(DEFAULT_SETTINGS);
    }
  } catch (error) {
    console.error('Error getting pomodoro settings:', error);
    return DEFAULT_SETTINGS;
  }
};

export const savePomodoroSettings = async (settings: Partial<PomodoroSettings>): Promise<PomodoroSettings> => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const settingsRef = doc(db, 'users', user.uid, 'settings', 'pomodoro');
    const now = serverTimestamp();

    const { createdAt, updatedAt, ...settingsWithoutTimestamps } = settings;
    const firestoreData: any = {
      ...settingsWithoutTimestamps,
      updatedAt: now
    };

    const existingDoc = await getDoc(settingsRef);
    if (!existingDoc.exists()) {
      firestoreData.createdAt = now;
    }

    await setDoc(settingsRef, firestoreData, { merge: true });

    const currentTime = new Date().toISOString();
    return {
      ...DEFAULT_SETTINGS,
      ...settingsWithoutTimestamps,
      createdAt: currentTime,
      updatedAt: currentTime
    };
  } catch (error) {
    console.error('Error saving pomodoro settings:', error);
    throw error;
  }
};
