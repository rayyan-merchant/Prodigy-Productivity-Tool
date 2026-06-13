import React from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: {
    'en-US': enUS,
  },
});

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type?: 'task' | 'pomodoro' | 'break' | 'other';
}

interface WeekCalendarViewProps {
  events: CalendarEvent[];
  currentDate: Date;
  onNavigate: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
}

const WeekCalendarView: React.FC<WeekCalendarViewProps> = ({
  events,
  currentDate,
  onNavigate,
  onEventClick,
}) => {
  const eventStyleGetter = (event: CalendarEvent) => {
    const style = {
      backgroundColor: 'hsl(var(--primary))',
      borderRadius: '4px',
      opacity: 0.8,
      color: 'white',
      border: '0px',
      display: 'block',
    };

    switch (event.type) {
      case 'pomodoro':
        style.backgroundColor = 'hsl(215 100% 50%)'; // Blue
        break;
      case 'break':
        style.backgroundColor = 'hsl(142 76% 36%)'; // Green
        break;
      case 'task':
        style.backgroundColor = 'hsl(262 83% 58%)'; // Purple
        break;
      default:
        style.backgroundColor = 'hsl(var(--primary))';
    }

    return { style };
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setDate(currentDate.getDate() - 7);
    } else {
      newDate.setDate(currentDate.getDate() + 7);
    }
    onNavigate(newDate);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Week View
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {format(currentDate, 'MMM d, yyyy')}
            </Badge>
            
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNavigate('prev')}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNavigate('next')}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="h-96 w-full">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            view="week"
            views={['week']}
            date={currentDate}
            onNavigate={onNavigate}
            onSelectEvent={onEventClick}
            eventPropGetter={eventStyleGetter}
            toolbar={false}
            formats={{
              timeGutterFormat: 'HH:mm',
              eventTimeRangeFormat: ({ start, end }) =>
                `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`,
            }}
            min={new Date(2024, 0, 1, 6, 0, 0)}
            max={new Date(2024, 0, 1, 23, 0, 0)}
          />
        </div>
        
        <div className="flex items-center justify-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-blue-500" />
            <span>Pomodoro</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-600" />
            <span>Break</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-purple-500" />
            <span>Task</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{backgroundColor: 'hsl(var(--primary))'}} />
            <span>Other</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeekCalendarView;
