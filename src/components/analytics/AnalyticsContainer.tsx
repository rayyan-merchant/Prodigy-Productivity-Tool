
import React, { useState, useEffect } from 'react';
import { getTasks } from '@/services/taskService';
import { getAllSessions, getSessionStats } from '@/services/sessionService';
import { toast } from 'sonner';
import type { Task } from '@/types/tasks';
import type { PomodoroSession } from '@/services/sessionService';

// Helper function to get date range based on days selection
const getDateRangeFromDays = (days: number) => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);
  return { start, end };
};

type DateRangeType = '1d' | '7d' | '30d' | 'all';

interface AnalyticsData {
  tasks: Task[];
  sessions: PomodoroSession[];
  allSessions: PomodoroSession[];
  allTasks: Task[];
  completedTasks: number;
  focusHours: number;
  avgDailyFocus: number;
  sessionsCompleted: number;
  taskData: { date: string; tasks: number }[];
  focusData: { date: string; hours: number }[];
  projectTimeData: { name: string; value: number }[];
  thisWeekFocusTime: number;
  todayFocusTime: number;
  thisWeekCompletedTasks: number;
  todayCompletedTasks: number;
  totalCompletedTasks: number;
  totalFocusTime: number;
  hasData: boolean;
  isLoading: boolean;
  dateRange: { start: Date; end: Date };
  dateRangeType: DateRangeType;
}

interface AnalyticsContainerProps {
  children: (data: AnalyticsData & {
    handleDateRangeChange: (range: DateRangeType) => void;
  }) => React.ReactNode;
}

