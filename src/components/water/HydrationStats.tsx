import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Flame, TrendingUp, Award } from 'lucide-react';
import { WaterIntake } from '@/services/waterService';
import { toLocalDateKey } from '@/lib/dateOnly';

interface HydrationStatsProps {
  history: WaterIntake[];
  streak: number;
  goal: number;
}

const HydrationStats: React.FC<HydrationStatsProps> = ({ history, streak, goal }) => {
  // Calculate averages from history
  const dailyMap = new Map<string, number>();
  history.forEach(entry => {
    const day = toLocalDateKey(new Date(entry.logged_at));
    dailyMap.set(day, (dailyMap.get(day) || 0) + entry.amount_ml);
  });

  const dailyTotals = Array.from(dailyMap.values());
  const avgIntake = dailyTotals.length > 0
    ? Math.round(dailyTotals.reduce((a, b) => a + b, 0) / dailyTotals.length)
    : 0;
  const bestDay = dailyTotals.length > 0 ? Math.max(...dailyTotals) : 0;
  const daysMetGoal = dailyTotals.filter(t => t >= goal).length;
  const consistency = dailyTotals.length > 0
    ? Math.round((daysMetGoal / dailyTotals.length) * 100)
    : 0;

  const stats = [
    {
      icon: Flame,
      label: 'Streak',
      value: `${streak} day${streak !== 1 ? 's' : ''}`,
      color: 'hsl(25 95% 55%)',
    },
    {
      icon: TrendingUp,
      label: 'Daily Avg',
      value: `${(avgIntake / 1000).toFixed(1)}L`,
      color: 'hsl(200 85% 55%)',
    },
    {
      icon: Award,
      label: 'Consistency',
      value: `${consistency}%`,
      color: 'hsl(142 70% 45%)',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map(stat => (
        <Card key={stat.label} className="bg-card border-border">
          <CardContent className="p-3 text-center">
            <stat.icon className="w-5 h-5 mx-auto mb-1" style={{ color: stat.color }} />
            <p className="text-lg font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default HydrationStats;
