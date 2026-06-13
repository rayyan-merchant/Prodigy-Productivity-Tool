import { parseLocalDate, startOfLocalDay } from '@/lib/dateOnly';
import type { Task } from '@/types/tasks';

export const deterministicTaskOrder = (tasks: Task[], now = new Date()): string[] => {
  const today = startOfLocalDay(now).getTime();
  const priorityWeight = { high: 35, medium: 20, low: 8 };
  const statusWeight: Record<Task['status'], number> = { 'in-progress': 12, todo: 5, completed: -1_000 };

  const score = (task: Task) => {
    const due = task.dueDate ? parseLocalDate(task.dueDate).getTime() : today + 90 * 86_400_000;
    const days = Math.floor((due - today) / 86_400_000);
    const deadline = days < 0 ? 70 + Math.min(30, Math.abs(days) * 3) : Math.max(0, 45 - days * 5);
    const effort = task.estimatedTime ? Math.max(0, 12 - Math.min(task.estimatedTime, 240) / 20) : 3;
    return priorityWeight[task.priority] + statusWeight[task.status] + deadline + effort;
  };

  return [...tasks]
    .sort((left, right) => score(right) - score(left) || left.title.localeCompare(right.title))
    .map((task) => task.id);
};
