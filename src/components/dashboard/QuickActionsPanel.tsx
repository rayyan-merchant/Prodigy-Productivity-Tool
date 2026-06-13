
import React from 'react';
import { Clock, CheckSquare, Flame, Droplets } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const QuickActionsPanel: React.FC = () => {
  const navigate = useNavigate();

  const quickActions = [
    {
      title: "New Task",
      icon: <CheckSquare className="h-4 w-4" />,
      action: () => navigate('/tasks'),
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20",
    },
    {
      title: "New Habit",
      icon: <Flame className="h-4 w-4" />,
      action: () => navigate('/habits'),
      color: "bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20",
    },
    {
      title: "Water",
      icon: <Droplets className="h-4 w-4" />,
      action: () => navigate('/water'),
      color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20",
    },
    {
      title: "Focus",
      icon: <Clock className="h-4 w-4" />,
      action: () => navigate('/pomodoro'),
      color: "bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20",
    }
  ];

  return (
    <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-2">
        {quickActions.map((action, index) => (
          <button
            key={index}
            onClick={action.action}
            className={cn(
              "flex items-center gap-2.5 p-3 rounded-xl font-medium text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
              action.color
            )}
          >
            {action.icon}
            {action.title}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActionsPanel;
