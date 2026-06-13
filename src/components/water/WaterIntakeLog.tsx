import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Droplets } from 'lucide-react';
import { WaterIntake } from '@/services/waterService';
import { format } from 'date-fns';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface WaterIntakeLogProps {
  entries: WaterIntake[];
  onDelete: (id: string) => void;
}

const WaterIntakeLog: React.FC<WaterIntakeLogProps> = ({ entries, onDelete }) => {
  if (entries.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-8 text-center">
          <Droplets className="w-10 h-10 mx-auto mb-2 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No water logged today yet</p>
          <p className="text-xs text-muted-foreground mt-1">Use the buttons above to start tracking</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-foreground">Today's Log</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 max-h-48 overflow-y-auto">
        {entries.map(entry => (
          <div key={entry.id} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/50 group transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'hsl(200 85% 55% / 0.15)' }}>
                <Droplets className="w-4 h-4" style={{ color: 'hsl(200 85% 55%)' }} />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{entry.amount_ml}ml</p>
                <p className="text-xs text-muted-foreground">{format(new Date(entry.logged_at), 'h:mm a')}</p>
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" aria-label={`Delete ${entry.amount_ml} ml entry`}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this water entry?</AlertDialogTitle>
                  <AlertDialogDescription>This removes {entry.amount_ml} ml from today's total.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(entry.id)}>Delete entry</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default WaterIntakeLog;
