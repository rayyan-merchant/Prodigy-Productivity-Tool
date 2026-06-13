
import React, { useState } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { CalendarDays, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const CalendarWidget: React.FC = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const navigate = useNavigate();

  return (
    <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <CalendarDays size={16} className="text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Calendar</h3>
            <p className="text-[11px] text-muted-foreground">
              {date ? format(date, 'EEEE, MMM d') : 'Select a date'}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2.5 text-xs text-muted-foreground hover:text-primary gap-1 rounded-lg"
          onClick={() => navigate('/calendar')}
        >
          View all
          <ArrowRight size={12} />
        </Button>
      </div>

      {/* Calendar */}
      <div className="px-3 pb-4 flex justify-center">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-xl !bg-transparent"
          classNames={{
            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
            month: "space-y-3",
            caption: "flex justify-center pt-1 relative items-center text-sm font-medium",
            caption_label: "text-sm font-semibold text-foreground",
            nav: "space-x-1 flex items-center",
            nav_button: "h-7 w-7 bg-transparent p-0 opacity-60 hover:opacity-100 rounded-lg hover:bg-muted transition-colors",
            table: "w-full border-collapse space-y-1",
            head_row: "flex",
            head_cell: "text-muted-foreground rounded-md w-8 font-medium text-[0.7rem]",
            row: "flex w-full mt-1",
            cell: "h-8 w-8 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
            day: "h-8 w-8 p-0 font-normal rounded-lg hover:bg-muted transition-colors text-foreground text-xs",
            day_range_end: "day-range-end",
            day_selected: "bg-primary text-white hover:bg-primary hover:text-white font-semibold shadow-sm",
            day_today: "bg-muted text-foreground font-semibold",
            day_outside: "text-muted-foreground/40",
            day_disabled: "text-muted-foreground/30",
            day_hidden: "invisible",
          }}
        />
      </div>
    </div>
  );
};

export default CalendarWidget;
