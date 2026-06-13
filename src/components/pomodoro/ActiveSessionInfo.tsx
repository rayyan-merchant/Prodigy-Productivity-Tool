
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Target, FileText } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

interface ActiveSessionInfoProps {
  focusLabel: string;
  taskTitle?: string | null;
  quickNote: string;
  setQuickNote: (note: string) => void;
}

const ActiveSessionInfo: React.FC<ActiveSessionInfoProps> = ({
  focusLabel,
  taskTitle,
  quickNote,
  setQuickNote
}) => {
  return (
    <>
      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground text-sm">Current Focus</h3>
          </div>
          <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Focus type</p>
              <p className="text-sm font-medium text-foreground mt-1">{focusLabel || 'General focus'}</p>
            </div>
            {taskTitle && (
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                  Task linked
                </Badge>
                <span className="text-sm text-foreground">{taskTitle}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground text-sm">Session Notes</h3>
          </div>
          <Textarea
            placeholder="Take notes during your focus session..."
            value={quickNote}
            onChange={(e) => setQuickNote(e.target.value)}
            className="min-h-[140px] bg-muted border-border text-foreground placeholder:text-muted-foreground resize-none"
          />
          <p className="text-xs mt-2 text-muted-foreground">
            Saved automatically when you complete your session.
          </p>
        </CardContent>
      </Card>
    </>
  );
};

export default ActiveSessionInfo;
