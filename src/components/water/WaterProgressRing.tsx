import React from 'react';
import { motion } from 'framer-motion';
import { Droplets } from 'lucide-react';

interface WaterProgressRingProps {
  consumed: number;
  goal: number;
}

const WaterProgressRing: React.FC<WaterProgressRingProps> = ({ consumed, goal }) => {
  const progress = Math.min(consumed / goal, 1);
  const percentage = Math.round(progress * 100);
  const radius = 110;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const remaining = Math.max(goal - consumed, 0);
  const overGoal = Math.max(consumed - goal, 0);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-64 h-64">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 256 256">
          {/* Background ring */}
          <circle
            cx="128"
            cy="128"
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
          />
          {/* Progress ring */}
          <motion.circle
            cx="128"
            cy="128"
            r={radius}
            fill="none"
            stroke="hsl(200 85% 55%)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress * circumference }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Droplets className="w-8 h-8 mb-1" style={{ color: 'hsl(200 85% 55%)' }} />
          </motion.div>
          <span className="text-4xl font-bold text-foreground">{percentage}%</span>
          <span className="text-sm text-muted-foreground mt-1">
            {(consumed / 1000).toFixed(1)}L / {(goal / 1000).toFixed(1)}L
          </span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {remaining > 0
            ? `${remaining}ml remaining`
            : overGoal > 0
              ? `Goal reached · ${overGoal} ml over goal`
              : 'Goal reached'}
        </p>
      </div>
    </div>
  );
};

export default WaterProgressRing;
