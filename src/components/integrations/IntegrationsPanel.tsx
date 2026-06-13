
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Download } from 'lucide-react';
import { toast } from 'sonner';
import { getTasks } from '@/services/taskService';
import { format } from 'date-fns';
import { tasksToIcs } from '@/lib/calendarExport';

const IntegrationsPanel: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);

  const exportToCalendar = async () => {
    setIsExporting(true);
    try {
      const tasks = await getTasks();

      const exportableTasks = tasks.filter((task) => task.dueDate);
      if (exportableTasks.length === 0) {
        toast.info('Add a due date to at least one task before exporting a calendar.');
        return;
      }
      const icsContent = tasksToIcs(exportableTasks);

      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prodigy-calendar-${format(new Date(), 'yyyy-MM-dd')}.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Calendar exported! Import the .ics file into Google Calendar.');
    } catch (e) {
      console.error('Export error:', e);
      toast.error('Failed to export calendar');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Calendar Export</h3>
        <p className="text-sm text-muted-foreground">Download an interoperable calendar file for your dated tasks.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Calendar size={20} className="text-primary" />
              <CardTitle className="text-base">Calendar file</CardTitle>
              <Badge variant="secondary" className="text-xs">Export</Badge>
            </div>
            <CardDescription className="text-xs">
              Export tasks as an .ics file for Google Calendar, Apple Calendar, or Outlook.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={exportToCalendar} disabled={isExporting} className="w-full gap-2">
              <Download size={16} />
              {isExporting ? 'Exporting...' : 'Export Calendar (.ics)'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default IntegrationsPanel;
