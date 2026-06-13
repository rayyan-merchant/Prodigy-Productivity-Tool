
export interface Habit {
  id: string;
  name: string;
  description: string;
  category: 'health' | 'productivity' | 'personal' | 'learning' | 'other';
  frequency: 'daily' | 'weekly';
  targetStreak: number;
  completedDates: string[];
  currentStreak: number;
  longestStreak: number;
  bestStreak: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  type: 'task' | 'note' | 'habit' | 'session' | 'goal' | 'settings';
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}
