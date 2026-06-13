
import React from 'react';
import EmptyState from '@/components/EmptyState';
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import TaskCard, { Task } from "@/components/TaskCard";

interface RecentTasksSectionProps {
  tasks: Task[];
  isLoading: boolean;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onStatusChange: (taskId: string, newStatus: Task['status']) => void;
}

const RecentTasksSection: React.FC<RecentTasksSectionProps> = ({
  tasks,
  isLoading,
  onEditTask,
  onDeleteTask,
  onStatusChange
}) => {
  return (
    <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <h3 className="text-sm font-semibold text-foreground">Recent Tasks</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-1 text-xs text-muted-foreground hover:text-primary rounded-lg h-7"
          onClick={() => window.location.href = '/tasks'}
        >
          View All <ArrowRight size={12} />
        </Button>
      </div>
      <div className="px-5 pb-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((_, i) => (
              <div key={i} className="bg-muted/50 h-16 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : tasks.length > 0 ? (
          <div className="space-y-2.5">
            {tasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onStatusChange={onStatusChange}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No tasks yet"
            description="Create your first task to start tracking your progress."
            illustration="tasks"
            actionLabel="Create your first task"
            onAction={() => window.location.href = '/tasks'}
          />
        )}
      </div>
    </div>
  );
};

export default RecentTasksSection;
