
import React, { useMemo } from 'react';
import AnalyticsContainer from '@/components/analytics/AnalyticsContainer';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2, Flame, TrendingUp, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import WeeklyAiInsights from '@/components/analytics/WeeklyAiInsights';
import NoDataPlaceholder from '@/components/analytics/NoDataPlaceholder';
import type { Task } from '@/types/tasks';
import type { PomodoroSession } from '@/services/sessionService';
import { parseLocalDate, toLocalDateKey } from '@/lib/dateOnly';

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4 },
});

type DateRangeType = '1d' | '7d' | '30d' | 'all';

const dateRangeOptions: { value: DateRangeType; label: string }[] = [
  { value: '1d', label: 'Today' },
  { value: '7d', label: '7D' },
  { value: '30d', label: 'Month' },
  { value: 'all', label: 'All' },
];

interface StatCardProps {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  accentClass: string;
  delay: number;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, sub, icon, accentClass, delay }) => (
  <motion.div {...fadeUp(delay)}>
    <Card className="relative overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow">
      <div className={`absolute inset-0 opacity-[0.06] ${accentClass}`} />
      <CardContent className="p-5 flex items-start gap-4">
        <div className={`shrink-0 rounded-xl p-2.5 ${accentClass} bg-opacity-10`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase">{label}</p>
          <p className="text-2xl font-bold mt-0.5 leading-tight">{value}</p>
          <p className="text-xs text-muted-foreground mt-1">{sub}</p>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

// Activity Heatmap Component
interface HeatmapProps {
  sessions: PomodoroSession[];
  tasks: Task[];
}

const ActivityHeatmap: React.FC<HeatmapProps> = ({ sessions, tasks }) => {
  const { weeks, maxActivity, monthLabels } = useMemo(() => {
    // Build a map of date -> activity count (sessions + completed tasks)
    const activityMap = new Map<string, number>();

    sessions.forEach((s) => {
      const d = s.date ? new Date(typeof s.date === 'string' ? s.date : s.date) : null;
      if (!d) return;
      const key = toLocalDateKey(d);
      activityMap.set(key, (activityMap.get(key) || 0) + 1);
    });

    tasks.forEach((t) => {
      if (t.status === 'completed' && t.completedAt) {
        const key = toLocalDateKey(new Date(t.completedAt));
        activityMap.set(key, (activityMap.get(key) || 0) + 1);
      }
    });

    // Generate last 20 weeks of dates (140 days)
    const today = new Date();
    const totalDays = 140;
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - totalDays + 1);

    // Adjust start to a Sunday
    const startDay = startDate.getDay();
    startDate.setDate(startDate.getDate() - startDay);

    const days: { date: string; count: number; dayOfWeek: number }[] = [];
    const cursor = new Date(startDate);
    while (cursor <= today) {
      const key = toLocalDateKey(cursor);
      days.push({ date: key, count: activityMap.get(key) || 0, dayOfWeek: cursor.getDay() });
      cursor.setDate(cursor.getDate() + 1);
    }

    // Group into weeks
    const weeks: { date: string; count: number; dayOfWeek: number }[][] = [];
    let currentWeek: typeof days = [];
    days.forEach((day) => {
      if (day.dayOfWeek === 0 && currentWeek.length > 0) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(day);
    });
    if (currentWeek.length > 0) weeks.push(currentWeek);

    const maxActivity = Math.max(1, ...days.map((d) => d.count));

    // Month labels
    const monthLabels: { label: string; weekIndex: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, wi) => {
      const firstDay = week[0];
      const month = parseLocalDate(firstDay.date).getMonth();
      if (month !== lastMonth) {
        monthLabels.push({
          label: parseLocalDate(firstDay.date).toLocaleString('en-US', { month: 'short' }),
          weekIndex: wi,
        });
        lastMonth = month;
      }
    });

    return { weeks, maxActivity, monthLabels };
  }, [sessions, tasks]);

  const getColor = (count: number) => {
    if (count === 0) return 'bg-muted';
    const ratio = count / maxActivity;
    if (ratio <= 0.25) return 'bg-primary/20';
    if (ratio <= 0.5) return 'bg-primary/40';
    if (ratio <= 0.75) return 'bg-primary/70';
    return 'bg-primary';
  };

  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Activity</CardTitle>
        <p className="text-xs text-muted-foreground">Sessions & completed tasks over the last 20 weeks</p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          {/* Month labels */}
          <div className="relative h-4 mb-1 ml-8" style={{ width: `${weeks.length * 17}px` }}>
            {monthLabels.map((m, i) => (
              <div
                key={i}
                className="absolute top-0 text-[10px] text-muted-foreground"
                style={{ left: `${m.weekIndex * 17}px` }}
              >
                {m.label}
              </div>
            ))}
          </div>

          <div className="flex gap-0.5">
            {/* Day labels */}
            <div className="flex flex-col gap-0.5 mr-1 shrink-0">
              {dayLabels.map((label, i) => (
                <div key={i} className="h-[14px] w-6 text-[10px] text-muted-foreground flex items-center justify-end pr-1">
                  {label}
                </div>
              ))}
            </div>
            {/* Grid */}
            <TooltipProvider delayDuration={100}>
              <div className="flex gap-[3px]">
                {weeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-[3px]">
                    {Array.from({ length: 7 }).map((_, di) => {
                      const day = week.find((d) => d.dayOfWeek === di);
                      if (!day) return <div key={di} className="w-[14px] h-[14px]" />;
                      return (
                        <Tooltip key={di}>
                          <TooltipTrigger asChild>
                            <div
                              className={`w-[14px] h-[14px] rounded-[3px] transition-colors ${getColor(day.count)} hover:ring-1 hover:ring-foreground/20`}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            <p className="font-medium">{day.count} activit{day.count === 1 ? 'y' : 'ies'}</p>
                            <p className="text-muted-foreground">{parseLocalDate(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                ))}
              </div>
            </TooltipProvider>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-1.5 mt-3 justify-end">
            <span className="text-[10px] text-muted-foreground">Less</span>
            <div className="w-[12px] h-[12px] rounded-[2px] bg-muted" />
            <div className="w-[12px] h-[12px] rounded-[2px] bg-primary/20" />
            <div className="w-[12px] h-[12px] rounded-[2px] bg-primary/40" />
            <div className="w-[12px] h-[12px] rounded-[2px] bg-primary/70" />
            <div className="w-[12px] h-[12px] rounded-[2px] bg-primary" />
            <span className="text-[10px] text-muted-foreground">More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Analytics = () => {
  return (
    <AnalyticsContainer>
      {({
        isLoading,
        hasData,
        dateRangeType,
        handleDateRangeChange,
        totalFocusTime,
        thisWeekFocusTime,
        todayFocusTime,
        totalCompletedTasks,
        thisWeekCompletedTasks,
        todayCompletedTasks,
        taskData,
        focusData,
        completedTasks,
        focusHours,
        sessionsCompleted,
        allSessions,
        allTasks,
      }) => (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Header */}
          <motion.div {...fadeUp(0)} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-primary" />
                Analytics
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Track your productivity and focus patterns</p>
            </div>
            <div className="flex bg-muted rounded-lg p-1 gap-0.5">
              {dateRangeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleDateRangeChange(opt.value)}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                    dateRangeType === opt.value
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </motion.div>

          {isLoading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="border-none shadow-sm">
                    <CardContent className="p-5">
                      <Skeleton className="h-16 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-none shadow-sm"><CardContent className="p-6"><Skeleton className="h-[280px] w-full" /></CardContent></Card>
                <Card className="border-none shadow-sm"><CardContent className="p-6"><Skeleton className="h-[280px] w-full" /></CardContent></Card>
              </div>
            </div>
          ) : !hasData ? (
            <motion.div {...fadeUp(0.15)}>
              <NoDataPlaceholder />
            </motion.div>
          ) : (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  label="Today's Focus"
                  value={`${todayFocusTime.toFixed(1)}h`}
                  sub={`${thisWeekFocusTime.toFixed(1)}h this week`}
                  icon={<Clock className="h-5 w-5 text-primary" />}
                  accentClass="bg-primary"
                  delay={0.1}
                />
                <StatCard
                  label="Tasks Done"
                  value={todayCompletedTasks.toString()}
                  sub={`${thisWeekCompletedTasks} this week`}
                  icon={<CheckCircle2 className="h-5 w-5 text-primary" />}
                  accentClass="bg-primary"
                  delay={0.15}
                />
                <StatCard
                  label="Sessions"
                  value={sessionsCompleted.toString()}
                  sub="focus sessions completed"
                  icon={<Flame className="h-5 w-5 text-primary" />}
                  accentClass="bg-primary"
                  delay={0.2}
                />
                <StatCard
                  label="Total Focus"
                  value={`${totalFocusTime.toFixed(1)}h`}
                  sub={`${totalCompletedTasks} total tasks`}
                  icon={<TrendingUp className="h-5 w-5 text-primary" />}
                  accentClass="bg-primary"
                  delay={0.25}
                />
              </div>

              {/* Activity Heatmap */}
              <motion.div {...fadeUp(0.28)}>
                <ActivityHeatmap sessions={allSessions} tasks={allTasks} />
              </motion.div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Focus Time Chart */}
                <motion.div {...fadeUp(0.3)}>
                  <Card className="border-none shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold">Focus Time</CardTitle>
                      {focusData.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Peak: {Math.max(...focusData.map(d => d.hours)).toFixed(1)}h | Avg: {(totalFocusTime / Math.max(1, focusData.length)).toFixed(1)}h
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="h-[280px]">
                      {focusData.length > 0 ? (
                        <ChartContainer config={{ line: { color: "hsl(var(--primary))" } }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={focusData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                              <defs>
                                <linearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                              <ChartTooltip content={<ChartTooltipContent />} />
                              <Area type="monotone" dataKey="hours" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#analyticsGradient)" dot={{ r: 3, fill: 'hsl(var(--primary))' }} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-sm text-muted-foreground">No focus data yet</div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Task Completion Chart */}
                <motion.div {...fadeUp(0.35)}>
                  <Card className="border-none shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold">Tasks Completed</CardTitle>
                      {taskData.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Best: {Math.max(...taskData.map(d => d.tasks))} tasks | Avg: {(totalCompletedTasks / Math.max(1, taskData.length)).toFixed(1)}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="h-[280px]">
                      {taskData.length > 0 ? (
                        <ChartContainer config={{ bar: { color: "hsl(var(--primary))" } }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={taskData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                              <defs>
                                <linearGradient id="taskBarGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.9} />
                                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                              <ChartTooltip content={<ChartTooltipContent />} />
                              <Bar dataKey="tasks" radius={[6, 6, 0, 0]} fill="url(#taskBarGradient)" />
                            </BarChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-sm text-muted-foreground">No task data yet</div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* AI Insights */}
              <motion.div {...fadeUp(0.4)}>
                <WeeklyAiInsights
                  completedTasks={completedTasks}
                  focusHours={focusHours}
                  sessionsCompleted={sessionsCompleted}
                />
              </motion.div>
            </>
          )}
        </motion.div>
      )}
    </AnalyticsContainer>
  );
};

export default Analytics;
