
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileJson, FileSpreadsheet, Loader2, CheckSquare, Flame } from 'lucide-react';
import { toast } from 'sonner';
import { getTasks } from '@/services/taskService';
import { getHabits } from '@/services/habitService';
import { exportTasksCSV, exportHabitsCSV, exportAllJSON } from '@/utils/exportData';
import { cn } from '@/lib/utils';

interface DataExportProps {
  isOpen: boolean;
  onClose: () => void;
}

const exportOptions = [
  { id: 'tasks', label: 'Tasks', icon: CheckSquare, color: 'text-primary' },
  { id: 'habits', label: 'Habits', icon: Flame, color: 'text-orange-500' },
] as const;

const DataExport: React.FC<DataExportProps> = ({ isOpen, onClose }) => {
  const [selected, setSelected] = useState<Set<string>>(new Set(['tasks', 'habits']));
  const [isExporting, setIsExporting] = useState(false);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const handleExport = async (format: 'csv' | 'json') => {
    if (selected.size === 0) {
      toast.error('Select at least one data type');
      return;
    }

    setIsExporting(true);
    try {
      const tasks = selected.has('tasks') ? await getTasks() : [];
      const habits = selected.has('habits') ? await getHabits() : [];

      if (format === 'json') {
        exportAllJSON({ tasks, habits });
        toast.success('Data exported as JSON');
      } else {
        if (selected.has('tasks')) exportTasksCSV(tasks);
        if (selected.has('habits')) exportHabitsCSV(habits);
        toast.success('Data exported as CSV');
      }
      onClose();
    } catch (error) {
      toast.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download size={18} />
            Export Data
          </DialogTitle>
          <DialogDescription>
            Select what to export and choose a format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-2">
            {exportOptions.map((opt) => {
              const isSelected = selected.has(opt.id);
              return (
                <button
                  key={opt.id}
                  onClick={() => toggle(opt.id)}
                  className={cn(
                    'flex items-center gap-2.5 p-3 rounded-lg border transition-all text-left',
                    isSelected
                      ? 'border-brand bg-brand/5 ring-1 ring-brand/20'
                      : 'border-border hover:border-brand/30'
                  )}
                >
                  <opt.icon size={16} className={opt.color} />
                  <span className="text-sm font-medium">{opt.label}</span>
                  {isSelected && <Badge className="ml-auto bg-brand/10 text-brand text-[10px]">Selected</Badge>}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2">
            <Button className="flex-1 gap-2" onClick={() => handleExport('csv')} disabled={isExporting}>
              {isExporting ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
              Export CSV
            </Button>
            <Button variant="outline" className="flex-1 gap-2" onClick={() => handleExport('json')} disabled={isExporting}>
              {isExporting ? <Loader2 size={14} className="animate-spin" /> : <FileJson size={14} />}
              Export JSON
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DataExport;
