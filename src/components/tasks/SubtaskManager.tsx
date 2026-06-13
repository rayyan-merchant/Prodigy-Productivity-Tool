
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

interface SubtaskManagerProps {
  subtasks: Subtask[];
  onChange: (subtasks: Subtask[]) => void;
  readonly?: boolean;
}

const SubtaskManager: React.FC<SubtaskManagerProps> = ({ subtasks, onChange, readonly = false }) => {
  const [newSubtask, setNewSubtask] = useState('');

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    const newItem: Subtask = {
      id: Date.now().toString(),
      title: newSubtask.trim(),
      completed: false,
    };
    onChange([...subtasks, newItem]);
    setNewSubtask('');
  };

  const toggleSubtask = (id: string) => {
    onChange(subtasks.map(st => st.id === id ? { ...st, completed: !st.completed } : st));
  };

  const removeSubtask = (id: string) => {
    onChange(subtasks.filter(st => st.id !== id));
  };

  const completedCount = subtasks.filter(s => s.completed).length;
  const progress = subtasks.length > 0 ? (completedCount / subtasks.length) * 100 : 0;

  return (
    <div className="space-y-2">
      {subtasks.length > 0 && (
        <div className="flex items-center gap-2 mb-1">
          <Progress value={progress} className="h-1.5 flex-1" />
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
            {completedCount}/{subtasks.length}
          </span>
        </div>
      )}
      
      <div className="space-y-1">
        {subtasks.map((subtask) => (
          <div
            key={subtask.id}
            className={cn(
              'flex items-center gap-2 p-1.5 rounded-md group transition-colors',
              subtask.completed ? 'opacity-60' : 'hover:bg-muted/50'
            )}
          >
            <Checkbox
              checked={subtask.completed}
              onCheckedChange={() => toggleSubtask(subtask.id)}
              disabled={readonly}
              className="h-3.5 w-3.5"
            />
            <span className={cn(
              'text-sm flex-1',
              subtask.completed && 'line-through text-muted-foreground'
            )}>
              {subtask.title}
            </span>
            {!readonly && (
              <button
                onClick={() => removeSubtask(subtask.id)}
                className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive transition-opacity"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        ))}
      </div>

      {!readonly && (
        <div className="flex gap-1.5">
          <Input
            value={newSubtask}
            onChange={(e) => setNewSubtask(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
            placeholder="Add a subtask..."
            className="h-8 text-sm"
          />
          <Button size="sm" variant="outline" onClick={addSubtask} className="h-8 px-2" disabled={!newSubtask.trim()}>
            <Plus size={14} />
          </Button>
        </div>
      )}
    </div>
  );
};

export default SubtaskManager;

// Compact display for card view
export const SubtaskProgress: React.FC<{ subtasks: Subtask[] }> = ({ subtasks }) => {
  if (!subtasks || subtasks.length === 0) return null;
  const done = subtasks.filter(s => s.completed).length;
  const pct = (done / subtasks.length) * 100;
  return (
    <div className="flex items-center gap-2 mt-1">
      <Progress value={pct} className="h-1 flex-1" />
      <span className="text-[10px] text-muted-foreground">{done}/{subtasks.length}</span>
    </div>
  );
};
