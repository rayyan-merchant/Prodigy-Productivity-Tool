
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getPomodoroSettings, savePomodoroSettings } from '@/services/pomodoroSettingsService';
import { saveSession } from '@/services/sessionService';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getAccountStorage, setAccountStorage } from '@/lib/accountStorage';

interface TimerSettings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
}

type SessionType = 'focus' | 'short-break' | 'long-break';

interface TimerState {
  isRunning: boolean;
  endTime: number | null; // timestamp when timer ends
  pausedRemaining: number | null; // ms remaining when paused
  sessionType: SessionType;
  sessionDuration: number; // total duration in seconds
  startTime: number | null; // timestamp when session started
  taskId: string | null;
  taskTitle: string | null;
  focusLabel: string | null;
}

interface TimerContextType {
  settings: TimerSettings;
  updateSettings: (newSettings: TimerSettings) => Promise<void>;
  sessionsCompleted: number;
  incrementSession: () => void;
  incrementSessionsCompleted: () => void;
  // Global timer state
  timerState: TimerState;
  remainingSeconds: number;
  progress: number;
  startTimer: (type: SessionType, taskId?: string | null, taskTitle?: string | null, focusLabel?: string | null) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  isWaitingForUser: boolean;
  setIsWaitingForUser: (v: boolean) => void;
}

const defaultSettings: TimerSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
};

const TIMER_STORAGE_KEY = 'pomodoro-timer-state';
const SESSIONS_STORAGE_KEY = 'pomodoro-sessions-completed';
const SETTINGS_STORAGE_KEY = 'pomodoro-settings';

const emptyTimerState = (): TimerState => ({
  isRunning: false,
  endTime: null,
  pausedRemaining: null,
  sessionType: 'focus',
  sessionDuration: 0,
  startTime: null,
  taskId: null,
  taskTitle: null,
  focusLabel: null,
});

