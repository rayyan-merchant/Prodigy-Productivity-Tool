
import React, { useState } from 'react';
import { Task } from '@/types/tasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, GripVertical, CheckCircle, Clock, ListTodo } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDateOnly } from '@/lib/dateOnly';

interface KanbanBoardProps {
  todoTasks: Task[];
  inProgressTasks: Task[];
  completedTasks: Task[];
  isLoading: boolean;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, newStatus: Task['status']) => void;
}

const priorityColors: Record<string, string> = {
  low: 'bg-primary/10 text-primary',
  medium: 'bg-accent/10 text-accent-foreground',
  high: 'bg-destructive/10 text-destructive',
};

interface KanbanColumnProps {
  title: string;
  icon: React.ReactNode;
  tasks: Task[];
  status: Task['status'];
  color: string;
  onDrop: (taskId: string, newStatus: Task['status']) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ title, icon, tasks, status, color, onDrop, onEdit, onDelete }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) onDrop(taskId, status);
  };

  return (
    <div
      className={cn(
        'flex flex-col rounded-xl border border-border bg-muted/30 min-h-[400px] transition-all duration-200',
        isDragOver && 'ring-2 ring-brand/50 bg-brand/5'
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={cn('flex items-center gap-2 p-4 border-b border-border rounded-t-xl', color)}>
        {icon}
        <h3 className="font-semibold text-sm">{title}</h3>
        <Badge variant="secondary" className="ml-auto text-xs">{tasks.length}</Badge>
      </div>
      <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[60vh]">
        <AnimatePresence>
          {tasks.map((task) => (
            <KanbanCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </AnimatePresence>
        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-center px-3">
            <div className="rounded-full bg-muted/60 p-2 mb-2">{icon}</div>
            <p className="text-xs font-medium text-foreground">No {title.toLowerCase()} tasks</p>
            <p className="text-[11px] text-muted-foreground mt-1">Drop tasks here to move them</p>
          </div>
        )}
      </div>
    </div>
  );
};

const KanbanCard: React.FC<{
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}> = ({ task, onEdit, onDelete }) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        draggable
        onDragStart={handleDragStart}
        className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow border-border bg-card"
      >
        <CardContent className="p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <GripVertical size={14} className="text-muted-foreground mt-0.5 shrink-0" />
              <span className="font-medium text-sm text-foreground truncate">{task.title}</span>
            </div>
            <Badge className={cn('text-[10px] shrink-0', priorityColors[task.priority])}>
              {task.priority}
            </Badge>
          </div>
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 pl-6">{task.description}</p>
          )}
          <div className="flex items-center justify-between pl-6">
            {task.dueDate && (
              <span className="text-[10px] text-muted-foreground">
                Due: {formatDateOnly(task.dueDate)}
              </span>
            )}
            {task.recurrence && task.recurrence !== 'none' && (
              <Badge variant="outline" className="text-[10px]">🔄 {task.recurrence}</Badge>
            )}
            <div className="flex gap-1 ml-auto">
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(task)}>
                <Edit size={12} />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => onDelete(task.id)}>
                <Trash2 size={12} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  todoTasks,
  inProgressTasks,
  completedTasks,
  isLoading,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const handleDrop = (taskId: string, newStatus: Task['status']) => {
    onStatusChange(taskId, newStatus);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-muted/30 h-[400px] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <KanbanColumn
        title="To Do"
        icon={<ListTodo size={16} className="text-muted-foreground" />}
        tasks={todoTasks}
        status="todo"
        color="bg-muted/50"
        onDrop={handleDrop}
        onEdit={onEdit}
        onDelete={onDelete}
      />
      <KanbanColumn
        title="In Progress"
        icon={<Clock size={16} className="text-primary" />}
        tasks={inProgressTasks}
        status="in-progress"
        color="bg-primary/5"
        onDrop={handleDrop}
        onEdit={onEdit}
        onDelete={onDelete}
      />
      <KanbanColumn
        title="Completed"
        icon={<CheckCircle size={16} className="text-accent-foreground" />}
        tasks={completedTasks}
        status="completed"
        color="bg-accent/5"
        onDrop={handleDrop}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
};

export default KanbanBoard;
