
import React from 'react';
import { Timer, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';

const CompactTimer = () => {
  const navigate = useNavigate();

  return (
    <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-5 flex items-center justify-between group hover:border-primary/20 transition-all duration-300">
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
          <Timer className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground text-sm">Pomodoro Timer</h3>
          <p className="text-xs text-muted-foreground">Start a focused work session</p>
        </div>
      </div>
      <Button 
        onClick={() => navigate('/pomodoro')} 
        size="sm"
        className="rounded-xl gap-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all duration-200"
        variant="ghost"
      >
        Start
        <ArrowRight size={14} />
      </Button>
    </div>
  );
};

export default CompactTimer;
