import { Task } from './tasks';
import { Note } from './notes';

export interface UnifiedTask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  createdAt: string;
  userId: string;
  tags?: string[];
  project?: string;
  estimatedTime?: number;
  status: 'todo' | 'in-progress' | 'completed';
  completedAt?: Date;
}

export type { Task } from './tasks';
