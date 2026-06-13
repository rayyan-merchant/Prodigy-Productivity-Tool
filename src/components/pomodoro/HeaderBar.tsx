
import React from 'react';
import { Timer, ArrowLeft, Sun, Moon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useTheme } from '@/hooks/useTheme';
import { motion } from 'framer-motion';

const HeaderBar: React.FC = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center justify-between mb-8 relative z-10">
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-muted-foreground hover:text-foreground gap-2"
        onClick={() => navigate('/dashboard')}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Timer className="h-4 w-4 text-primary" />
        </div>
        <h1 className="text-lg font-bold tracking-tight text-foreground">
          Pomodoro
        </h1>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      >
        <motion.div
          key={theme}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </motion.div>
      </Button>
    </div>
  );
};

export default HeaderBar;
