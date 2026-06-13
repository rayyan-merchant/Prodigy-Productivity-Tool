import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, ChevronDown, Edit, Repeat, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SubtaskProgress } from '@/components/tasks/SubtaskManager';
import { getTagColor } from '@/components/TagPicker';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatDateOnly } from '@/lib/dateOnly';
import type { Task } from '@/types/tasks';

export type { Task } from '@/types/tasks';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, newStatus: Task['status']) => void;
}

const statusLabels: Record<Task['status'], string> = {
  todo: 'To do',
  'in-progress': 'In progress',
  completed: 'Completed',
};

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete, onStatusChange }) => {
  const priorityColors = {
    low: 'bg-muted text-muted-foreground',
    medium: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    high: 'bg-destructive/10 text-destructive',
  };
  const statusColors = {
    todo: 'bg-muted text-muted-foreground',
    'in-progress': 'bg-primary/10 text-primary',
    completed: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  };

  return (
    <Card className={cn('h-full overflow-hidden', task.status === 'completed' && 'border-emerald-500/20 bg-emerald-500/[0.03]')}>
      <CardHeader className="pb-2">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <CardTitle className="flex min-w-0 items-center gap-2 text-base font-semibold">
            {task.status === 'completed' && <CheckCircle size={16} className="shrink-0 text-emerald-600" />}
            <span className="break-words">{task.title}</span>
          </CardTitle>
          <div className="flex shrink-0 items-center gap-1">
            {task.recurrence && task.recurrence !== 'none' && (
              <Badge variant="outline" className="gap-1 text-[10px]"><Repeat size={9} />{task.recurrence}</Badge>
            )}
            <Badge className={priorityColors[task.priority]}>{task.priority}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {task.description && <p className="mb-3 break-words text-sm text-muted-foreground">{task.description}</p>}
        {task.tags && task.tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {task.tags.map((tag) => <Badge key={tag} className={cn('max-w-full truncate px-1.5 py-0 text-[10px]', getTagColor(tag))}>{tag}</Badge>)}
          </div>
        )}
        {task.subtasks && task.subtasks.length > 0 && <div className="mb-3"><SubtaskProgress subtasks={task.subtasks} /></div>}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className={cn('h-8 gap-1', statusColors[task.status])}>
                {statusLabels[task.status]}<ChevronDown size={13} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {(Object.keys(statusLabels) as Task['status'][]).map((status) => (
                <DropdownMenuItem key={status} disabled={status === task.status} onSelect={() => onStatusChange(task.id, status)}>
                  {statusLabels[status]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <span className="text-xs text-muted-foreground">Due {formatDateOnly(task.dueDate)}</span>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => onEdit(task)} className="h-8 w-8" aria-label={`Edit ${task.title}`}>
              <Edit size={15} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(task.id)} className="h-8 w-8 text-destructive hover:text-destructive" aria-label={`Delete ${task.title}`}>
              <Trash2 size={15} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskCard;
