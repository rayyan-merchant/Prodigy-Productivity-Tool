import React, { useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Task } from "@/types/tasks";
import TaskList from "@/components/tasks/TaskList";
import EmptyState from "@/components/EmptyState";
import TaskFilters, { TaskSortBy, TaskPriorityFilter } from "@/components/tasks/TaskFilters";
import { ListTodo, Clock, CheckCircle, LayoutList } from 'lucide-react';
import { parseLocalDate } from '@/lib/dateOnly';

interface TasksTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  tasks: Task[];
  todoTasks: Task[];
  inProgressTasks: Task[];
  completedTasks: Task[];
  isLoading: boolean;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, newStatus: Task['status']) => void;
}

const priorityRank: Record<string, number> = { high: 0, medium: 1, low: 2 };

const applyFilters = (
  list: Task[],
  search: string,
  priority: TaskPriorityFilter,
  sortBy: TaskSortBy,
): Task[] => {
  const q = search.trim().toLowerCase();
  let result = list.filter((t) => {
    if (priority !== 'all' && t.priority !== priority) return false;
    if (!q) return true;
    return (
      t.title?.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      t.tags?.some((tag) => tag.toLowerCase().includes(q))
    );
  });

  result = [...result].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return (a.title || '').localeCompare(b.title || '');
      case 'priority':
        return (priorityRank[a.priority] ?? 99) - (priorityRank[b.priority] ?? 99);
      case 'due': {
        const ad = a.dueDate ? parseLocalDate(a.dueDate).getTime() : Infinity;
        const bd = b.dueDate ? parseLocalDate(b.dueDate).getTime() : Infinity;
        return ad - bd;
      }
      case 'created':
      default: {
        const ac = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bc = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bc - ac;
      }
    }
  });

  return result;
};

const TasksTabs: React.FC<TasksTabsProps> = ({
  activeTab,
  onTabChange,
  tasks,
  todoTasks,
  inProgressTasks,
  completedTasks,
  isLoading,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<TaskSortBy>('created');
  const [priority, setPriority] = useState<TaskPriorityFilter>('all');

  const filteredAll = useMemo(() => applyFilters(tasks, search, priority, sortBy), [tasks, search, priority, sortBy]);
  const filteredTodo = useMemo(() => applyFilters(todoTasks, search, priority, sortBy), [todoTasks, search, priority, sortBy]);
  const filteredInProgress = useMemo(() => applyFilters(inProgressTasks, search, priority, sortBy), [inProgressTasks, search, priority, sortBy]);
  const filteredCompleted = useMemo(() => applyFilters(completedTasks, search, priority, sortBy), [completedTasks, search, priority, sortBy]);

  const isFiltering = search.trim() !== '' || priority !== 'all';

  const renderEmpty = (kind: 'all' | 'todo' | 'in-progress' | 'completed') => {
    if (isFiltering) {
      return (
        <EmptyState
          title="No matching tasks"
          description="Try adjusting your search or filter to find what you're looking for."
          illustration="tasks"
        />
      );
    }
    const map = {
      all: {
        title: 'No tasks yet',
        description: 'Create your first task to start organizing your day.',
        icon: <LayoutList size={20} className="text-muted-foreground" />,
      },
      todo: {
        title: 'Nothing to do',
        description: 'You\'re all caught up. New tasks will appear here when added.',
        icon: <ListTodo size={20} className="text-muted-foreground" />,
      },
      'in-progress': {
        title: 'No tasks in progress',
        description: 'Start working on a task to move it here.',
        icon: <Clock size={20} className="text-muted-foreground" />,
      },
      completed: {
        title: 'No completed tasks',
        description: 'Finish a task and it will show up here as a win.',
        icon: <CheckCircle size={20} className="text-muted-foreground" />,
      },
    } as const;
    const cfg = map[kind];
    return <EmptyState title={cfg.title} description={cfg.description} icon={cfg.icon} illustration="tasks" />;
  };

  return (
    <div className="space-y-4">
      <TaskFilters
        search={search}
        onSearchChange={setSearch}
        sortBy={sortBy}
        onSortChange={setSortBy}
        priority={priority}
        onPriorityChange={setPriority}
      />

      <Tabs defaultValue="all" value={activeTab} onValueChange={onTabChange}>
        <div className="overflow-x-auto -mx-1 px-1">
          <TabsList
            aria-label="Filter tasks by status"
            className="inline-flex sm:grid sm:w-full sm:grid-cols-4 bg-muted/50 p-1 rounded-lg gap-1 min-w-full"
          >
            <TabsTrigger value="all" className="relative whitespace-nowrap data-[state=active]:bg-background data-[state=active]:shadow-sm">
              All
              <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-primary/10 text-primary rounded-full" aria-label={`${tasks.length} tasks`}>
                {tasks.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="todo" className="relative whitespace-nowrap data-[state=active]:bg-background data-[state=active]:shadow-sm">
              To Do
              <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full" aria-label={`${todoTasks.length} to do`}>
                {todoTasks.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="in-progress" className="relative whitespace-nowrap data-[state=active]:bg-background data-[state=active]:shadow-sm">
              In Progress
              <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-full" aria-label={`${inProgressTasks.length} in progress`}>
                {inProgressTasks.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="completed" className="relative whitespace-nowrap data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Completed
              <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-green-500/10 text-green-600 dark:text-green-400 rounded-full" aria-label={`${completedTasks.length} completed`}>
                {completedTasks.length}
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="mt-6">
          {!isLoading && filteredAll.length === 0
            ? renderEmpty('all')
            : <TaskList tasks={filteredAll} isLoading={isLoading} onEdit={onEdit} onDelete={onDelete} onStatusChange={onStatusChange} emptyMessage="" />}
        </TabsContent>

        <TabsContent value="todo" className="mt-6">
          {!isLoading && filteredTodo.length === 0
            ? renderEmpty('todo')
            : <TaskList tasks={filteredTodo} isLoading={isLoading} onEdit={onEdit} onDelete={onDelete} onStatusChange={onStatusChange} emptyMessage="" />}
        </TabsContent>

        <TabsContent value="in-progress" className="mt-6">
          {!isLoading && filteredInProgress.length === 0
            ? renderEmpty('in-progress')
            : <TaskList tasks={filteredInProgress} isLoading={isLoading} onEdit={onEdit} onDelete={onDelete} onStatusChange={onStatusChange} emptyMessage="" />}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          {!isLoading && filteredCompleted.length === 0
            ? renderEmpty('completed')
            : <TaskList tasks={filteredCompleted} isLoading={isLoading} onEdit={onEdit} onDelete={onDelete} onStatusChange={onStatusChange} emptyMessage="" />}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TasksTabs;