const AnalyticsContainer: React.FC<AnalyticsContainerProps> = ({ children }) => {
  const [dateRangeType, setDateRangeType] = useState<DateRangeType>('7d');
  const [dateRange, setDateRange] = useState(getDateRangeFromDays(7));
  const [isLoading, setIsLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [allSessions, setAllSessions] = useState<PomodoroSession[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [hasData, setHasData] = useState(false);

  // Summary metrics
  const [completedTasks, setCompletedTasks] = useState(0);
  const [focusHours, setFocusHours] = useState(0);
  const [avgDailyFocus, setAvgDailyFocus] = useState(0);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  
  // Data for charts
  const [taskData, setTaskData] = useState<{ date: string; tasks: number }[]>([]);
  const [focusData, setFocusData] = useState<{ date: string; hours: number }[]>([]);
  const [projectTimeData, setProjectTimeData] = useState<{ name: string; value: number }[]>([]);
  
  // Summary stats
  const [thisWeekFocusTime, setThisWeekFocusTime] = useState(0);
  const [todayFocusTime, setTodayFocusTime] = useState(0);
  const [thisWeekCompletedTasks, setThisWeekCompletedTasks] = useState(0);
  const [todayCompletedTasks, setTodayCompletedTasks] = useState(0);
  const [totalCompletedTasks, setTotalCompletedTasks] = useState(0);
  const [totalFocusTime, setTotalFocusTime] = useState(0);

  // Process data for charts
  const processData = (tasks: Task[], sessions: PomodoroSession[], range: DateRangeType, rangeStart: Date, rangeEnd: Date) => {
    // Decide bucket granularity by range
    // 1d -> hour buckets; 7d -> weekday; 30d -> day-of-month; all -> month
    const formatBucket = (d: Date): string => {
      if (range === '1d') return d.toLocaleTimeString('en-US', { hour: 'numeric' });
      if (range === '7d') return d.toLocaleDateString('en-US', { weekday: 'short' });
      if (range === '30d') return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    };

    // Pre-seed ordered buckets so chart x-axis is continuous
    const orderedKeys: string[] = [];
    if (range === '1d') {
      for (let h = 0; h < 24; h++) {
        const d = new Date(); d.setHours(h, 0, 0, 0);
        orderedKeys.push(formatBucket(d));
      }
    } else if (range === '7d' || range === '30d') {
      const days = range === '7d' ? 7 : 30;
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
        orderedKeys.push(formatBucket(d));
      }
    } else {
      // 'all' -> last 12 months
      for (let i = 11; i >= 0; i--) {
        const d = new Date(); d.setMonth(d.getMonth() - i, 1);
        orderedKeys.push(formatBucket(d));
      }
    }

    const tasksByDate = new Map<string, number>(orderedKeys.map(k => [k, 0]));
    tasks.forEach(task => {
      if (task.status === 'completed' && task.completedAt) {
        const key = formatBucket(new Date(task.completedAt));
        if (tasksByDate.has(key)) tasksByDate.set(key, (tasksByDate.get(key) || 0) + 1);
      }
    });
    setTaskData(orderedKeys.map(date => ({ date, tasks: tasksByDate.get(date) || 0 })));

    const focusByDate = new Map<string, number>(orderedKeys.map(k => [k, 0]));
    sessions.forEach(session => {
      if (!session.date) return;
      const sessionDate = typeof session.date === 'string' ? new Date(session.date) : session.date;
      const key = formatBucket(sessionDate);
      if (focusByDate.has(key)) {
        const hours = (session.duration || 0) / 60;
        focusByDate.set(key, (focusByDate.get(key) || 0) + hours);
      }
    });
    setFocusData(orderedKeys.map(date => ({ date, hours: Math.round((focusByDate.get(date) || 0) * 10) / 10 })));

    // Project time distribution
    const projectTime = new Map<string, number>();
    sessions.forEach(session => {
      if (session.project) {
        const hours = (session.duration || 0) / 60;
        projectTime.set(session.project, (projectTime.get(session.project) || 0) + hours);
      }
    });
    setProjectTimeData(Array.from(projectTime, ([name, value]) => ({ name, value })));

    // Today / this-week metrics use calendar boundaries (independent of selected range)
    const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
    const oneWeekAgo = new Date(); oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    let todayTasks = 0, weekTasks = 0, todayTime = 0, weekTime = 0;

    tasks.forEach(task => {
      if (task.status === 'completed' && task.completedAt) {
        const taskDate = new Date(task.completedAt);
        if (taskDate >= startOfToday) todayTasks++;
        if (taskDate >= oneWeekAgo) weekTasks++;
      }
    });

    sessions.forEach(session => {
      if (session.date && session.type === 'focus' && session.completed) {
        const sessionDate = typeof session.date === 'string' ? new Date(session.date) : session.date;
        const hours = (session.duration || 0) / 60;
        if (sessionDate >= startOfToday) todayTime += hours;
        if (sessionDate >= oneWeekAgo) weekTime += hours;
      }
    });

    setTodayCompletedTasks(todayTasks);
    setThisWeekCompletedTasks(weekTasks);
    setTodayFocusTime(Math.round(todayTime * 10) / 10);
    setThisWeekFocusTime(Math.round(weekTime * 10) / 10);
  };


  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        const fetchedTasks = await getTasks() || [];
        setAllTasks(fetchedTasks);
        
        const filteredTasks = fetchedTasks.filter((task) => {
          const taskDate = task.completedAt ? new Date(task.completedAt) : 
                          task.createdAt ? new Date(task.createdAt) : null;
          
          if (!taskDate) return false;
          return taskDate >= dateRange.start && taskDate <= dateRange.end;
        });
        
        setTasks(filteredTasks);
        
        const fetchedSessions = await getAllSessions();
        setAllSessions(fetchedSessions);
        
        // Filter sessions by date range
        const filteredSessions = fetchedSessions.filter(session => {
          const sessionDate = typeof session.date === 'string' ? new Date(session.date) : session.date;
          return sessionDate >= dateRange.start && sessionDate <= dateRange.end;
        });
        
        setSessions(filteredSessions);
        
        // Calculate completed tasks
        const completed = filteredTasks.filter((task) => task.status === 'completed').length;
        setCompletedTasks(completed);
        setTotalCompletedTasks(completed);
        
        // Calculate focus time from real sessions
        const focusSessions = filteredSessions.filter(session => 
          session.type === 'focus' && session.completed
        );
        
        const totalFocusTime = focusSessions.reduce((total, session) =>
          total + (session.duration || 0), 0);
        const focusTimeHours = Math.round((totalFocusTime / 60) * 10) / 10;
        setFocusHours(focusTimeHours);
        setTotalFocusTime(focusTimeHours);
        
        const days = Math.max(1, Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 3600 * 24)));
        const avgDaily = Math.round((focusTimeHours / days) * 10) / 10;
        setAvgDailyFocus(avgDaily);
        
        setSessionsCompleted(focusSessions.length);
        
        processData(filteredTasks, filteredSessions, dateRangeType, dateRange.start, dateRange.end);
        
        setHasData(filteredTasks.length > 0 || filteredSessions.length > 0);
        
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        toast.error('Failed to load analytics data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [dateRange, dateRangeType]);

  const handleDateRangeChange = (range: DateRangeType) => {
    setDateRangeType(range);

    if (range === '1d') {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const end = new Date(); end.setHours(23, 59, 59, 999);
      setDateRange({ start, end });
    } else if (range === '7d') {
      setDateRange(getDateRangeFromDays(7));
    } else if (range === '30d') {
      setDateRange(getDateRangeFromDays(30));
    } else {
      const end = new Date();
      const start = new Date();
      start.setFullYear(start.getFullYear() - 10);
      setDateRange({ start, end });
    }
  };


  return (
    <>
      {children({
        tasks,
        sessions,
        allSessions,
        allTasks,
        completedTasks,
        focusHours,
        avgDailyFocus,
        sessionsCompleted,
        taskData,
        focusData,
        projectTimeData,
        thisWeekFocusTime,
        todayFocusTime,
        thisWeekCompletedTasks,
        todayCompletedTasks,
        totalCompletedTasks,
        totalFocusTime,
        hasData,
        isLoading,
        dateRange,
        dateRangeType,
        handleDateRangeChange
      })}
    </>
  );
};

export default AnalyticsContainer;
