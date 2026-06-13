
import { useState, useEffect, useCallback } from 'react';
import { useTimer } from '@/contexts/TimerContext';
import { useNotifications } from '@/hooks/useNotifications';
import { useFocusSounds } from '@/hooks/useFocusSounds';
import { useAuth } from '@/contexts/AuthContext';
import { getAccountStorage, removeAccountStorage, setAccountStorage } from '@/lib/accountStorage';

export const usePomodoro = () => {
  const { user } = useAuth();
  const {
    settings,
    sessionsCompleted,
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
  } = useTimer();

  const [shouldPromptForNoteSave, setShouldPromptForNoteSave] = useState(false);
  const [sessionNotes, setSessionNotes] = useState(() => {
    return '';
  });

  const { notifyPomodoroStart, notifyPomodoroEnd, notifyBreakStart, notifyBreakEnd } = useNotifications();
  const { playStartSound, playEndSound } = useFocusSounds();

  const isActive = timerState.isRunning;
  const isBreak = timerState.sessionType === 'short-break' || timerState.sessionType === 'long-break';
  const isLongBreak = timerState.sessionType === 'long-break';
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  const pomodorosUntilLongBreak = settings.longBreakInterval - (sessionsCompleted % settings.longBreakInterval);

  // Listen for start/complete events for sounds & notifications
  useEffect(() => {
    const handleStart = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail.sessionType === 'focus') {
        notifyPomodoroStart();
        playStartSound(false);
      } else {
        notifyBreakStart(detail.sessionType === 'long-break');
        playStartSound(true);
      }
    };
    const handleComplete = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail.sessionType === 'focus') {
        notifyPomodoroEnd();
        playEndSound(false);
        if (sessionNotes.trim()) {
          setShouldPromptForNoteSave(true);
        }
      } else {
        notifyBreakEnd();
        playEndSound(true);
      }
    };

    window.addEventListener('pomodoroStart', handleStart);
    window.addEventListener('pomodoroComplete', handleComplete);
    return () => {
      window.removeEventListener('pomodoroStart', handleStart);
      window.removeEventListener('pomodoroComplete', handleComplete);
    };
  }, [notifyBreakEnd, notifyBreakStart, notifyPomodoroEnd, notifyPomodoroStart, playEndSound, playStartSound, sessionNotes]);

  useEffect(() => {
    setSessionNotes(user ? getAccountStorage(user.id, 'pomodoro-session-notes', '') : '');
  }, [user]);

  useEffect(() => {
    if (user) setAccountStorage(user.id, 'pomodoro-session-notes', sessionNotes);
  }, [sessionNotes, user]);

  const updateSessionNotes = (notes: string) => setSessionNotes(notes);

  const saveNotes = async (): Promise<boolean> => {
    try {
      if (user) removeAccountStorage(user.id, 'pomodoro-session-notes');
      setSessionNotes('');
      return true;
    } catch {
      return false;
    }
  };

  const toggleTimer = useCallback(() => {
    if (timerState.isRunning) {
      pauseTimer();
    } else if (timerState.pausedRemaining !== null && timerState.pausedRemaining > 0) {
      resumeTimer();
    } else {
      // Determine session type
      let type: 'focus' | 'short-break' | 'long-break' = 'focus';
      if (isWaitingForUser) {
        // Next session after completion
        if (isBreak) {
          type = isLongBreak ? 'long-break' : 'short-break';
        } else {
          type = 'focus';
        }
        setIsWaitingForUser(false);
      }
      // If session duration is 0 (fresh), determine from current break state
      if (timerState.sessionDuration === 0) {
        // Starting fresh
      }
      startTimer(type, timerState.taskId, timerState.taskTitle, timerState.focusLabel);
    }
  }, [timerState, isWaitingForUser, isBreak, isLongBreak, pauseTimer, resumeTimer, startTimer, setIsWaitingForUser]);

  const handleSetIsBreak = useCallback((val: boolean) => {
    // Only allow changing when not active
    if (!timerState.isRunning && timerState.sessionDuration === 0) {
      // This is handled through startTimer with specific type
    }
  }, [timerState]);

  const handleSetIsLongBreak = useCallback((val: boolean) => {
    // Handled through startTimer
  }, []);

  return {
    isActive,
    isBreak,
    isLongBreak,
    minutes,
    seconds,
    progress,
    toggleTimer,
    resetTimer: stopTimer,
    setIsBreak: handleSetIsBreak,
    setIsLongBreak: handleSetIsLongBreak,
    shouldPromptForNoteSave,
    setShouldPromptForNoteSave,
    sessionNotes,
    updateSessionNotes,
    saveNotes,
    pomodorosUntilLongBreak,
    isWaitingForUser,
  };
};
