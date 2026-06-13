
import React, { useEffect, useState } from 'react';
import MotivationalQuote from "@/components/dashboard/MotivationalQuote";
import { toLocalDateKey } from '@/lib/dateOnly';

interface DashboardGreetingProps {
  greeting: string;
  quotes: string[];
  completionRate?: number;
}

const getLoginStreak = (): number => {
  const today = toLocalDateKey();
  const lastLogin = localStorage.getItem('lastLoginDate');
  const storedStreak = parseInt(localStorage.getItem('loginStreak') || '0', 10);

  if (lastLogin === today) return storedStreak;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = toLocalDateKey(yesterday);

  let newStreak: number;
  if (lastLogin === yesterdayStr) {
    newStreak = storedStreak + 1;
  } else {
    newStreak = 1; // first day or streak broken
  }

  localStorage.setItem('lastLoginDate', today);
  localStorage.setItem('loginStreak', newStreak.toString());
  return newStreak;
};

const DashboardGreeting: React.FC<DashboardGreetingProps> = ({ 
  greeting, 
  quotes, 
  completionRate = 0 
}) => {
  const [streakCount, setStreakCount] = useState(0);

  useEffect(() => {
    setStreakCount(getLoginStreak());
  }, []);
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionRate / 100) * circumference;

  return (
    <div className="flex items-center gap-5">
      {/* Progress Ring */}
      <div className="relative w-16 h-16 shrink-0">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 64 64">
          <circle
            cx="32" cy="32" r={radius}
            stroke="currentColor" strokeWidth="3.5" fill="transparent"
            className="text-muted/20"
          />
          <circle
            cx="32" cy="32" r={radius}
            stroke="currentColor" strokeWidth="3.5" fill="transparent"
            className="text-primary transition-all duration-700 ease-out"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-foreground">
            {Math.round(completionRate)}%
          </span>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight truncate">{greeting}</h1>
        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 mt-1">
          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
            🔥 {streakCount} day streak
          </span>
          <MotivationalQuote quotes={quotes} />
        </div>
      </div>
    </div>
  );
};

export default DashboardGreeting;
