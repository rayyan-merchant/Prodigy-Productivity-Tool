import React, { useState, useEffect, useMemo } from 'react';
import EmptyState from '@/components/EmptyState';
import { Plus, Flame, CheckCircle, BarChart3, Calendar } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Habit } from '@/types/habits';
import HabitForm from '@/components/habits/HabitForm';
import HabitCard from '@/components/habits/HabitCard';
import { getHabits, createHabit, updateHabit, deleteHabit, completeHabit, undoHabitCompletion, getTodayLocalDateKey } from '@/services/habitService';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { format, subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const Habits: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [filter, setFilter] = useState<'all' | 'health' | 'productivity' | 'personal' | 'learning' | 'other'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null);

  // Subscribe to realtime habit changes
  useRealtimeSubscription('habits', () => { fetchHabits(); });

  useEffect(() => { fetchHabits(); }, []);

  const fetchHabits = async () => {
    try {
      setIsLoading(true);
      const fetchedHabits = await getHabits();
      setHabits(fetchedHabits);
    } catch (error) {
      console.error('Error fetching habits:', error);
      toast.error('Failed to load habits');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredHabits = habits.filter(habit => filter === 'all' || habit.category === filter);

  const handleCreateHabit = async (habitData: Partial<Habit>) => {
    try {
      const newHabit = await createHabit({
        name: habitData.name!, description: habitData.description, category: habitData.category!,
        frequency: habitData.frequency!, targetStreak: habitData.targetStreak!, currentStreak: 0,
        longestStreak: 0, bestStreak: 0, completedDates: [], isActive: true
      });
      setHabits([newHabit, ...habits]);
      setIsCreateDialogOpen(false);
      toast.success('Habit created successfully!');
    } catch (error) {
      console.error('Error creating habit:', error);
      toast.error('Failed to create habit');
    }
  };

  const handleEditHabit = async (habitData: Partial<Habit>) => {
    if (!selectedHabit) return;
    try {
      await updateHabit(selectedHabit.id, habitData);
      const updatedHabit: Habit = { ...selectedHabit, ...habitData, updatedAt: new Date().toISOString() };
      setHabits(habits.map(habit => habit.id === selectedHabit.id ? updatedHabit : habit));
      setIsEditDialogOpen(false);
      setSelectedHabit(null);
      toast.success('Habit updated successfully!');
    } catch (error) {
      console.error('Error updating habit:', error);
      toast.error('Failed to update habit');
    }
  };

  const handleDeleteHabit = async () => {
    if (!habitToDelete) return;
    try {
      await deleteHabit(habitToDelete.id);
      setHabits(habits.filter(habit => habit.id !== habitToDelete.id));
      setHabitToDelete(null);
      toast.success('Habit deleted successfully!');
    } catch (error) {
      console.error('Error deleting habit:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete habit');
    }
  };

  const handleMarkComplete = async (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    try {
      await completeHabit(habitId, habit.name);
      await fetchHabits();

      const refreshed = await getHabits();
      const updatedHabit = refreshed.find(h => h.id === habitId);
      toast.success(`Completed. Current streak: ${updatedHabit?.currentStreak ?? habit.currentStreak}.`);
    } catch (error) {
      console.error('Error marking habit complete:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to mark habit as complete');
    }
  };

  const handleMarkIncomplete = async (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;
    try {
      await undoHabitCompletion(habitId);
      await fetchHabits();
      toast.success('Completion removed');
    } catch (error) {
      console.error('Error updating habit:', error);
      toast.error('Failed to update habit');
    }
  };

  const totalHabits = habits.length;
  const activeHabits = habits.filter(habit => habit.isActive).length;
  const totalStreaks = habits.reduce((sum, habit) => sum + habit.currentStreak, 0);
  const averageStreak = totalHabits > 0 ? Math.round(totalStreaks / totalHabits) : 0;

  // Today's progress
  const today = getTodayLocalDateKey();
  const completedToday = habits.filter(h => h.completedDates?.includes(today)).length;
  const todayProgress = activeHabits > 0 ? Math.round((completedToday / activeHabits) * 100) : 0;

  // Weekly heatmap data (last 7 days)
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dateKey = format(date, 'yyyy-MM-dd');
      const completed = habits.filter(h => h.completedDates?.includes(dateKey)).length;
      return {
        label: format(date, 'EEE'),
        date: dateKey,
        completed,
        total: activeHabits,
        intensity: activeHabits > 0 ? completed / activeHabits : 0,
      };
    });
  }, [habits, activeHabits]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-center my-12">
          <p className="text-muted-foreground">Loading habits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Habits</h1>
          <p className="text-muted-foreground mt-1">Build consistent routines and track your progress</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-brand hover:bg-brand/90 text-white">
          <Plus className="h-4 w-4 mr-2" />
          New Habit
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total Habits", value: totalHabits, icon: <Flame className="h-8 w-8 text-brand" /> },
          { label: "Active Habits", value: activeHabits, icon: <CheckCircle className="h-8 w-8 text-accent" /> },
          { label: "Avg Streak", value: averageStreak, icon: <BarChart3 className="h-8 w-8 text-primary" /> },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
                  </div>
                  {stat.icon}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Today's Progress + Weekly Heatmap */}
      {activeHabits > 0 && (
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
              {/* Today's progress */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Today's Progress</span>
                  <span className="text-sm font-bold text-foreground">{completedToday}/{activeHabits}</span>
                </div>
                <Progress value={todayProgress} className="h-2.5" />
              </div>
              {/* Weekly heatmap */}
              <div className="flex items-end gap-1.5">
                {weekDays.map((day) => (
                  <div key={day.date} className="flex flex-col items-center gap-1">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-md flex items-center justify-center text-xs font-medium transition-colors",
                        day.intensity === 0 && "bg-muted text-muted-foreground",
                        day.intensity > 0 && day.intensity <= 0.33 && "bg-accent/30 text-accent-foreground",
                        day.intensity > 0.33 && day.intensity <= 0.66 && "bg-accent/60 text-accent-foreground",
                        day.intensity > 0.66 && "bg-accent text-accent-foreground"
                      )}
                    >
                      {day.completed}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{day.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        {(['all', 'health', 'productivity', 'personal', 'learning', 'other'] as const).map((category) => (
          <Button
            key={category}
            variant={filter === category ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(category)}
            className={filter === category ? 'bg-brand hover:bg-brand/90 text-white' : ''}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </Button>
        ))}
      </div>

      {/* Habits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredHabits.map((habit, i) => (
          <motion.div key={habit.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <HabitCard
              habit={habit}
              onEdit={(habit) => { setSelectedHabit(habit); setIsEditDialogOpen(true); }}
              onDelete={(habitId) => setHabitToDelete(habits.find((item) => item.id === habitId) || null)}
              onMarkComplete={handleMarkComplete}
              onMarkIncomplete={handleMarkIncomplete}
            />
          </motion.div>
        ))}
      </div>

      {filteredHabits.length === 0 && (
        <EmptyState
          title={filter === 'all' ? 'No habits yet' : `No ${filter} habits found`}
          description="Start building positive habits to improve your daily routine"
          illustration="habits"
          actionLabel="Create Habit"
          onAction={() => setIsCreateDialogOpen(true)}
        />
      )}

      <HabitForm isOpen={isCreateDialogOpen} onClose={() => setIsCreateDialogOpen(false)} onSave={handleCreateHabit} habit={null} />
      <HabitForm
        isOpen={isEditDialogOpen}
        onClose={() => { setIsEditDialogOpen(false); setSelectedHabit(null); }}
        onSave={handleEditHabit}
        habit={selectedHabit}
      />
      <AlertDialog open={Boolean(habitToDelete)} onOpenChange={(open) => !open && setHabitToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {habitToDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>This permanently removes the habit and its completion history.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteHabit}>Delete habit</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Habits;
