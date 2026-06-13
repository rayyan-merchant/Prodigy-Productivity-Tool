import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Flame, Calendar, Target } from 'lucide-react';

interface HabitStreakIndicatorProps {
  currentStreak: number;
  bestStreak: number;
  completedToday: boolean;
  targetFrequency: 'daily' | 'weekly' | 'monthly';
}

const HabitStreakIndicator: React.FC<HabitStreakIndicatorProps> = ({
  currentStreak,
  bestStreak,
  completedToday,
  targetFrequency,
}) => {
  const getStreakColor = (streak: number) => {
    if (streak === 0) return "text-muted-foreground";
    if (streak < 7) return "text-orange-500";
    if (streak < 30) return "text-yellow-500";
    return "text-red-500";
  };

  const getFrequencyIcon = () => {
    switch (targetFrequency) {
      case 'daily': return <Calendar className="h-3 w-3" />;
      case 'weekly': return <Target className="h-3 w-3" />;
      case 'monthly': return <Target className="h-3 w-3" />;
      default: return <Target className="h-3 w-3" />;
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <Flame className={`h-4 w-4 ${getStreakColor(currentStreak)}`} />
          <span className="text-sm font-medium">
            {currentStreak} day{currentStreak !== 1 ? 's' : ''}
          </span>
        </div>
        
        {bestStreak > 0 && bestStreak !== currentStreak && (
          <Badge variant="outline" className="text-xs">
            Best: {bestStreak}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Badge 
          variant={completedToday ? "default" : "outline"}
          className={`text-xs ${
            completedToday 
              ? "bg-green-500/10 text-green-600 dark:text-green-400" 
              : ""
          }`}
        >
          {completedToday ? "Completed" : "Pending"}
        </Badge>
        
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {getFrequencyIcon()}
          {targetFrequency}
        </div>
      </div>
    </div>
  );
};

export default HabitStreakIndicator;