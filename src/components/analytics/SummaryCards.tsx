
import React from 'react';
import SummaryCard from "@/components/analytics/SummaryCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, CheckSquare } from "lucide-react";

interface SummaryCardsProps {
  isLoading: boolean;
  totalFocusTime: number;
  thisWeekFocusTime: number;
  todayFocusTime: number;
  totalCompletedTasks: number;
  thisWeekCompletedTasks: number;
  todayCompletedTasks: number;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({
  isLoading,
  totalFocusTime,
  thisWeekFocusTime,
  todayFocusTime,
  totalCompletedTasks,
  thisWeekCompletedTasks,
  todayCompletedTasks
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {isLoading ? (
        <>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </>
      ) : (
        <>
          <SummaryCard 
            title="Total Focus Time" 
            value={`${totalFocusTime.toFixed(1)}h`}
            icon={<Clock className="h-4 w-4" />} 
            color="text-brand"
          />
          <SummaryCard 
            title="Focus This Week" 
            value={`${thisWeekFocusTime.toFixed(1)}h`}
            icon={<Clock className="h-4 w-4" />} 
            color="text-brand"
          />
          <SummaryCard 
            title="Focus Today" 
            value={`${todayFocusTime.toFixed(1)}h`}
            icon={<Clock className="h-4 w-4" />} 
            color="text-brand"
          />
          <SummaryCard 
            title="Total Completed" 
            value={totalCompletedTasks.toString()}
            icon={<CheckSquare className="h-4 w-4" />} 
            color="text-primary"
          />
          <SummaryCard 
            title="Completed This Week" 
            value={thisWeekCompletedTasks.toString()}
            icon={<CheckSquare className="h-4 w-4" />} 
            color="text-primary"
          />
          <SummaryCard 
            title="Completed Today" 
            value={todayCompletedTasks.toString()}
            icon={<CheckSquare className="h-4 w-4" />} 
            color="text-primary"
          />
        </>
      )}
    </div>
  );
};

export default SummaryCards;
