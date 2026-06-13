import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import SidebarOptions from './SidebarOptions';

interface MobilePomodoroSheetProps {
  onNoteNavigation: (noteType: string) => void;
  onFocusTypeChange: (type: string) => void;
  onSettingsOpen: () => void;
  customFocus: string;
  setCustomFocus: (focus: string) => void;
  showCustomInput: boolean;
  onHistoryOpen: () => void;
  children?: React.ReactNode;
}

const MobilePomodoroSheet: React.FC<MobilePomodoroSheetProps> = ({
  onNoteNavigation,
  onFocusTypeChange,
  onSettingsOpen,
  customFocus,
  setCustomFocus,
  showCustomInput,
  onHistoryOpen,
  children
}) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        {children || (
          <Button 
            variant="outline" 
            className="border-border text-foreground hover:bg-muted"
          >
            <Settings size={16} className="mr-2" />
            Options
          </Button>
        )}
      </SheetTrigger>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] bg-card text-card-foreground border-border rounded-t-2xl"
      >
        <SheetHeader className="pb-4">
          <SheetTitle className="text-foreground">Pomodoro Options</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-6 overflow-y-auto flex-1">
          <SidebarOptions 
            onNoteNavigation={onNoteNavigation}
            onFocusTypeChange={onFocusTypeChange}
            onSettingsOpen={onSettingsOpen}
            customFocus={customFocus}
            setCustomFocus={setCustomFocus}
            showCustomInput={showCustomInput}
            onHistoryOpen={onHistoryOpen}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobilePomodoroSheet;
