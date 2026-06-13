
import React, { useState } from 'react';
import { useTimer } from '@/contexts/TimerContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Play, Pause, Square, Timer, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const FloatingTimer: React.FC = () => {
  const {
    timerState,
    remainingSeconds,
    progress,
    pauseTimer,
    resumeTimer,
    stopTimer,
  } = useTimer();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  // Only show when timer is active/paused and NOT on the pomodoro page
  const isTimerActive = timerState.isRunning || (timerState.pausedRemaining !== null && timerState.pausedRemaining > 0);
  const isOnPomodoroPage = location.pathname === '/pomodoro';

  if (!isTimerActive || isOnPomodoroPage) return null;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const isBreak = timerState.sessionType !== 'focus';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 80, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 80, scale: 0.9 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <div className={`rounded-2xl shadow-2xl border border-border bg-card backdrop-blur-xl overflow-hidden ${collapsed ? 'w-auto' : 'w-72'}`}>
          {/* Header - always visible */}
          <div
            className="flex items-center gap-2 px-4 py-3 cursor-pointer select-none"
            onClick={() => setCollapsed(!collapsed)}
          >
            <div className={`w-2 h-2 rounded-full ${timerState.isRunning ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
            <Timer className="h-4 w-4 text-muted-foreground" />
            <span className="font-bold text-lg tabular-nums text-foreground">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
            <span className="text-xs text-muted-foreground uppercase tracking-wider ml-1">
              {isBreak ? 'Break' : 'Focus'}
            </span>
            <div className="ml-auto">
              {collapsed ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </div>
          </div>

          {/* Expanded controls */}
          {!collapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 pb-3"
            >
              {/* Mini progress bar */}
              <div className="w-full h-1.5 bg-muted rounded-full mb-3 overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${isBreak ? 'bg-accent' : 'bg-primary'}`}
                  style={{ width: `${progress * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Task name */}
              {timerState.taskTitle && (
                <p className="text-xs text-muted-foreground truncate mb-2">
                  📌 {timerState.taskTitle}
                </p>
              )}

              {/* Controls */}
              <div className="flex items-center gap-2">
                {timerState.isRunning ? (
                  <Button size="sm" variant="outline" onClick={pauseTimer} className="flex-1 gap-1.5 rounded-xl">
                    <Pause className="h-3.5 w-3.5" />
                    Pause
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={resumeTimer} className="flex-1 gap-1.5 rounded-xl">
                    <Play className="h-3.5 w-3.5" />
                    Resume
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={stopTimer} className="gap-1.5 rounded-xl text-destructive hover:text-destructive">
                  <Square className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="default" onClick={() => navigate('/pomodoro')} className="gap-1.5 rounded-xl">
                  Open
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FloatingTimer;
