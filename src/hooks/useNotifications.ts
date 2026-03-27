import { useEffect, useCallback } from 'react';
import {
  requestNotificationPermission,
  sendPomodoroNotification,
  sendGoalMotivationNotification,
  sendHabitReminderNotification,
  sendDeadlineReminderNotification,
  sendMotivationalNotification,
  getNotificationsEnabled
} from '@/services/notificationService';
import { getTasks } from '@/services/taskService';

export const useNotifications = () => {

  useEffect(() => {
    const initNotifications = async () => {
      if (getNotificationsEnabled()) {
        await requestNotificationPermission();
      }
    };

    initNotifications();
  }, []);

  useEffect(() => {
    if (!getNotificationsEnabled()) return;

    const scheduleRandomNotifications = () => {
      const now = new Date();
      const hour = now.getHours();

      if (hour >= 9 && hour <= 18) {

        const randomInterval = (2 + Math.random() * 2) * 60 * 60 * 1000;

        setTimeout(() => {
          sendMotivationalNotification();
          scheduleRandomNotifications();
        }, randomInterval);
      } else {

        setTimeout(scheduleRandomNotifications, 60 * 60 * 1000);
      }
    };

    scheduleRandomNotifications();
  }, []);

  useEffect(() => {
    if (!getNotificationsEnabled()) return;

    const checkDeadlines = async () => {
      try {
        const tasks = await getTasks();
        const now = new Date();

        tasks.forEach(task => {
          if (task.dueDate && task.status !== 'completed') {
            const dueDate = new Date(task.dueDate);
            const timeDiff = dueDate.getTime() - now.getTime();
            const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

            if (daysLeft === 1 || daysLeft === 3 || daysLeft === 7) {
              sendDeadlineReminderNotification(task.title, daysLeft);
            }
          }
        });
      } catch (error) {
        console.error('Error checking deadlines:', error);
      }
    };

    checkDeadlines();
    const interval = setInterval(checkDeadlines, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const notifyPomodoroStart = useCallback(() => {
    if (getNotificationsEnabled()) {
      sendPomodoroNotification('session_start');
    }
  }, []);

  const notifyPomodoroEnd = useCallback(() => {
    if (getNotificationsEnabled()) {
      sendPomodoroNotification('session_end');
    }
  }, []);

  const notifyBreakStart = useCallback((isLong: boolean = false) => {
    if (getNotificationsEnabled()) {
      sendPomodoroNotification(isLong ? 'long_break_start' : 'break_start');
    }
  }, []);

  const notifyBreakEnd = useCallback(() => {
    if (getNotificationsEnabled()) {
      sendPomodoroNotification('break_end');
    }
  }, []);

  const notifyGoalProgress = useCallback((goalTitle: string, progress: number) => {
    if (getNotificationsEnabled()) {
      sendGoalMotivationNotification(goalTitle, progress);
    }
  }, []);

  const notifyHabitReminder = useCallback((habitName: string, streak: number) => {
    if (getNotificationsEnabled()) {
      sendHabitReminderNotification(habitName, streak);
    }
  }, []);

  return {
    notifyPomodoroStart,
    notifyPomodoroEnd,
    notifyBreakStart,
    notifyBreakEnd,
    notifyGoalProgress,
    notifyHabitReminder,
    requestPermission: requestNotificationPermission
  };
};