const getInitialTimerState = (userId?: string): TimerState => {
  if (!userId) return emptyTimerState();
  try {
    const parsed = getAccountStorage<TimerState | null>(userId, TIMER_STORAGE_KEY, null);
    if (parsed) {
      // If it was running, check if it already expired
      if (parsed.isRunning && parsed.endTime) {
        if (Date.now() >= parsed.endTime) {
          // Timer expired while away
          return { ...parsed, focusLabel: parsed.focusLabel ?? null, isRunning: false, endTime: null, pausedRemaining: 0 };
        }
        return { ...parsed, focusLabel: parsed.focusLabel ?? null };
      }
      return { ...parsed, focusLabel: parsed.focusLabel ?? null };
    }
  } catch (error) {
    console.warn('Ignoring invalid saved timer state', error);
  }
  return emptyTimerState();
};

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [settings, setSettings] = useState<TimerSettings>(defaultSettings);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [timerState, setTimerState] = useState<TimerState>(emptyTimerState);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isWaitingForUser, setIsWaitingForUser] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const completionHandledRef = useRef(false);
  const handleTimerCompleteRef = useRef<() => void>(() => undefined);

  // Persist timer state
  useEffect(() => {
    if (user) setAccountStorage(user.id, TIMER_STORAGE_KEY, timerState);
  }, [timerState, user]);

  // Persist sessions completed
  useEffect(() => {
    if (user) setAccountStorage(user.id, SESSIONS_STORAGE_KEY, sessionsCompleted);
  }, [sessionsCompleted, user]);

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      if (isAuthLoading) return;
      setIsLoading(true);
      setTimerState(getInitialTimerState(user?.id));
      setSessionsCompleted(user ? getAccountStorage(user.id, SESSIONS_STORAGE_KEY, 0) : 0);
      try {
        if (user) {
          const pomodoroSettings = await getPomodoroSettings();
          setSettings({
            workDuration: pomodoroSettings.workDuration,
            shortBreakDuration: pomodoroSettings.shortBreakDuration,
            longBreakDuration: pomodoroSettings.longBreakDuration,
            longBreakInterval: pomodoroSettings.longBreakInterval,
          });
        } else {
          setSettings(defaultSettings);
        }
      } catch {
        setSettings(
          user
            ? getAccountStorage<TimerSettings>(user.id, SETTINGS_STORAGE_KEY, defaultSettings)
            : defaultSettings,
        );
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, [isAuthLoading, user]);

  // Calculate remaining and progress from timestamps
  const tick = useCallback(() => {
    if (timerState.isRunning && timerState.endTime) {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((timerState.endTime - now) / 1000));
      setRemainingSeconds(remaining);
      setProgress(timerState.sessionDuration > 0 ? 1 - (remaining / timerState.sessionDuration) : 0);

      if (remaining <= 0 && !completionHandledRef.current) {
        completionHandledRef.current = true;
        handleTimerCompleteRef.current();
      }
    } else if (timerState.pausedRemaining !== null) {
      const remaining = Math.max(0, Math.ceil(timerState.pausedRemaining / 1000));
      setRemainingSeconds(remaining);
      setProgress(timerState.sessionDuration > 0 ? 1 - (remaining / timerState.sessionDuration) : 0);
    } else if (!timerState.isRunning && !timerState.endTime && timerState.sessionDuration === 0) {
      // Idle state
      setRemainingSeconds(0);
      setProgress(0);
    }
  }, [timerState]);

  // Tick interval
  useEffect(() => {
    tick(); // immediate tick
    if (timerState.isRunning) {
      intervalRef.current = window.setInterval(tick, 250); // update 4x/sec for accuracy
    }
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timerState.isRunning, timerState.endTime, tick]);

  const handleTimerComplete = useCallback(async () => {
    const completedState = { ...timerState };
    
    // Determine next session type
    let nextType: SessionType = 'focus';
    if (completedState.sessionType === 'focus') {
      const newCount = sessionsCompleted + 1;
      nextType = (newCount % settings.longBreakInterval === 0) ? 'long-break' : 'short-break';
    }
    
    setTimerState(prev => ({
      ...prev,
      isRunning: false,
      endTime: null,
      pausedRemaining: null,
      sessionType: nextType,
      sessionDuration: 0,
    }));

    // Save completed session to database
    if (completedState.sessionType === 'focus') {
      try {
        if (user) {
          await saveSession({
            duration: completedState.sessionDuration / 60, // minutes
            type: completedState.sessionType,
            completed: true,
            date: new Date(completedState.startTime || Date.now()),
            taskId: completedState.taskId || undefined,
            focusLabel: completedState.focusLabel || undefined,
            notes: localStorage.getItem('pomodoro-session-notes') || undefined,
          });
        }
      } catch (err) {
        console.error('Failed to save session:', err);
      }

      setSessionsCompleted(prev => prev + 1);

      // Hydration reminder
      setTimeout(() => {
        toast('Pomodoro complete. Take a moment to drink some water.', {
          description: 'Stay hydrated to maintain focus',
          action: {
            label: 'Log Water',
            onClick: () => window.location.href = '/water',
          },
          duration: 8000,
        });
      }, 1500);
    }

    setIsWaitingForUser(true);
    
    // Dispatch event for sound/notification hooks
    window.dispatchEvent(new CustomEvent('pomodoroComplete', {
      detail: { sessionType: completedState.sessionType }
    }));
  }, [sessionsCompleted, settings.longBreakInterval, timerState, user]);

  useEffect(() => {
    handleTimerCompleteRef.current = () => {
      void handleTimerComplete();
    };
  }, [handleTimerComplete]);

  const getDurationSeconds = useCallback((type: SessionType) => {
    switch (type) {
      case 'focus': return settings.workDuration * 60;
      case 'short-break': return settings.shortBreakDuration * 60;
      case 'long-break': return settings.longBreakDuration * 60;
    }
  }, [settings]);

  const startTimer = useCallback((type: SessionType, taskId?: string | null, taskTitle?: string | null, focusLabel?: string | null) => {
    const duration = getDurationSeconds(type);
    const now = Date.now();
    completionHandledRef.current = false;
    setIsWaitingForUser(false);
    setTimerState({
      isRunning: true,
      endTime: now + duration * 1000,
      pausedRemaining: null,
      sessionType: type,
      sessionDuration: duration,
      startTime: now,
      taskId: taskId || null,
      taskTitle: taskTitle || null,
      focusLabel: focusLabel || null,
    });

    window.dispatchEvent(new CustomEvent('pomodoroStart', { detail: { sessionType: type } }));
  }, [getDurationSeconds]);

  const pauseTimer = useCallback(() => {
    if (timerState.isRunning && timerState.endTime) {
      const remaining = Math.max(0, timerState.endTime - Date.now());
      setTimerState(prev => ({
        ...prev,
        isRunning: false,
        endTime: null,
        pausedRemaining: remaining,
      }));
    }
  }, [timerState]);

  const resumeTimer = useCallback(() => {
    if (!timerState.isRunning && timerState.pausedRemaining !== null && timerState.pausedRemaining > 0) {
      completionHandledRef.current = false;
      setTimerState(prev => ({
        ...prev,
        isRunning: true,
        endTime: Date.now() + (prev.pausedRemaining || 0),
        pausedRemaining: null,
      }));
    }
  }, [timerState]);

  const stopTimer = useCallback(() => {
    // Save incomplete session if it was focus
    if (timerState.sessionType === 'focus' && timerState.startTime) {
      if (user) {
        const elapsed = timerState.sessionDuration - (timerState.isRunning && timerState.endTime
          ? Math.max(0, Math.ceil((timerState.endTime - Date.now()) / 1000))
          : timerState.pausedRemaining !== null
            ? Math.ceil(timerState.pausedRemaining / 1000)
            : 0);
        
        if (elapsed > 60) { // only save if > 1 min
          saveSession({
            duration: Math.round(elapsed / 60),
            type: 'focus',
            completed: false,
            date: new Date(timerState.startTime),
            taskId: timerState.taskId || undefined,
            focusLabel: timerState.focusLabel || undefined,
          }).catch(err => console.error('Failed to save incomplete session:', err));
        }
      }
    }

    setTimerState({
      isRunning: false,
      endTime: null,
      pausedRemaining: null,
      sessionType: 'focus',
      sessionDuration: 0,
      startTime: null,
      taskId: null,
      taskTitle: null,
      focusLabel: null,
    });
    setRemainingSeconds(0);
    setProgress(0);
    setIsWaitingForUser(false);
    completionHandledRef.current = false;
  }, [timerState, user]);

  const resetTimer = useCallback(() => {
    stopTimer();
  }, [stopTimer]);

  const updateSettings = async (newSettings: TimerSettings) => {
    try {
      if (user) {
        await savePomodoroSettings(newSettings);
        setAccountStorage(user.id, SETTINGS_STORAGE_KEY, newSettings);
      }
      setSettings(newSettings);
    } catch (error) {
      if (user) setAccountStorage(user.id, SETTINGS_STORAGE_KEY, newSettings);
      setSettings(newSettings);
      throw error;
    }
  };

  const incrementSession = () => setSessionsCompleted(prev => prev + 1);
  const incrementSessionsCompleted = () => setSessionsCompleted(prev => prev + 1);

  // Handle timer expired while app was closed (on initial load)
  useEffect(() => {
    if (!isLoading) {
      const initial = getInitialTimerState(user?.id);
      if (initial.isRunning && initial.endTime && Date.now() >= initial.endTime) {
        // Timer completed while away - handle completion
        completionHandledRef.current = false;
        // Set the state first so handleTimerComplete has correct data
        setTimerState(initial);
        setTimeout(() => {
          handleTimerComplete();
        }, 100);
      }
    }
  }, [handleTimerComplete, isLoading, user?.id]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <TimerContext.Provider
      value={{
        settings,
        updateSettings,
        sessionsCompleted,
        incrementSession,
        incrementSessionsCompleted,
        timerState,
        remainingSeconds,
        progress,
        startTimer,
        pauseTimer,
        resumeTimer,
        stopTimer,
        resetTimer,
        isWaitingForUser,
        setIsWaitingForUser,
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
