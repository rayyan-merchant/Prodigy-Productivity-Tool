import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Clock, Target, ChevronDown, ChevronUp } from 'lucide-react';
import { getTasks } from '@/services/taskService';
import type { Task } from '@/types/tasks';
import { formatDateOnly } from '@/lib/dateOnly';

interface TaskSelectorProps {
  selectedTask: Task | null;
  onTaskSelect: (task: Task | null) => void;
  className?: string;
}

const TaskSelector: React.FC<TaskSelectorProps> = ({ selectedTask, onTaskSelect, className = '' }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoading(true);
        const fetchedTasks = await getTasks();
        const activeTasks = fetchedTasks.filter(task => 
          task.status === 'todo' || task.status === 'in-progress'
        );
        setTasks(activeTasks);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const handleTaskSelect = (task: Task) => {
    onTaskSelect(task);
    setIsExpanded(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'medium': return 'bg-accent/10 text-accent-foreground border-accent/20';
      case 'low': return 'bg-primary/10 text-primary border-primary/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  if (isLoading) {
    return (
      <Card className={`bg-card border-border shadow-sm ${className}`}>
        <div className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded mb-2"></div>
            <div className="h-3 bg-muted rounded w-2/3"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`border-border/60 bg-card/80 shadow-sm backdrop-blur-sm ${className}`}>
      <div className="p-4 md:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Target className="h-4 w-4 text-primary" />
            <div>
              <span className="text-foreground font-semibold text-sm">Linked Task</span>
              <p className="text-[11px] text-muted-foreground">Optional, but great for clean session history</p>
            </div>
          </div>
          {tasks.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted p-1"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}
        </div>

        {selectedTask ? (
          <div className="space-y-3 rounded-2xl border border-primary/20 bg-primary/5 p-3">
            <div className="flex items-start justify-between gap-3">
              <h4 className="text-foreground text-sm font-medium leading-tight">
                {selectedTask.title}
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onTaskSelect(null)}
                className="rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted p-1 ml-2"
              >
                ×
              </Button>
            </div>
            {selectedTask.description && (
              <p className="text-muted-foreground text-xs">{selectedTask.description}</p>
            )}
            <div className="flex items-center space-x-2">
              <Badge className={`text-xs ${getPriorityColor(selectedTask.priority || 'medium')}`}>
                {selectedTask.priority || 'medium'}
              </Badge>
              {selectedTask.dueDate && (
                <Badge variant="outline" className="text-xs text-muted-foreground border-border">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatDateOnly(selectedTask.dueDate)}
                </Badge>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-5 text-center">
            <p className="text-muted-foreground text-sm">
              {tasks.length > 0 ? 'Select a task to focus on' : 'No active tasks available'}
            </p>
          </div>
        )}

        {isExpanded && tasks.length > 0 && (
          <div className="mt-4 border-t border-border pt-4">
            <ScrollArea className="h-40">
              <div className="space-y-2 pr-3">
                {tasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleTaskSelect(task)}
                    className="cursor-pointer rounded-xl border border-border bg-background/70 p-3 transition-colors hover:bg-muted/50"
                  >
                    <h5 className="text-foreground text-xs font-medium truncate">{task.title}</h5>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge className={`text-xs ${getPriorityColor(task.priority || 'medium')}`}>
                        {task.priority || 'medium'}
                      </Badge>
                      {task.project && (
                        <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                          {task.project}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                {tasks.length > 5 && (
                  <p className="text-muted-foreground text-xs text-center py-1">
                    +{tasks.length - 5} more tasks
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </Card>
  );
};

export default TaskSelector;
