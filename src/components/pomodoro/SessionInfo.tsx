
import React from 'react';
import { motion } from 'framer-motion';

interface SessionInfoProps {
  isBreak: boolean;
  isLongBreak?: boolean;
  sessionsCompleted: number;
  longBreakInterval: number;
}

const SessionInfo: React.FC<SessionInfoProps> = ({ 
  isBreak, 
  isLongBreak,
  sessionsCompleted, 
  longBreakInterval 
}) => {
  return (
    <div className="flex flex-col items-center gap-3 mb-6">
      {sessionsCompleted > 0 && (
        <motion.div 
          className="flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="flex gap-1.5">
            {Array.from({ length: Math.min(sessionsCompleted, longBreakInterval) }).map((_, i) => (
              <div 
                key={i} 
                className="w-2.5 h-2.5 rounded-full bg-primary"
              />
            ))}
            {Array.from({ length: Math.max(0, longBreakInterval - sessionsCompleted % longBreakInterval) }).map((_, i) => (
              sessionsCompleted % longBreakInterval !== 0 || sessionsCompleted === 0 ? (
                <div 
                  key={`empty-${i}`} 
                  className="w-2.5 h-2.5 rounded-full bg-muted border border-border"
                />
              ) : null
            ))}
          </div>
          <span className="text-xs text-muted-foreground ml-2">
            {sessionsCompleted} sessions
          </span>
        </motion.div>
      )}
    </div>
  );
};

export default SessionInfo;
