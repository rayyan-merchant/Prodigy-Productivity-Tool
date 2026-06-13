import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings2 } from 'lucide-react';

interface WaterSettingsDialogProps {
  goalMl: number;
  reminderInterval: number;
  remindersEnabled: boolean;
  onSave: (settings: { daily_goal_ml: number; reminder_interval_minutes: number; reminders_enabled: boolean }) => void;
}

const WaterSettingsDialog: React.FC<WaterSettingsDialogProps> = ({
  goalMl,
  reminderInterval,
  remindersEnabled,
  onSave,
}) => {
  const [open, setOpen] = useState(false);
  const [goal, setGoal] = useState(goalMl);
  const [interval, setInterval] = useState(reminderInterval);
  const [enabled, setEnabled] = useState(remindersEnabled);

  const handleSave = () => {
    onSave({
      daily_goal_ml: goal,
      reminder_interval_minutes: interval,
      reminders_enabled: enabled,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <Settings2 className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Water Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label className="text-foreground">Daily Goal (ml)</Label>
            <Input
              type="number"
              value={goal}
              onChange={e => setGoal(parseInt(e.target.value) || 2000)}
              min={500}
              max={10000}
              step={250}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">{(goal / 1000).toFixed(1)}L per day</p>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-foreground">Reminders</Label>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
          {enabled && (
            <div>
              <Label className="text-foreground">Reminder Interval (minutes)</Label>
              <Input
                type="number"
                value={interval}
                onChange={e => setInterval(parseInt(e.target.value) || 60)}
                min={15}
                max={240}
                step={15}
                className="mt-1"
              />
            </div>
          )}
          <Button onClick={handleSave} className="w-full">Save Settings</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WaterSettingsDialog;
