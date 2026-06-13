
import React, { useState, useEffect } from 'react';
import { GripVertical, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, Reorder } from 'framer-motion';

export interface DashboardWidget {
  id: string;
  label: string;
  visible: boolean;
}

const DEFAULT_WIDGETS: DashboardWidget[] = [
  { id: 'stats', label: 'Statistics', visible: true },
  { id: 'timer', label: 'Compact Timer', visible: true },
  { id: 'tasks', label: 'Recent Tasks', visible: true },
  { id: 'quickActions', label: 'Quick Actions', visible: true },
  { id: 'calendar', label: 'Calendar', visible: true },
  { id: 'habits', label: 'Habit Streaks', visible: true },
  { id: 'activity', label: 'Recent Activity', visible: true },
];

const STORAGE_KEY = 'dashboard-widget-layout';

export function loadWidgetLayout(): DashboardWidget[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as DashboardWidget[];
      const ids = new Set(parsed.map(w => w.id));
      const merged = [...parsed];
      DEFAULT_WIDGETS.forEach(dw => {
        if (!ids.has(dw.id)) merged.push(dw);
      });
      return merged;
    }
  } catch (error) {
    console.warn('Ignoring invalid saved widget layout', error);
  }
  return DEFAULT_WIDGETS;
}

export function saveWidgetLayout(widgets: DashboardWidget[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
}

interface WidgetCustomizerProps {
  widgets: DashboardWidget[];
  onWidgetsChange: (widgets: DashboardWidget[]) => void;
  isOpen: boolean;
  onClose: () => void;
}

const WidgetCustomizer: React.FC<WidgetCustomizerProps> = ({
  widgets,
  onWidgetsChange,
  isOpen,
  onClose,
}) => {
  const [localWidgets, setLocalWidgets] = useState(widgets);

  useEffect(() => {
    setLocalWidgets(widgets);
  }, [widgets]);

  const toggleVisibility = (id: string) => {
    setLocalWidgets(prev =>
      prev.map(w => (w.id === id ? { ...w, visible: !w.visible } : w))
    );
  };

  const handleSave = () => {
    onWidgetsChange(localWidgets);
    saveWidgetLayout(localWidgets);
    onClose();
  };

  const handleReset = () => {
    setLocalWidgets(DEFAULT_WIDGETS);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-card border border-border rounded-xl p-4 shadow-lg mb-4"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">Customize Dashboard</h3>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleReset} className="h-7 text-xs gap-1">
            <RotateCcw size={12} /> Reset
          </Button>
          <Button size="sm" onClick={handleSave} className="h-7 text-xs">
            Save Layout
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-3">Drag to reorder, toggle visibility</p>
      <Reorder.Group
        axis="y"
        values={localWidgets}
        onReorder={setLocalWidgets}
        className="space-y-1.5"
      >
        {localWidgets.map((widget) => (
          <Reorder.Item
            key={widget.id}
            value={widget}
            className={cn(
              'flex items-center gap-2 p-2 rounded-lg border border-border bg-background cursor-grab active:cursor-grabbing transition-colors',
              !widget.visible && 'opacity-50'
            )}
          >
            <GripVertical size={14} className="text-muted-foreground shrink-0" />
            <span className="text-sm flex-1">{widget.label}</span>
            <button
              onClick={() => toggleVisibility(widget.id)}
              className="p-1 rounded hover:bg-muted transition-colors"
            >
              {widget.visible ? (
                <Eye size={14} className="text-foreground" />
              ) : (
                <EyeOff size={14} className="text-muted-foreground" />
              )}
            </button>
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </motion.div>
  );
};

export default WidgetCustomizer;
