import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import SubtaskManager, { Subtask } from '@/components/tasks/SubtaskManager';
import TagPicker, { addToGlobalTags } from '@/components/TagPicker';
import { taskSchema } from '@/lib/validation';
import { isPastDateOnly, normalizeDateOnly, toLocalDateKey } from '@/lib/dateOnly';

const taskFormSchema = taskSchema.omit({ tags: true }).extend({
  estimatedTime: z.coerce.number().int().min(1).max(1_440).optional().or(z.literal('')),
});

type FormValues = z.input<typeof taskFormSchema>;
type ParsedFormValues = z.output<typeof taskFormSchema>;

export interface TaskFormSubmission extends Omit<ParsedFormValues, 'estimatedTime'> {
  estimatedTime?: number;
  subtasks: Subtask[];
  tags: string[];
}

interface TaskFormProps {
  onSubmit: (values: TaskFormSubmission) => Promise<void> | void;
  onCancel: () => void;
  initialData?: Partial<TaskFormSubmission> | null;
}

const TaskForm: React.FC<TaskFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const [subtasks, setSubtasks] = React.useState<Subtask[]>(initialData?.subtasks || []);
  const [tags, setTags] = React.useState<string[]>(initialData?.tags || []);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const initialDueDate = normalizeDateOnly(initialData?.dueDate) || toLocalDateKey();
  const minimumDueDate = isPastDateOnly(initialDueDate) ? initialDueDate : toLocalDateKey();

  const form = useForm<FormValues, unknown, ParsedFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      priority: initialData?.priority || 'medium',
      status: initialData?.status || 'todo',
      dueDate: initialDueDate,
      recurrence: initialData?.recurrence || 'none',
      project: initialData?.project || '',
      estimatedTime: initialData?.estimatedTime || '',
    },
  });

  const handleSubmit = async (values: ParsedFormValues) => {
    const normalizedTags = tags.map((tag) => tag.trim()).filter(Boolean);
    const longTag = normalizedTags.find((tag) => tag.length > 24);
    if (longTag) {
      form.setError('title', { message: `Tag "${longTag}" must be 24 characters or fewer` });
      return;
    }
    setIsSubmitting(true);
    try {
      if (normalizedTags.length > 0) addToGlobalTags(normalizedTags);
      await onSubmit({
        ...values,
        estimatedTime: values.estimatedTime === '' ? undefined : values.estimatedTime,
        subtasks,
        tags: normalizedTags,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem>
            <FormLabel>Title</FormLabel>
            <FormControl><Input maxLength={120} placeholder="What needs to be done?" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl><Textarea maxLength={2_000} placeholder="Add useful context (optional)" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid gap-3 sm:grid-cols-2">
          <FormField control={form.control} name="priority" render={({ field }) => (
            <FormItem>
              <FormLabel>Priority</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="status" render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="todo">To do</SelectItem>
                  <SelectItem value="in-progress">In progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <FormField control={form.control} name="dueDate" render={({ field }) => (
            <FormItem>
              <FormLabel>Due date</FormLabel>
              <FormControl><Input type="date" min={minimumDueDate} {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="recurrence" render={({ field }) => (
            <FormItem>
              <FormLabel>Repeat</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="none">Does not repeat</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <FormField control={form.control} name="project" render={({ field }) => (
            <FormItem>
              <FormLabel>Project</FormLabel>
              <FormControl><Input maxLength={80} placeholder="Optional" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="estimatedTime" render={({ field }) => (
            <FormItem>
              <FormLabel>Estimate (minutes)</FormLabel>
              <FormControl><Input type="number" min={1} max={1_440} placeholder="25" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="space-y-1.5">
          <FormLabel>Tags</FormLabel>
          <TagPicker selectedTags={tags} onTagsChange={setTags} placeholder="Add tags..." />
          <p className="text-xs text-muted-foreground">Up to 24 characters per tag.</p>
        </div>

        <div className="space-y-1.5">
          <FormLabel>Subtasks</FormLabel>
          <SubtaskManager subtasks={subtasks} onChange={setSubtasks} />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : initialData ? 'Update task' : 'Create task'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default TaskForm;
