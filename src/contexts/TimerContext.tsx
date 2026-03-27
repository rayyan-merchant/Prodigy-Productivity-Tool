import React, { createContext, useContext, useState, useEffect } from 'react';
import { getPomodoroSettings, savePomodoroSettings } from '@/services/pomodoroSettingsService';
import { getCurrentUser } from '@/lib/auth';

interface TimerSettings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
}

interface TimerContextType {
  settings: TimerSettings;
  updateSettings: (newSettings: TimerSettings) => Promise<void>;
  sessionsCompleted: number;
  incrementSession: () => void;
  incrementSessionsCompleted: () => void;
}

const defaultSettings: TimerSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
};

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<TimerSettings>(defaultSettings);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const user = getCurrentUser();
        if (user) {
          const pomodoroSettings = await getPomodoroSettings();
          setSettings({
            workDuration: pomodoroSettings.workDuration,
            shortBreakDuration: pomodoroSettings.shortBreakDuration,
            longBreakDuration: pomodoroSettings.longBreakDuration,
            longBreakInterval: pomodoroSettings.longBreakInterval,
          });
        } else {

          const savedSettings = localStorage.getItem('timer-settings');
          if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            setSettings(parsed);
          }
        }
      } catch (error) {
        console.error('Error loading timer settings:', error);

        const savedSettings = localStorage.getItem('timer-settings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          setSettings(parsed);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const updateSettings = async (newSettings: TimerSettings) => {
    try {
      const user = getCurrentUser();
      if (user) {

        await savePomodoroSettings(newSettings);
      }

      localStorage.setItem('timer-settings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving timer settings:', error);

      localStorage.setItem('timer-settings', JSON.stringify(newSettings));
      setSettings(newSettings);
      throw error;
    }
  };

  const incrementSession = () => {
    setSessionsCompleted((prev) => prev + 1);
  };

  const incrementSessionsCompleted = () => {
    setSessionsCompleted((prev) => prev + 1);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <TimerContext.Provider
      value={{
        settings,
        updateSettings,
        sessionsCompleted,
        incrementSession,
        incrementSessionsCompleted
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (undefined === context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};
