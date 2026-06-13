import { describe, expect, it } from 'vitest';
import { deterministicTaskOrder } from '@/lib/taskPriority';
import type { Task } from '@/types/tasks';

const task = (overrides: Partial<Task>): Task => ({
  id: 'task',
  title: 'Task',
  description: '',
  completed: false,
  priority: 'medium',
  dueDate: '2026-06-20',
  createdAt: '2026-06-01T00:00:00Z',
  userId: 'user',
  status: 'todo',
  ...overrides,
});

describe('deterministic task priority', () => {
  it('ranks overdue and active work ahead of distant work', () => {
    const order = deterministicTaskOrder([
      task({ id: 'distant', priority: 'low', dueDate: '2026-08-01' }),
      task({ id: 'overdue', priority: 'high', dueDate: '2026-06-01' }),
      task({ id: 'active', status: 'in-progress', dueDate: '2026-06-13' }),
    ], new Date(2026, 5, 12));

    expect(order[0]).toBe('overdue');
    expect(order.at(-1)).toBe('distant');
  });

  it('pushes completed tasks to the bottom', () => {
    const order = deterministicTaskOrder([
      task({ id: 'completed', status: 'completed', completed: true, priority: 'high', dueDate: '2026-06-01' }),
      task({ id: 'open', priority: 'low', dueDate: '2026-08-01' }),
    ], new Date(2026, 5, 12));

    expect(order).toEqual(['open', 'completed']);
  });
});
