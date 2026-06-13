
import React, { useState, useEffect, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, CheckSquare, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { getTasks } from '@/services/taskService';
import { getHabits } from '@/services/habitService';
import { Task } from '@/types/tasks';
import { Habit } from '@/types/habits';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'task' | 'habit';
  color: string;
  icon: React.ReactNode;
  meta?: string;
}

const Calendar: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [tasks, habits] = await Promise.all([
          getTasks().catch(() => [] as Task[]),
          getHabits().catch(() => [] as Habit[]),
        ]);

        const calendarEvents: CalendarEvent[] = [];

        tasks.forEach((task) => {
          if (task.dueDate) {
            calendarEvents.push({
              id: task.id,
              title: task.title,
              date: task.dueDate,
              type: 'task',
              color: task.status === 'completed' ? 'bg-accent/20 text-accent-foreground' : task.priority === 'high' ? 'bg-destructive/20 text-destructive' : 'bg-primary/20 text-primary',
              icon: <CheckSquare size={10} />,
              meta: task.status,
            });
          }
        });

        habits.forEach((habit) => {
          habit.completedDates?.forEach((date) => {
            calendarEvents.push({
              id: `${habit.id}-${date}`,
              title: habit.name,
              date,
              type: 'habit',
              color: 'bg-orange-500/20 text-orange-600 dark:text-orange-400',
              icon: <Flame size={10} />,
            });
          });
        });

        setEvents(calendarEvents);
      } catch (error) {
        console.error('Error fetching calendar data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    events.forEach((event) => {
      const key = event.date.split('T')[0];
      if (!map[key]) map[key] = [];
      map[key].push(event);
    });
    return map;
  }, [events]);

  const selectedEvents = selectedDate
    ? eventsByDate[format(selectedDate, 'yyyy-MM-dd')] || []
    : [];

  return (
    <div className="space-y-6 fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-1">Calendar</h1>
          <p className="text-muted-foreground">View tasks and habits on a calendar</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft size={16} />
          </Button>
          <span className="font-semibold text-lg min-w-[160px] text-center">{format(currentMonth, 'MMMM yyyy')}</span>
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight size={16} />
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentMonth(new Date()); setSelectedDate(new Date()); }}>
            Today
          </Button>
        </div>
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <div className="w-2.5 h-2.5 rounded-full bg-primary" /> Tasks
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <div className="w-2.5 h-2.5 rounded-full bg-orange-500" /> Habits
        </div>
      </div>

      <div className={cn("grid gap-6", isMobile ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-[1fr_300px]")}>
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="grid grid-cols-7 border-b border-border">
              {(isMobile ? ['S', 'M', 'T', 'W', 'T', 'F', 'S'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']).map((day, i) => (
                <div key={`${day}-${i}`} className="p-2 text-center text-xs font-medium text-muted-foreground bg-muted/30">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {days.map((day) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayEvents = eventsByDate[dateKey] || [];
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isSelected = selectedDate && isSameDay(day, selectedDate);

                return (
                  <button
                    key={dateKey}
                    onClick={() => {
                      setSelectedDate(day);
                      if (isMobile && dayEvents.length > 0) setDrawerOpen(true);
                    }}
                    className={cn(
                      'relative p-1.5 border-b border-r border-border text-left transition-colors hover:bg-muted/50',
                      isMobile ? 'min-h-[56px]' : 'min-h-[80px]',
                      !isCurrentMonth && 'opacity-40',
                      isSelected && 'bg-brand/5 ring-1 ring-brand/30',
                      isToday(day) && 'bg-primary/5'
                    )}
                  >
                    <span className={cn(
                      'text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full',
                      isToday(day) && 'bg-brand text-white',
                    )}>
                      {format(day, 'd')}
                    </span>
                    {isMobile ? (
                      dayEvents.length > 0 && (
                        <div className="flex gap-0.5 mt-0.5 justify-center flex-wrap">
                          {dayEvents.slice(0, 4).map((event) => (
                            <div
                              key={event.id}
                              className={cn(
                                'w-1.5 h-1.5 rounded-full',
                                event.type === 'task' && 'bg-primary',
                                event.type === 'habit' && 'bg-orange-500'
                              )}
                            />
                          ))}
                          {dayEvents.length > 4 && (
                            <span className="text-[8px] text-muted-foreground leading-none">+</span>
                          )}
                        </div>
                      )
                    ) : (
                      <div className="mt-0.5 space-y-0.5">
                        {dayEvents.slice(0, 3).map((event) => (
                          <div key={event.id} className={cn('text-[9px] px-1 py-0.5 rounded truncate flex items-center gap-0.5', event.color)}>
                            {event.icon}
                            <span className="truncate">{event.title}</span>
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <span className="text-[9px] text-muted-foreground pl-1">+{dayEvents.length - 3} more</span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {!isMobile && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">
                {selectedDate ? format(selectedDate, 'EEEE, MMM d') : 'Select a date'}
              </h3>
              <AnimatePresence mode="wait">
                {selectedEvents.length > 0 ? (
                  <motion.div key={selectedDate?.toISOString()} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                    {selectedEvents.map((event) => (
                      <div key={event.id} className={cn('p-2.5 rounded-lg border border-border flex items-start gap-2')}>
                        <Badge className={cn('text-[10px] mt-0.5 shrink-0', event.color)}>{event.type}</Badge>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{event.title}</p>
                          {event.meta && <p className="text-xs text-muted-foreground">{event.meta}</p>}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-muted-foreground">
                    {selectedDate ? 'No events on this day' : 'Click a day to see details'}
                  </motion.p>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        )}
      </div>

      {isMobile && (
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{selectedDate ? format(selectedDate, 'EEEE, MMM d') : 'Select a date'}</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-6 space-y-2">
              {selectedEvents.length > 0 ? (
                selectedEvents.map((event) => (
                  <div key={event.id} className={cn('p-3 rounded-lg border border-border flex items-start gap-2')}>
                    <Badge className={cn('text-[10px] mt-0.5 shrink-0', event.color)}>{event.type}</Badge>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{event.title}</p>
                      {event.meta && <p className="text-xs text-muted-foreground">{event.meta}</p>}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No events on this day</p>
              )}
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
};

export default Calendar;
