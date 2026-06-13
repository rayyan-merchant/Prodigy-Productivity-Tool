import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Trash2, X, Archive } from 'lucide-react';
import { Task } from "@/types/tasks";

interface BulkActionsBarProps {
  selectedTasks: string[];
  onMarkComplete: () => void;
  onDelete: () => void;
  onClearSelection: () => void;
}

const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedTasks,
  onMarkComplete,
  onDelete,
  onClearSelection,
}) => {
  if (selectedTasks.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg px-4 py-3 flex items-center gap-3">
        <Badge variant="secondary" className="bg-primary/10 text-primary">
          {selectedTasks.length} selected
        </Badge>
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onMarkComplete}
            className="h-8 gap-1.5"
          >
            <CheckCircle className="h-3.5 w-3.5" />
            Complete
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={onDelete}
            className="h-8 gap-1.5 text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={onClearSelection}
            className="h-8 w-8 p-0"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BulkActionsBar;