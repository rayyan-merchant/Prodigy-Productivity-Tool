
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from "react-router-dom";
import { useTimer } from '@/contexts/TimerContext';
import { usePomodoro } from '@/hooks/usePomodoro';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import TimerSettings from '@/components/TimerSettings';
import { toast } from 'sonner';
import type { Task } from '@/types/tasks';
import { motion } from 'framer-motion';
import { Layers3, Target } from 'lucide-react';

import HeaderBar from '@/components/pomodoro/HeaderBar';
import AmbientParticles from '@/components/pomodoro/AmbientParticles';
import TimerCircle from '@/components/pomodoro/TimerCircle';
import TimerControls from '@/components/pomodoro/TimerControls';
import SessionInfo from '@/components/pomodoro/SessionInfo';
import SidebarOptions from '@/components/pomodoro/SidebarOptions';
import ActiveSessionInfo from '@/components/pomodoro/ActiveSessionInfo';
import TaskSelector from '@/components/pomodoro/TaskSelector';
import FocusMusicPlayer from '@/components/FocusMusicPlayer';
import MobilePomodoroSheet from '@/components/pomodoro/MobilePomodoroSheet';
import SessionHistory from '@/components/pomodoro/SessionHistory';

const PomodoroTimer = () => {
  const { settings, sessionsCompleted, startTimer, timerState } = useTimer();
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [focusType, setFocusType] = useState(() => {
    return localStorage.getItem('pomodoro-focus-type') || 'General';
  });
  const [customFocus, setCustomFocus] = useState(() => {
    return localStorage.getItem('pomodoro-custom-focus') || '';
  });
  const [showCustomInput, setShowCustomInput] = useState(() => {
    return localStorage.getItem('pomodoro-focus-type') === 'Custom';
  });
  const [showNotes, setShowNotes] = useState(false);
  const [noteSaveDialogOpen, setNoteSaveDialogOpen] = useState(false);
  const [pendingSessionType, setPendingSessionType] = useState<'focus' | 'short-break' | 'long-break'>(
    timerState.sessionDuration > 0 ? timerState.sessionType : 'focus'
  );
  
  const {
    isActive,
    isBreak,
    minutes,
    seconds,
    progress,
    toggleTimer,
    resetTimer,
    setIsBreak,
    isLongBreak,
    setIsLongBreak,
    shouldPromptForNoteSave,
    setShouldPromptForNoteSave,
    sessionNotes,
    updateSessionNotes,
    saveNotes,
    pomodorosUntilLongBreak,
    isWaitingForUser
  } = usePomodoro();

  const resolvedFocusLabel = selectedTask?.title || (focusType === 'Custom' ? customFocus.trim() || 'Custom Focus' : focusType);

  // Custom toggle that uses pendingSessionType for fresh starts
  const handleToggle = useCallback(() => {
    if (isActive) {
      // Pause
      toggleTimer();
    } else if (timerState.pausedRemaining !== null && timerState.pausedRemaining > 0) {
      // Resume
      toggleTimer();
    } else {
      // Fresh start with pending type
      startTimer(
        pendingSessionType,
        pendingSessionType === 'focus' ? selectedTask?.id || null : null,
        pendingSessionType === 'focus' ? selectedTask?.title || null : null,
        pendingSessionType === 'focus' ? resolvedFocusLabel : null
      );
    }
  }, [isActive, timerState, pendingSessionType, selectedTask, resolvedFocusLabel, toggleTimer, startTimer]);

  useEffect(() => {
    const handleTogglePomodoro = () => handleToggle();
    const handleResetPomodoro = () => resetTimer();
    window.addEventListener('togglePomodoro', handleTogglePomodoro);
    window.addEventListener('resetPomodoro', handleResetPomodoro);
    return () => {
      window.removeEventListener('togglePomodoro', handleTogglePomodoro);
      window.removeEventListener('resetPomodoro', handleResetPomodoro);
    };
  }, [handleToggle, resetTimer]);

  useEffect(() => {
    if (shouldPromptForNoteSave && sessionNotes.trim()) {
      setNoteSaveDialogOpen(true);
    }
  }, [shouldPromptForNoteSave, sessionNotes]);

  useEffect(() => {
    localStorage.setItem('pomodoro-focus-type', focusType);
    if (focusType === 'Custom' && customFocus) {
      localStorage.setItem('pomodoro-custom-focus', customFocus);
    }
  }, [focusType, customFocus]);

  const handleNoteNavigation = (noteType: string) => {
    setShowNotes(true);
  };

  const handleFocusTypeChange = (type: string) => {
    setFocusType(type);
    setShowCustomInput(type === 'Custom');
  };

  const handleBreakToggle = (breakType: 'focus' | 'short' | 'long') => {
    if (!isActive && !isWaitingForUser) {
      resetTimer();
      const type = breakType === 'focus' ? 'focus' : breakType === 'short' ? 'short-break' : 'long-break';
      setPendingSessionType(type);
    }
  };

  const handleSaveNotes = async () => {
    const success = await saveNotes();
    if (success) {
      toast.success("Notes saved successfully");
      setNoteSaveDialogOpen(false);
      setShouldPromptForNoteSave(false);
    } else {
      toast.error("Failed to save notes");
    }
  };

  const handleDiscardNotes = () => {
    updateSessionNotes('');
    setNoteSaveDialogOpen(false);
    setShouldPromptForNoteSave(false);
  };
  
  const handleSaveSheetNotes = async () => {
    if (sessionNotes.trim()) {
      const success = await saveNotes();
      if (success) {
        toast.success("Notes saved successfully");
      } else {
        toast.error("Failed to save notes");
      }
    }
    setShowNotes(false);
  };

  const handleTaskSelect = (task: Task | null) => {
    setSelectedTask(task);
  };

  return (
    <div className="h-full flex flex-col bg-background relative">
      <AmbientParticles isBreak={isBreak} />
      <div className="flex-1 flex flex-col p-4 md:p-6 max-w-7xl mx-auto w-full relative z-10">
        <HeaderBar />
        
        <div className="flex flex-1 items-start gap-8">
          {/* Main Timer Section */}
          <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh]">
            {/* Mode Tabs */}
            <motion.div 
              className="mb-10"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex gap-1 p-1 bg-muted rounded-xl">
                <button
                  onClick={() => handleBreakToggle('focus')}
                  className={`py-2.5 px-5 rounded-lg transition-all text-sm font-medium ${
                    (isActive || isWaitingForUser ? !isBreak : pendingSessionType === 'focus')
                      ? 'bg-card text-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  disabled={isActive || isWaitingForUser}
                >
                  Focus
                </button>
                <button
                  onClick={() => handleBreakToggle('short')}
                  className={`py-2.5 px-5 rounded-lg transition-all text-sm font-medium ${
                    (isActive || isWaitingForUser ? isBreak && !isLongBreak : pendingSessionType === 'short-break')
                      ? 'bg-card text-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  disabled={isActive || isWaitingForUser}
                >
                  Short ({settings.shortBreakDuration}m)
                </button>
                <button
                  onClick={() => handleBreakToggle('long')}
                  className={`py-2.5 px-5 rounded-lg transition-all text-sm font-medium ${
                    (isActive || isWaitingForUser ? isBreak && isLongBreak : pendingSessionType === 'long-break')
                      ? 'bg-card text-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  disabled={isActive || isWaitingForUser}
                >
                  Long ({settings.longBreakDuration}m)
                </button>
              </div>
            </motion.div>

            {/* Focus and Task Selection */}
            {!isBreak && (
              <motion.div 
                className="mb-8 w-full max-w-3xl grid gap-4 md:grid-cols-[1.15fr_0.85fr]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-sm">
                  <CardContent className="p-4 md:p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <Layers3 className="h-4 w-4 text-primary" />
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">Focus Type</h3>
                        <p className="text-[11px] text-muted-foreground">Choose what this session is meant for before you start</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {['General', 'Work', 'Study', 'Creative', 'Custom'].map((type) => {
                        const active = focusType === type;
                        return (
                          <Button
                            key={type}
                            type="button"
                            variant={active ? 'default' : 'outline'}
                            size="sm"
                            className="rounded-full px-4"
                            onClick={() => handleFocusTypeChange(type)}
                          >
                            {type}
                          </Button>
                        );
                      })}
                    </div>

                    {showCustomInput && (
                      <Input
                        value={customFocus}
                        onChange={(e) => setCustomFocus(e.target.value)}
                        placeholder="e.g. Deep study, coding sprint, exam prep"
                        className="bg-background/80"
                      />
                    )}

                    <div className="rounded-2xl border border-border bg-muted/25 p-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Session label</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{resolvedFocusLabel}</span>
                        {selectedTask && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs text-primary">
                            <Target className="h-3 w-3" />
                            {selectedTask.title}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <TaskSelector 
                  selectedTask={selectedTask}
                  onTaskSelect={handleTaskSelect}
                />
              </motion.div>
            )}
            
            {/* Timer */}
            {(() => {
              // Show pending duration when idle
              const isIdle = !isActive && timerState.sessionDuration === 0 && timerState.pausedRemaining === null;
              const displayMinutes = isIdle ? (
                pendingSessionType === 'focus' ? settings.workDuration :
                pendingSessionType === 'short-break' ? settings.shortBreakDuration :
                settings.longBreakDuration
              ) : minutes;
              const displaySeconds = isIdle ? 0 : seconds;
              const displayProgress = isIdle ? 0 : progress;
              const displayIsBreak = isIdle ? pendingSessionType !== 'focus' : isBreak;
              return (
                <TimerCircle 
                  minutes={displayMinutes} 
                  seconds={displaySeconds} 
                  progress={displayProgress} 
                  isBreak={displayIsBreak}
                  isActive={isActive}
                />
              );
            })()}
            
            {/* Session dots */}
            <SessionInfo 
              isBreak={isBreak} 
              isLongBreak={isLongBreak}
              sessionsCompleted={sessionsCompleted} 
              longBreakInterval={settings.longBreakInterval}
            />
            
            {/* Until long break */}
            {!isBreak && !isLongBreak && (
              <p className="text-muted-foreground text-sm mb-6">
                {pomodorosUntilLongBreak === 1 
                  ? "1 more session until long break" 
                  : `${pomodorosUntilLongBreak} sessions until long break`}
              </p>
            )}

            {/* Waiting indicator */}
            {isWaitingForUser && (
              <motion.div 
                className="text-center mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <p className="text-foreground font-medium">
                  {isBreak 
                    ? (isLongBreak ? 'Long break ready!' : 'Short break ready!') 
                    : 'Ready for next session!'}
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                  Click below when you're ready
                </p>
              </motion.div>
            )}

            {/* Controls */}
            <TimerControls 
              isActive={isActive} 
              toggleTimer={handleToggle} 
              resetTimer={resetTimer}
              isWaitingForUser={isWaitingForUser}
              isBreak={isBreak}
              isLongBreak={isLongBreak}
            />

            {/* Mobile Controls */}
            <div className="mt-8 flex flex-col items-center gap-3 md:hidden">
              <FocusMusicPlayer compact />
              <MobilePomodoroSheet
                onNoteNavigation={handleNoteNavigation}
                onFocusTypeChange={handleFocusTypeChange}
                onSettingsOpen={() => setShowSettings(true)}
                customFocus={customFocus}
                setCustomFocus={setCustomFocus}
                showCustomInput={showCustomInput}
                onHistoryOpen={() => setShowHistory(true)}
              />
            </div>
          </div>
          
          {/* Right Sidebar */}
          <div className="hidden md:block w-72 shrink-0">
            <div className="space-y-4 sticky top-6">
              <SidebarOptions 
                onNoteNavigation={handleNoteNavigation}
                onFocusTypeChange={handleFocusTypeChange}
                onSettingsOpen={() => setShowSettings(true)}
                customFocus={customFocus}
                setCustomFocus={setCustomFocus}
                showCustomInput={showCustomInput}
                onHistoryOpen={() => setShowHistory(true)}
              />
              
              {isActive && (
                <ActiveSessionInfo 
                  focusLabel={resolvedFocusLabel}
                  taskTitle={selectedTask?.title ?? null}
                  quickNote={sessionNotes}
                  setQuickNote={updateSessionNotes}
                />
              )}

              <Card className="bg-card border-border shadow-sm">
                <CardContent className="p-4">
                  <FocusMusicPlayer />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-card text-card-foreground border-border">
          <DialogHeader>
            <DialogTitle>Timer Settings</DialogTitle>
          </DialogHeader>
          <TimerSettings onClose={() => setShowSettings(false)} />
        </DialogContent>
      </Dialog>
      
      <Sheet open={showNotes} onOpenChange={setShowNotes}>
        <SheetContent className="w-[400px] sm:w-[540px] bg-card text-card-foreground border-border">
          <SheetHeader>
            <SheetTitle className="text-foreground">Focus Notes</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <Textarea 
              className="min-h-[300px] bg-muted border-border text-foreground placeholder:text-muted-foreground"
              placeholder="Write your notes here..."
              value={sessionNotes}
              onChange={(e) => updateSessionNotes(e.target.value)}
            />
            <div className="mt-4 flex justify-end">
              <Button onClick={handleSaveSheetNotes}>Save Notes</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      
      <Dialog open={noteSaveDialogOpen} onOpenChange={setNoteSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Session Notes</DialogTitle>
            <DialogDescription>
              Would you like to save your notes from this focus session?
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[200px] overflow-y-auto border rounded-md p-3 my-4 bg-muted/50">
            {sessionNotes}
          </div>
          <DialogFooter className="flex space-x-2 sm:space-x-0">
            <Button variant="outline" onClick={handleDiscardNotes}>Discard</Button>
            <Button onClick={handleSaveNotes}>Save Notes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SessionHistory isOpen={showHistory} onClose={() => setShowHistory(false)} />
    </div>
  );
};

export default PomodoroTimer;
