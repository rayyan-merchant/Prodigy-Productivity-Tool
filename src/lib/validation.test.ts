import { describe, expect, it } from 'vitest';
import { bioSchema, habitSchema, taskSchema, waterAmountSchema } from './validation';

describe('input validation boundaries', () => {
  it('trims and validates task titles and descriptions', () => {
    const result = taskSchema.safeParse({
      title: '  QA task  ', description: '  details  ', priority: 'high', status: 'todo',
      dueDate: '2026-08-23', tags: ['qa'], recurrence: 'none', estimatedTime: 25,
    });
    expect(result.success).toBe(true);
    expect(result.data?.title).toBe('QA task');
    expect(taskSchema.safeParse({ ...result.data, title: ' ' }).success).toBe(false);
    expect(taskSchema.safeParse({ ...result.data, title: 'x'.repeat(121) }).success).toBe(false);
  });

  it('rejects invalid habit, water, and bio values', () => {
    expect(habitSchema.safeParse({ name: 'Habit', description: '', frequency: 'monthly', category: 'health', targetStreak: 1 }).success).toBe(false);
    expect(waterAmountSchema.safeParse(0).success).toBe(false);
    expect(waterAmountSchema.safeParse(2_001).success).toBe(false);
    expect(bioSchema.safeParse('x'.repeat(501)).success).toBe(false);
  });
});
