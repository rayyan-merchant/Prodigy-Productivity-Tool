import { supabase } from '@/integrations/supabase/client';
import type { Task } from '@/types/tasks';
import { getCurrentUser } from '@/lib/auth';
import { getAccountStorage, setAccountStorage } from '@/lib/accountStorage';
import { fingerprint } from '@/lib/fingerprint';
import { deterministicTaskOrder } from '@/lib/taskPriority';

export type AIResult<T> =
  | { ok: true; data: T; provider: string; generatedAt: string; cached: boolean }
  | { ok: false; code: 'auth' | 'validation' | 'quota' | 'provider' | 'malformed'; error: string };

interface EdgeSuccess<T> {
  success: true;
  data: T;
  provider: string;
  generatedAt: string;
}

interface EdgeFailure {
  success: false;
  code?: AIResult<never> extends { ok: false; code: infer Code } ? Code : never;
  error: string;
}

const callAI = async <T>(
  prompt: string,
  type: 'motivational-quote' | 'weekly-insights' | 'prioritize-tasks',
  context?: unknown,
  maxTokens = 400,
): Promise<AIResult<T>> => {
  const user = getCurrentUser();
  if (!user) return { ok: false, code: 'auth', error: 'Sign in to use AI assistance.' };
  if (prompt.length > 8_000) return { ok: false, code: 'validation', error: 'The AI request is too large.' };

  const cacheKey = `ai:${type}:${fingerprint({ prompt, context })}`;
  const cached = getAccountStorage<EdgeSuccess<T> | null>(user.id, cacheKey, null);
  if (cached && Date.now() - new Date(cached.generatedAt).getTime() < 4 * 60 * 60 * 1_000) {
    return { ok: true, data: cached.data, provider: cached.provider, generatedAt: cached.generatedAt, cached: true };
  }

  try {
    const { data, error } = await supabase.functions.invoke<EdgeSuccess<T> | EdgeFailure>('ai-service', {
      body: { prompt, type, context, maxTokens },
    });
    if (error) return { ok: false, code: 'provider', error: error.message || 'AI service is unavailable.' };
    if (!data?.success) return { ok: false, code: data?.code || 'provider', error: data?.error || 'AI request failed.' };
    setAccountStorage(user.id, cacheKey, data);
    return { ok: true, data: data.data, provider: data.provider, generatedAt: data.generatedAt, cached: false };
  } catch (error) {
    return { ok: false, code: 'provider', error: error instanceof Error ? error.message : 'AI request failed.' };
  }
};

export const getMotivationalQuote = (): Promise<AIResult<string>> =>
  callAI('Write one original, practical sentence about focus. Use under 100 characters and do not attribute it to a person.', 'motivational-quote', undefined, 80);

export const generateWeeklyInsights = (data: {
  completedTasks: number;
  focusHours: number;
  sessionsCompleted: number;
}): Promise<AIResult<string>> =>
  callAI(
    `Explain this weekly productivity data in 50-80 words and give one specific improvement: ${JSON.stringify(data)}`,
    'weekly-insights',
    data,
    180,
  );

export { deterministicTaskOrder } from '@/lib/taskPriority';

export const prioritizeTasks = async (
  tasks: Task[],
): Promise<AIResult<{ order: string[]; rationaleSource: 'deterministic' | 'ai-refined' }>> => {
  const limited = tasks.filter((task) => task.status !== 'completed').slice(0, 50);
  const fallback = deterministicTaskOrder(limited);
  if (limited.length < 2) {
    return { ok: true, data: { order: fallback, rationaleSource: 'deterministic' }, provider: 'Prodigy scoring', generatedAt: new Date().toISOString(), cached: false };
  }
  const submittedIds = new Set(limited.map((task) => task.id));
  const prompt = `Return only a JSON array containing each submitted task ID exactly once. Refine the deterministic order using the supplied title and description, but preserve urgency signals. Tasks: ${JSON.stringify(limited.map((task) => ({
    id: task.id,
    title: task.title.slice(0, 120),
    description: task.description.slice(0, 500),
    priority: task.priority,
    status: task.status,
    dueDate: task.dueDate,
    estimatedTime: task.estimatedTime,
  })))}. Deterministic order: ${JSON.stringify(fallback)}`;
  const result = await callAI<string[]>(prompt, 'prioritize-tasks', { tasks: limited }, 500);
  if (!result.ok) {
    return { ok: true, data: { order: fallback, rationaleSource: 'deterministic' }, provider: 'Prodigy scoring', generatedAt: new Date().toISOString(), cached: false };
  }
  const valid = result.data.length === submittedIds.size
    && new Set(result.data).size === submittedIds.size
    && result.data.every((id) => submittedIds.has(id));
  if (!valid) {
    return { ok: true, data: { order: fallback, rationaleSource: 'deterministic' }, provider: 'Prodigy scoring', generatedAt: new Date().toISOString(), cached: false };
  }
  return { ...result, data: { order: result.data, rationaleSource: 'ai-refined' } };
};
