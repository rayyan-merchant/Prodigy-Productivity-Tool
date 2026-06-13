
import React from 'react';
import { motion } from 'framer-motion';

interface TimerCircleProps {
  minutes: number;
  seconds: number;
  progress: number;
  isBreak?: boolean;
  isActive?: boolean;
}

const TimerCircle: React.FC<TimerCircleProps> = ({ minutes, seconds, progress, isBreak = false, isActive = false }) => {
  const radius = 140;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress * circumference);

  return (
    <div className="relative flex items-center justify-center mb-10">
      {/* Breathing glow animation */}
      {isActive && (
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 340,
            height: 340,
            background: isBreak
              ? 'radial-gradient(circle, hsl(var(--accent) / 0.12), hsl(var(--accent) / 0.04) 50%, transparent 70%)'
              : 'radial-gradient(circle, hsl(var(--primary) / 0.12), hsl(var(--primary) / 0.04) 50%, transparent 70%)',
          }}
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Secondary breathing ring */}
      {isActive && (
        <motion.div
          className="absolute rounded-full border"
          style={{
            width: 330,
            height: 330,
            borderColor: isBreak ? 'hsl(var(--accent) / 0.08)' : 'hsl(var(--primary) / 0.08)',
          }}
          animate={{
            scale: [1, 1.04, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.5,
          }}
        />
      )}

      <svg width="320" height="320" viewBox="0 0 320 320" className="transform -rotate-90">
        {/* Background track */}
        <circle
          cx="160"
          cy="160"
          r={radius}
          strokeWidth="6"
          stroke="hsl(var(--muted))"
          fill="none"
          className="opacity-50"
        />
        {/* Progress arc */}
        <motion.circle
          cx="160"
          cy="160"
          r={radius}
          strokeWidth="6"
          stroke={isBreak ? 'hsl(var(--accent))' : 'hsl(var(--primary))'}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          initial={false}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: 'linear' }}
        />
        {/* Dot at progress tip */}
        {progress > 0 && (
          <motion.circle
            cx={160 + radius * Math.cos(2 * Math.PI * progress - Math.PI / 2)}
            cy={160 + radius * Math.sin(2 * Math.PI * progress - Math.PI / 2)}
            r="8"
            fill={isBreak ? 'hsl(var(--accent))' : 'hsl(var(--primary))'}
            className="drop-shadow-lg"
            animate={{
              r: isActive ? [8, 10, 8] : 8,
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </svg>

      {/* Timer display with breathing scale */}
      <motion.div
        className="absolute flex flex-col items-center"
        animate={isActive ? {
          scale: [1, 1.02, 1],
        } : { scale: 1 }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <span className="text-6xl font-bold tracking-tight text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </span>
        <span className="text-sm text-muted-foreground mt-2 uppercase tracking-widest font-medium">
          {isBreak ? 'Break' : 'Focus'}
        </span>
      </motion.div>
    </div>
  );
};

export default TimerCircle;
