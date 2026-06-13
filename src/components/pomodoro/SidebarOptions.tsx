
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  StickyNote, 
  Settings, 
  History
} from "lucide-react";

interface SidebarOptionsProps {
  onNoteNavigation: (noteType: string) => void;
  onFocusTypeChange: (type: string) => void;
  onSettingsOpen: () => void;
  customFocus: string;
  setCustomFocus: (focus: string) => void;
  showCustomInput: boolean;
  onHistoryOpen?: () => void;
}

const SidebarOptions: React.FC<SidebarOptionsProps> = ({
  onNoteNavigation,
  onFocusTypeChange,
  onSettingsOpen,
  customFocus,
  setCustomFocus,
  showCustomInput,
  onHistoryOpen
}) => {
  const focusOptions = ['General', 'Work', 'Study', 'Creative', 'Custom'];

  return (
    <div className="space-y-4">
      {/* Focus Type */}
      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-4">
          <h3 className="font-semibold text-foreground text-sm mb-3">Focus Type</h3>
          <div className="space-y-1">
            {focusOptions.map((option) => (
              <button
                key={option}
                onClick={() => onFocusTypeChange(option)}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition text-sm text-foreground"
              >
                {option}
              </button>
            ))}
            {showCustomInput && (
              <Input
                placeholder="Enter custom focus..."
                value={customFocus}
                onChange={(e) => setCustomFocus(e.target.value)}
                className="mt-2"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-4">
          <h3 className="font-semibold text-foreground text-sm mb-3">Quick Actions</h3>
          <div className="space-y-1">
            <Button variant="ghost" size="sm" className="w-full justify-start text-foreground hover:bg-muted" onClick={() => onNoteNavigation('Quick Note')}>
              <StickyNote size={16} className="mr-2 text-primary" /> Focus Notes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Session History */}
      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-4">
          <Button variant="ghost" size="sm" className="w-full justify-start text-foreground hover:bg-muted" onClick={onHistoryOpen}>
            <History size={16} className="mr-2 text-primary" /> Session History
          </Button>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-4">
          <Button variant="ghost" size="sm" className="w-full justify-start text-foreground hover:bg-muted" onClick={onSettingsOpen}>
            <Settings size={16} className="mr-2 text-muted-foreground" /> Timer Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SidebarOptions;
