import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Droplets } from 'lucide-react';
import { toast } from 'sonner';
import WaterProgressRing from '@/components/water/WaterProgressRing';
import WaterBottleAnimation from '@/components/water/WaterBottleAnimation';
import QuickAddButtons from '@/components/water/QuickAddButtons';
import WaterIntakeLog from '@/components/water/WaterIntakeLog';
import WaterHistory from '@/components/water/WaterHistory';
import HydrationStats from '@/components/water/HydrationStats';
import AIHydrationInsights from '@/components/water/AIHydrationInsights';
import WaterSettingsDialog from '@/components/water/WaterSettingsDialog';
import {
  getTodayWaterIntake,
  getWaterIntakeHistory,
  getWaterSettings,
  upsertWaterSettings,
  addWaterIntake,
  deleteWaterIntake,
  getHydrationStreak,
  WaterIntake,
} from '@/services/waterService';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

const WaterTracker: React.FC = () => {
  const [todayEntries, setTodayEntries] = useState<WaterIntake[]>([]);
  const [history, setHistory] = useState<WaterIntake[]>([]);
  const [goalMl, setGoalMl] = useState(2000);
  const [reminderInterval, setReminderInterval] = useState(60);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [streak, setStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [entries, hist, settings, streakVal] = await Promise.all([
        getTodayWaterIntake(),
        getWaterIntakeHistory(7),
        getWaterSettings(),
        getHydrationStreak(),
      ]);
      setTodayEntries(entries);
      setHistory(hist);
      setStreak(streakVal);
      if (settings) {
        setGoalMl(settings.daily_goal_ml);
        setReminderInterval(settings.reminder_interval_minutes);
        setRemindersEnabled(settings.reminders_enabled);
      }
    } catch (error) {
      console.error('Error loading water data:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time subscription
  useRealtimeSubscription('water_intake', loadData);

  const todayTotal = todayEntries.reduce((sum, e) => sum + e.amount_ml, 0);

  const handleAdd = async (amount: number) => {
    setIsLoading(true);
    try {
      await addWaterIntake(amount);
      await loadData();
      
      const newTotal = todayTotal + amount;
      if (newTotal >= goalMl && todayTotal < goalMl) {
        toast.success('Daily hydration goal reached');
      } else {
        toast.success(`${amount} ml logged`);
      }
    } catch (error) {
      console.error('Error adding water:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to log water intake');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteWaterIntake(id);
      await loadData();
      toast.success('Entry removed');
    } catch (error) {
      toast.error('Failed to delete entry');
    }
  };

  const handleSaveSettings = async (settings: {
    daily_goal_ml: number;
    reminder_interval_minutes: number;
    reminders_enabled: boolean;
  }) => {
    try {
      await upsertWaterSettings(settings);
      setGoalMl(settings.daily_goal_ml);
      setReminderInterval(settings.reminder_interval_minutes);
      setRemindersEnabled(settings.reminders_enabled);
      toast.success('Settings saved');
    } catch (error) {
      toast.error('Failed to save settings');
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 pb-20 lg:pb-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'hsl(200 85% 55% / 0.15)' }}>
              <Droplets className="w-5 h-5" style={{ color: 'hsl(200 85% 55%)' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Water Tracker</h1>
              <p className="text-sm text-muted-foreground">Stay hydrated, stay productive</p>
            </div>
          </div>
          <WaterSettingsDialog
            goalMl={goalMl}
            reminderInterval={reminderInterval}
            remindersEnabled={remindersEnabled}
            onSave={handleSaveSettings}
          />
        </div>

        {/* Progress Ring + Bottle */}
        <div className="flex items-center justify-center gap-8 py-4 flex-wrap">
          <WaterProgressRing consumed={todayTotal} goal={goalMl} />
          <WaterBottleAnimation consumed={todayTotal} goal={goalMl} />
        </div>

        {/* Quick Add */}
        <QuickAddButtons onAdd={handleAdd} isLoading={isLoading} />

        {/* Stats */}
        <HydrationStats history={history} streak={streak} goal={goalMl} />

        {/* Today's Log */}
        <WaterIntakeLog entries={todayEntries} onDelete={handleDelete} />

        {/* AI Insights */}
        <AIHydrationInsights history={history} goal={goalMl} streak={streak} />

        {/* Weekly Chart */}
        <WaterHistory history={history} goal={goalMl} />
      </motion.div>
    </div>
  );
};

export default WaterTracker;
