
import React, { useState, useEffect } from 'react';
import { Flame, Plus, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Habit } from '@/types/habits';
import { completeHabit, getHabits, getTodayLocalDateKey } from '@/services/habitService';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const HabitStreaks: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const loadHabits = async () => {
    try {
      const fetchedHabits = await getHabits();
      const today = getTodayLocalDateKey();
      const availableHabits = fetchedHabits
        .filter(h => h.isActive && !h.completedDates.includes(today))
        .slice(0, 3);
      setHabits(availableHabits);
    } catch (error) {
      console.error('Error fetching habits:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHabits();
  }, []);

  const markHabitComplete = async (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;
    
    try {
      await completeHabit(habitId, habit.name);
      await loadHabits();
      toast.success('Habit marked complete for today! 🔥');
    } catch (error) {
      console.error('Error marking habit complete:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to mark habit as complete');
    }
  };

  const getStreakColor = (streak: number, target: number) => {
    const percentage = (streak / target) * 100;
    if (percentage >= 100) return 'text-green-500 dark:text-green-400';
    if (percentage >= 70) return 'text-yellow-500 dark:text-yellow-400';
    return 'text-red-500 dark:text-red-400';
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-5">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
          <Flame className="h-4 w-4" /> Habit Streaks
        </h3>
        <div className="animate-pulse space-y-3">
          <div className="h-12 bg-muted/50 rounded-xl" />
          <div className="h-12 bg-muted/50 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" /> Habit Streaks
        </h3>
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 rounded-lg" onClick={() => navigate('/habits')}>
          <Plus className="h-3 w-3" /> New
        </Button>
      </div>
      <div className="px-5 pb-4 space-y-2">
        {habits.map((habit) => (
          <div key={habit.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
            <div>
              <h4 className="font-medium text-sm text-foreground">{habit.name}</h4>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className="text-[10px] h-4 px-1.5 rounded-md">
                  {habit.category}
                </Badge>
                <span className={cn("text-[11px] font-medium", getStreakColor(habit.currentStreak, habit.targetStreak))}>
                  🔥 {habit.currentStreak}d
                </span>
              </div>
            </div>
            <button
              className="w-8 h-8 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 flex items-center justify-center transition-colors"
              onClick={() => markHabitComplete(habit.id)}
            >
              <Check className="h-4 w-4" />
            </button>
          </div>
        ))}
        {habits.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Flame className="h-7 w-7 mx-auto mb-2 opacity-40" />
            <p className="text-xs">All done for today! 🎉</p>
            <Button variant="ghost" size="sm" className="mt-2 text-xs h-7" onClick={() => navigate('/habits')}>
              Manage habits
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HabitStreaks;
