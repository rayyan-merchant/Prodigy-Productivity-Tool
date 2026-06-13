
import React, { useState, useEffect } from 'react';
import { Activity, FileText, CheckSquare, Target, Flame, Clock, Settings } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Activity as ActivityType } from '@/types/habits';
import { getRecentActivities } from '@/services/activityService';
import { cn } from '@/lib/utils';

const RecentActivityTimeline: React.FC = () => {
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const recentActivities = await getRecentActivities(5);
        setActivities(recentActivities);
      } catch (error) {
        console.error('Error fetching activities:', error);
        setError('Failed to load activities');
      } finally {
        setIsLoading(false);
      }
    };
    fetchActivities();
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task': return <CheckSquare className="h-3.5 w-3.5" />;
      case 'note': return <FileText className="h-3.5 w-3.5" />;
      case 'goal': return <Target className="h-3.5 w-3.5" />;
      case 'habit': return <Flame className="h-3.5 w-3.5" />;
      case 'session': return <Clock className="h-3.5 w-3.5" />;
      case 'settings': return <Settings className="h-3.5 w-3.5" />;
      default: return <Activity className="h-3.5 w-3.5" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'task': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
      case 'note': return 'bg-green-500/10 text-green-600 dark:text-green-400';
      case 'goal': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
      case 'habit': return 'bg-orange-500/10 text-orange-600 dark:text-orange-400';
      case 'session': return 'bg-red-500/10 text-red-600 dark:text-red-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d`;
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-5">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
          <Activity className="h-4 w-4" /> Recent Activity
        </h3>
        <div className="animate-pulse space-y-3">
          <div className="h-10 bg-muted/50 rounded-xl" />
          <div className="h-10 bg-muted/50 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
      <div className="px-5 pt-4 pb-2">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Activity className="h-4 w-4" /> Recent Activity
        </h3>
      </div>
      <div className="px-5 pb-4">
        {error ? (
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-xs">{error}</p>
          </div>
        ) : activities.length > 0 ? (
          <div className="space-y-2">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/30 transition-colors">
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", getActivityColor(activity.type))}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{activity.title}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{activity.description}</p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">{formatTimeAgo(activity.timestamp)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Activity className="h-6 w-6 mx-auto mb-2 opacity-40" />
            <p className="text-xs">No recent activity</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentActivityTimeline;
