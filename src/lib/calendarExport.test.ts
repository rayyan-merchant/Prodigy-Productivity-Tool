import { describe, expect, it } from 'vitest';
import { tasksToIcs } from '@/lib/calendarExport';
import type { Task } from '@/types/tasks';

const task: Task = {
  id: '123',
  title: 'Review, plan; ship',
  description: 'Line one\nLine two',
  completed: false,
  priority: 'high',
  dueDate: '2026-06-12',
  createdAt: '2026-06-01T00:00:00Z',
  userId: 'user',
  status: 'todo',
};

describe('calendar export', () => {
  it('uses an exclusive next-day end date and escapes ICS text', () => {
    const output = tasksToIcs([task]);
    expect(output).toContain('DTSTART;VALUE=DATE:20260612');
    expect(output).toContain('DTEND;VALUE=DATE:20260613');
    expect(output).toContain('SUMMARY:Review\\, plan\\; ship');
    expect(output).toContain('Line one\\nLine two');
    expect(output).toMatch(/\r\n/);
  });
});
