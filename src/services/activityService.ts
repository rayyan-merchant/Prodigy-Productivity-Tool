import { getCurrentUser } from '@/lib/auth';
import { Activity } from '@/types/habits';

// Store activities in localStorage as interim solution
const ACTIVITIES_KEY = 'app_activities';

const getStoredActivities = (userId: string): Activity[] => {
  try {
    const stored = localStorage.getItem(`${ACTIVITIES_KEY}_${userId}`);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveActivities = (userId: string, activities: Activity[]) => {
  localStorage.setItem(`${ACTIVITIES_KEY}_${userId}`, JSON.stringify(activities.slice(0, 100)));
};

// Create a new activity entry
export const createActivity = async (activityData: Omit<Activity, 'id' | 'timestamp'>): Promise<void> => {
  try {
    const user = getCurrentUser();
    if (!user) return;

    const activities = getStoredActivities(user.id);
    const newActivity: Activity = {
      id: crypto.randomUUID(),
      ...activityData,
      timestamp: new Date().toISOString()
    };
    
    activities.unshift(newActivity);
    saveActivities(user.id, activities);
  } catch (error) {
    console.error('Error creating activity:', error);
  }
};

// Get recent activities for the current user
export const getRecentActivities = async (limitCount: number = 10): Promise<Activity[]> => {
  try {
    const user = getCurrentUser();
    if (!user) return [];

    return getStoredActivities(user.id).slice(0, limitCount);
  } catch (error) {
    console.error('Error getting activities:', error);
    return [];
  }
};

// Helper functions to create specific activity types
export const createTaskActivity = async (title: string, description: string, taskId: string) => {
  await createActivity({ type: 'task', title, description, metadata: { taskId } });
};

export const createNoteActivity = async (title: string, description: string, noteId: string) => {
  await createActivity({ type: 'note', title, description, metadata: { noteId } });
};

export const createHabitActivity = async (title: string, description: string, habitId: string, streak?: number) => {
  await createActivity({ type: 'habit', title, description, metadata: { habitId, streak } });
};

export const createSessionActivity = async (title: string, description: string, duration: number) => {
  await createActivity({ type: 'session', title, description, metadata: { duration } });
};

export const createGoalActivity = async (title: string, description: string, goalId: string, progress?: number) => {
  await createActivity({ type: 'goal', title, description, metadata: { goalId, progress } });
};

export const createSettingsActivity = async (title: string, description: string, settingType: string) => {
  await createActivity({ type: 'settings', title, description, metadata: { settingType } });
};