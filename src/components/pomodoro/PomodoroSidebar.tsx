import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Clock, Play, Pause, RotateCcw, Settings2 } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface PomodoroSidebarProps {
  isOpen: boolean;
  currentSession: string;
  sessionsCompleted: number;
  timeRemaining: string;
  isRunning: boolean;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onSettingsClick: () => void;
}

const PomodoroSidebar: React.FC<PomodoroSidebarProps> = ({
  isOpen,
  currentSession,
  sessionsCompleted,
  timeRemaining,
  isRunning,
  onToggleTimer,
  onResetTimer,
  onSettingsClick,
}) => {
  if (!isOpen) return null;

  return (
    <div className="w-80 border-l border-border bg-background/50 backdrop-blur-sm p-6 space-y-6 overflow-y-auto">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Current Session</h3>
          <Badge variant="outline" className="bg-primary/5">
            #{sessionsCompleted + 1}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Session Type</span>
          </div>
          <Badge variant="secondary" className={
            currentSession === 'focus' 
              ? "bg-primary/10 text-primary" 
              : currentSession === 'shortBreak'
              ? "bg-green-500/10 text-green-600 dark:text-green-400"
              : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
          }>
            {currentSession === 'focus' ? 'Focus Time' : 
             currentSession === 'shortBreak' ? 'Short Break' : 'Long Break'}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">Time Remaining</div>
          <div className="text-2xl font-mono font-bold text-foreground">
            {timeRemaining}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">Sessions Completed</div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-foreground">{sessionsCompleted}</span>
            <div className="flex gap-1">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i < (sessionsCompleted % 4) ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Button
          onClick={onToggleTimer}
          className="w-full gap-2"
          variant={isRunning ? "secondary" : "default"}
        >
          {isRunning ? (
            <>
              <Pause className="h-4 w-4" />
              Pause
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Start
            </>
          )}
        </Button>

        <div className="flex gap-2">
          <Button
            onClick={onResetTimer}
            variant="outline"
            className="flex-1 gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          
          <Button
            onClick={onSettingsClick}
            variant="outline"
            className="flex-1 gap-2"
          >
            <Settings2 className="h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PomodoroSidebar;