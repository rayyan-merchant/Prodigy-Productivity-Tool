import { supabase } from '@/integrations/supabase/client';
import type { Database, Json } from '@/integrations/supabase/types';
import type { Subtask, Task } from '@/types/tasks';
import { getCurrentUser } from '@/lib/auth';
import { createTaskActivity } from '@/services/activityService';
import { assertNewDueDate } from '@/lib/validation';
import { isPastDateOnly, nextRecurringDate, normalizeDateOnly } from '@/lib/dateOnly';

export type { Task } from '@/types/tasks';

type TaskRow = Database['public']['Tables']['tasks']['Row'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
type TaskUpdate = Database['public']['Tables']['tasks']['Update'];

const mapTask = (task: TaskRow): Task => ({
  id: task.id,
  title: task.title,
  description: task.description || '',
  completed: task.completed,
  priority: task.priority as Task['priority'],
  status: task.status as Task['status'],
  dueDate: task.due_on ?? normalizeDateOnly(task.due_date),
  completedAt: task.completed_at ?? undefined,
  estimatedTime: task.estimated_time ?? undefined,
  tags: task.tags || [],
  project: task.project ?? undefined,
  recurrence: (task.recurrence || 'none') as Task['recurrence'],
  subtasks: Array.isArray(task.subtasks) ? task.subtasks as unknown as Subtask[] : [],
  createdAt: task.created_at,
  userId: task.user_id,
});

const requireUser = () => {
  const user = getCurrentUser();
  if (!user) throw new Error('Your session has expired. Sign in again.');
  return user;
};

const requireOnline = () => {
  if (!navigator.onLine) throw new Error('Tasks are read-only while you are offline.');
};

const completedFields = (status: Task['status']): Pick<TaskUpdate, 'status' | 'completed' | 'completed_at'> =>
  status === 'completed'
    ? { status, completed: true, completed_at: new Date().toISOString() }
    : { status, completed: false, completed_at: null };

const createNextOccurrence = async (source: TaskRow, userId: string) => {
  const recurrence = source.recurrence as Task['recurrence'];
  const sourceDate = source.due_on ?? normalizeDateOnly(source.due_date);
  if (!sourceDate || !recurrence || recurrence === 'none') return;

  const dueOn = nextRecurringDate(sourceDate, recurrence);
  const recurrenceParentId = source.recurrence_parent_id ?? source.id;
  const recurrenceInstanceKey = `${recurrenceParentId}:${dueOn}`;
  const nextTask: TaskInsert = {
    title: source.title,
    description: source.description,
    completed: false,
    priority: source.priority,
    status: 'todo',
    due_on: dueOn,
    due_date: null,
    completed_at: null,
    estimated_time: source.estimated_time,
    tags: source.tags,
    project: source.project,
    recurrence: source.recurrence,
    subtasks: source.subtasks,
    user_id: userId,
    recurrence_parent_id: recurrenceParentId,
    recurrence_instance_key: recurrenceInstanceKey,
  };

  const { error } = await supabase
    .from('tasks')
    .upsert(nextTask, { onConflict: 'user_id,recurrence_instance_key', ignoreDuplicates: true });
  if (error) throw error;
};

export const getUserTasks = async (): Promise<Task[]> => {
  const user = requireUser();
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapTask);
};

export const getTasks = getUserTasks;

export const getTasksByStatus = async (status?: string): Promise<Task[]> => {
  const tasks = await getUserTasks();
  return status ? tasks.filter((task) => task.status === status) : tasks;
};

export const createTask = async (task: Omit<Task, 'id' | 'createdAt' | 'userId'>): Promise<Task> => {
  requireOnline();
  const user = requireUser();
  assertNewDueDate(task.dueDate);
  const statusFields = completedFields(task.status);
  const insert: TaskInsert = {
    title: task.title.trim(),
    description: task.description.trim(),
    priority: task.priority,
    due_on: task.dueDate,
    due_date: null,
    estimated_time: task.estimatedTime,
    tags: task.tags || [],
    project: task.project?.trim() || null,
    recurrence: task.recurrence || 'none',
    subtasks: (task.subtasks || []) as unknown as Json,
    user_id: user.id,
    ...statusFields,
  };
  const { data, error } = await supabase.from('tasks').insert(insert).select().single();
  if (error) throw error;
  await createTaskActivity('New task created', `"${data.title}" was created`, data.id);
  return mapTask(data);
};

export const addTask = createTask;

export const getTaskById = async (id: string): Promise<Task | null> => {
  const user = requireUser();
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapTask(data) : null;
};

export const updateTask = async (id: string, updates: Partial<Task>): Promise<Task> => {
  requireOnline();
  const user = requireUser();
  const { data: original, error: fetchError } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();
  if (fetchError) throw fetchError;

  if (updates.dueDate !== undefined && updates.dueDate !== original.due_on) {
    assertNewDueDate(updates.dueDate);
  } else if (updates.dueDate && isPastDateOnly(updates.dueDate)) {
    // Existing overdue dates remain editable when the due date itself is unchanged.
    delete updates.dueDate;
  }

  const update: TaskUpdate = {};
  if (updates.title !== undefined) update.title = updates.title.trim();
  if (updates.description !== undefined) update.description = updates.description.trim();
  if (updates.priority !== undefined) update.priority = updates.priority;
  if (updates.dueDate !== undefined) {
    update.due_on = updates.dueDate;
    update.due_date = null;
  }
  if (updates.estimatedTime !== undefined) update.estimated_time = updates.estimatedTime;
  if (updates.tags !== undefined) update.tags = updates.tags;
  if (updates.project !== undefined) update.project = updates.project?.trim() || null;
  if (updates.recurrence !== undefined) update.recurrence = updates.recurrence;
  if (updates.subtasks !== undefined) update.subtasks = updates.subtasks as unknown as Json;

  const nextStatus = updates.status ?? (updates.completed === true ? 'completed' : updates.completed === false ? 'todo' : undefined);
  if (nextStatus) Object.assign(update, completedFields(nextStatus));

  const { data, error } = await supabase
    .from('tasks')
    .update(update)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();
  if (error) throw error;

  if (original.status !== 'completed' && data.status === 'completed') {
    await createNextOccurrence(data, user.id);
  }
  if (original.status !== data.status) {
    await createTaskActivity('Task status updated', `"${data.title}" moved to ${data.status}`, id);
  }
  return mapTask(data);
};

export const deleteTask = async (id: string): Promise<void> => {
  requireOnline();
  const user = requireUser();
  const task = await getTaskById(id);
  const { error } = await supabase.from('tasks').delete().eq('id', id).eq('user_id', user.id);
  if (error) throw error;
  await createTaskActivity('Task deleted', `"${task?.title || 'Task'}" was deleted`, id);
};
