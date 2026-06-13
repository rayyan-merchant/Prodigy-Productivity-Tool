import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import {
  getNotificationsEnabled,
  createNotification,
  requestNotificationPermission,
} from '@/services/notificationService';
import { getTodayWaterIntake, getWaterSettings } from '@/services/waterService';
import { getCurrentUser } from '@/lib/auth';

const LAST_REMINDER_KEY = 'water-last-reminder';
const REMINDER_MESSAGES = [
  { title: '💧 Time to hydrate!', message: "You haven't logged water in a while. Take a sip!" },
  { title: '💧 Water break!', message: 'Stay hydrated to keep your focus sharp.' },
  { title: '💧 Drink up!', message: 'A glass of water now will boost your energy.' },
  { title: '💧 Hydration check', message: "Your body needs water to perform at its best." },
  { title: '💧 Quick reminder', message: 'Grab your water bottle — every sip counts!' },
];

export const useHydrationReminders = () => {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkAndRemind = useCallback(async () => {
    try {
      const user = getCurrentUser();
      if (!user) return;

      // Check if reminders are enabled globally
      if (!getNotificationsEnabled()) return;

      // Load user's water settings
      const settings = await getWaterSettings();
      if (!settings?.reminders_enabled) return;

      const intervalMinutes = settings.reminder_interval_minutes || 60;
      const goalMl = settings.daily_goal_ml || 2000;

      // Check last reminder time
      const lastReminder = localStorage.getItem(LAST_REMINDER_KEY);
      const now = Date.now();
      if (lastReminder) {
        const elapsed = now - parseInt(lastReminder, 10);
        if (elapsed < intervalMinutes * 60 * 1000) return; // Too soon
      }

      // Check today's intake
      const todayEntries = await getTodayWaterIntake();
      const todayTotal = todayEntries.reduce((s, e) => s + e.amount_ml, 0);

      // Don't remind if goal already met
      if (todayTotal >= goalMl) return;

      // Check time since last water log
      const lastEntry = todayEntries[0]; // sorted desc
      if (lastEntry) {
        const timeSinceLastLog = now - new Date(lastEntry.logged_at).getTime();
        // Only remind if it's been at least the interval since last log
        if (timeSinceLastLog < intervalMinutes * 60 * 1000) return;
      }

      // Only during reasonable hours (7 AM - 10 PM)
      const hour = new Date().getHours();
      if (hour < 7 || hour > 22) return;

      // Send reminder
      const remaining = goalMl - todayTotal;
      const randomMsg = REMINDER_MESSAGES[Math.floor(Math.random() * REMINDER_MESSAGES.length)];

      // In-app toast
      toast(randomMsg.title, {
        description: `${randomMsg.message} (${remaining}ml remaining today)`,
        action: {
          label: 'Log Water',
          onClick: () => {
            window.location.href = '/water';
          },
        },
        duration: 10000,
      });

      // Browser notification
      await createNotification({
        title: randomMsg.title,
        message: `${randomMsg.message} — ${remaining}ml remaining today`,
        type: 'info',
      });

      localStorage.setItem(LAST_REMINDER_KEY, now.toString());
    } catch (error) {
      console.error('Hydration reminder error:', error);
    }
  }, []);

  useEffect(() => {
    // Request permission on mount
    requestNotificationPermission();

    // Initial check after 2 minutes (let app settle)
    const initialTimeout = setTimeout(() => {
      checkAndRemind();
    }, 2 * 60 * 1000);

    // Then check every 15 minutes (the actual interval gating is inside checkAndRemind)
    intervalRef.current = setInterval(checkAndRemind, 15 * 60 * 1000);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [checkAndRemind]);
};
