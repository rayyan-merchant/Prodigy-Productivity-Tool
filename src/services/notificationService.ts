import { getCurrentUser } from '@/lib/auth';
import type { Notification } from '@/types/notifications';

// Re-export the Notification type
export type { Notification } from '@/types/notifications';

// Notification sound utility
let audioContext: AudioContext | null = null;

const initAudioContext = () => {
  if (!audioContext) {
    const AudioContextConstructor = window.AudioContext
      || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioContext = new AudioContextConstructor();
  }
  return audioContext;
};

const playNotificationSound = () => {
  try {
    const context = initAudioContext();
    const frequencies = [800, 600, 400];
    
    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        oscillator.frequency.setValueAtTime(freq, context.currentTime);
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0, context.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, context.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);
        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + 0.3);
      }, index * 200);
    });
  } catch (error) {
    console.error('Error playing notification sound:', error);
  }
};

const areNotificationsEnabled = (): boolean => {
  return localStorage.getItem('notifications-enabled') !== 'false';
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
};

const showBrowserNotification = (title: string, message: string, icon?: string) => {
  if (!areNotificationsEnabled()) return;
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body: message,
      icon: icon || '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'productivity-app',
      requireInteraction: false,
      silent: false
    });
    setTimeout(() => notification.close(), 5000);
    playNotificationSound();
  }
};

// Store notifications in localStorage
const NOTIF_KEY = 'app_notifications';

const getStoredNotifications = (userId: string): Notification[] => {
  try {
    const stored = localStorage.getItem(`${NOTIF_KEY}_${userId}`);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveNotifications = (userId: string, notifications: Notification[]) => {
  localStorage.setItem(`${NOTIF_KEY}_${userId}`, JSON.stringify(notifications.slice(0, 50)));
};

export const getUserNotifications = async (): Promise<Notification[]> => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');
    return getStoredNotifications(user.id);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');
    
    const notifications = getStoredNotifications(user.id);
    const updated = notifications.map(n => n.id === notificationId ? { ...n, read: true } : n);
    saveNotifications(user.id, updated);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

export const createNotification = async (notification: Partial<Notification>): Promise<string> => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const id = crypto.randomUUID();
    const notificationData: Notification = {
      id,
      title: notification.title || '',
      message: notification.message || '',
      description: notification.description || '',
      type: notification.type || 'info',
      read: false,
      userId: user.id,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const notifications = getStoredNotifications(user.id);
    notifications.unshift(notificationData);
    saveNotifications(user.id, notifications);
    
    showBrowserNotification(notificationData.title, notificationData.message);
    
    return id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Specific notification types
export const sendPomodoroNotification = async (type: 'session_start' | 'session_end' | 'break_start' | 'break_end' | 'long_break_start') => {
  const notifications = {
    'session_start': { title: '🍅 Focus Time!', message: 'Your Pomodoro session has started. Time to focus!', type: 'info' as const },
    'session_end': { title: '🎉 Session Complete!', message: 'Great work! You completed a focus session. Time for a break.', type: 'success' as const },
    'break_start': { title: '☕ Break Time!', message: 'Take a short break. You deserve it!', type: 'info' as const },
    'break_end': { title: '⚡ Back to Work!', message: 'Break time is over. Ready for another focus session?', type: 'info' as const },
    'long_break_start': { title: '🌟 Long Break Time!', message: 'You earned a longer break. Recharge and come back strong!', type: 'success' as const }
  };
  const notif = notifications[type];
  await createNotification(notif);
};

export const sendGoalMotivationNotification = async (goalTitle: string, progress: number) => {
  const messages = [
    `🎯 Keep pushing towards "${goalTitle}"! You're ${progress}% there.`,
    `💪 "${goalTitle}" is within reach. Stay focused!`,
    `🚀 Great progress on "${goalTitle}"! Don't stop now.`
  ];
  await createNotification({ title: 'Goal Progress Update', message: messages[Math.floor(Math.random() * messages.length)], type: 'info' });
};

export const sendHabitReminderNotification = async (habitName: string, streak: number) => {
  const messages = [
    `🔥 Don't break your ${streak}-day streak for "${habitName}"!`,
    `⭐ Time for "${habitName}" - keep the momentum going!`,
    `💎 Your "${habitName}" habit is building discipline. Stay consistent!`
  ];
  await createNotification({ title: 'Habit Reminder', message: messages[Math.floor(Math.random() * messages.length)], type: 'info' });
};

export const sendDeadlineReminderNotification = async (taskTitle: string, daysLeft: number) => {
  const urgencyLevel = daysLeft <= 1 ? 'urgent' : daysLeft <= 3 ? 'warning' : 'info';
  const messages = {
    urgent: `🚨 "${taskTitle}" is due ${daysLeft === 0 ? 'today' : 'tomorrow'}!`,
    warning: `⚠️ "${taskTitle}" is due in ${daysLeft} days.`,
    info: `📅 Reminder: "${taskTitle}" is due in ${daysLeft} days.`
  };
  await createNotification({ title: 'Deadline Reminder', message: messages[urgencyLevel], type: urgencyLevel === 'urgent' ? 'error' : urgencyLevel === 'warning' ? 'warning' : 'info' });
};

export const sendMotivationalNotification = async () => {
  const motivationalMessages = [
    { title: '🌟 Stay Motivated!', message: 'Every small step counts. You\'re building something amazing!' },
    { title: '💪 Keep Going!', message: 'Progress, not perfection. You\'re doing better than you think.' },
    { title: '🎯 Focus Reminder', message: 'Take a moment to prioritize what matters most today.' },
    { title: '🧘 Wellness Check', message: 'Remember to take breaks, stretch, and stay hydrated.' },
    { title: '🚀 You Got This!', message: 'Challenges are opportunities in disguise. Keep pushing forward!' },
  ];
  const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
  await createNotification(randomMessage);
};

export const setNotificationsEnabled = (enabled: boolean) => {
  localStorage.setItem('notifications-enabled', enabled.toString());
};

export const getNotificationsEnabled = (): boolean => {
  return localStorage.getItem('notifications-enabled') !== 'false';
};
