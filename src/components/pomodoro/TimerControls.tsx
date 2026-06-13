
import React from 'react';
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

interface TimerControlsProps {
  isActive: boolean;
  toggleTimer: () => void;
  resetTimer: () => void;
  isWaitingForUser?: boolean;
  isBreak?: boolean;
  isLongBreak?: boolean;
}

const TimerControls: React.FC<TimerControlsProps> = ({ 
  isActive, 
  toggleTimer, 
  resetTimer,
  isWaitingForUser = false,
  isBreak = false,
  isLongBreak = false
}) => {
  const getButtonText = () => {
    if (isWaitingForUser) {
      if (isBreak) {
        return isLongBreak ? 'Start Long Break' : 'Start Short Break';
      }
      return 'Start Focus Session';
    }
    if (isActive) return 'Pause';
    if (isBreak) return isLongBreak ? 'Resume Long Break' : 'Resume Short Break';
    return 'Start Focus';
  };

  return (
    <div className="flex items-center gap-4 mt-2">
      <motion.div whileTap={{ scale: 0.95 }}>
        <Button 
          onClick={toggleTimer} 
          size="lg" 
          className={`px-8 py-6 text-base font-semibold rounded-2xl gap-2 transition-all duration-300 shadow-lg ${
            isWaitingForUser 
              ? 'bg-accent text-accent-foreground hover:bg-accent/90 shadow-accent/25' 
              : isActive 
                ? 'bg-muted text-muted-foreground hover:bg-muted/80' 
                : 'bg-primary text-white hover:bg-primary/90 shadow-primary/25'
          }`}
        >
          {isActive ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          {getButtonText()}
        </Button>
      </motion.div>
      
      {(isActive || isWaitingForUser) && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            onClick={resetTimer} 
            variant="outline" 
            size="lg" 
            className="px-6 py-6 rounded-2xl border-border text-muted-foreground hover:bg-muted"
          >
            <RotateCcw className="h-5 w-5" />
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default TimerControls;
