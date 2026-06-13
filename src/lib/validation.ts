import { z } from 'zod';
import { isPastDateOnly, normalizeDateOnly } from '@/lib/dateOnly';

export const taskSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(120, 'Title must be 120 characters or fewer'),
  description: z.string().trim().max(2_000, 'Description must be 2,000 characters or fewer').default(''),
  priority: z.enum(['low', 'medium', 'high']),
  status: z.enum(['todo', 'in-progress', 'completed']),
  dueDate: z.string().refine((value) => Boolean(normalizeDateOnly(value)), 'Choose a valid due date'),
  tags: z.array(z.string().trim().min(1).max(24, 'Each tag must be 24 characters or fewer')).max(12),
  project: z.string().trim().max(80, 'Project must be 80 characters or fewer').optional(),
  estimatedTime: z.number().int().min(1).max(1_440).optional(),
  recurrence: z.enum(['none', 'daily', 'weekly', 'monthly']),
});

export const assertNewDueDate = (dueDate?: string) => {
  if (!dueDate || !normalizeDateOnly(dueDate)) throw new Error('Choose a valid due date');
  if (isPastDateOnly(dueDate)) throw new Error('Due date must be today or later');
};

export const habitSchema = z.object({
  name: z.string().trim().min(1, 'Habit name is required').max(80, 'Habit name must be 80 characters or fewer'),
  description: z.string().trim().max(1_000, 'Description must be 1,000 characters or fewer').default(''),
  frequency: z.enum(['daily', 'weekly']),
  category: z.string().trim().min(1).max(40),
  targetStreak: z.number().int().min(1, 'Target must be at least 1').max(3_650, 'Target must be 3,650 or fewer'),
});

export const waterAmountSchema = z.number().int().min(1, 'Enter at least 1 ml').max(2_000, 'Entries are limited to 2,000 ml');
export const bioSchema = z.string().trim().max(500, 'Bio must be 500 characters or fewer');
export const focusLabelSchema = z.string().trim().max(80, 'Focus label must be 80 characters or fewer');
