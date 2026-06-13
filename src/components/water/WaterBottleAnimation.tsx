import React from 'react';
import { motion } from 'framer-motion';

interface WaterBottleAnimationProps {
  consumed: number;
  goal: number;
}

const WaterBottleAnimation: React.FC<WaterBottleAnimationProps> = ({ consumed, goal }) => {
  const fillPercent = Math.min(consumed / goal, 1);
  const fillHeight = fillPercent * 160; // max fill area height
  const displayL = (consumed / 1000).toFixed(1);
  const goalL = (goal / 1000).toFixed(1);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-24 h-56">
        <svg viewBox="0 0 80 200" className="w-full h-full" fill="none">
          {/* Bottle outline */}
          {/* Cap */}
          <rect x="28" y="4" width="24" height="12" rx="3" fill="hsl(var(--muted-foreground))" opacity="0.4" />
          {/* Neck */}
          <path
            d="M30 16 L30 36 Q16 44 16 56 L16 180 Q16 192 28 192 L52 192 Q64 192 64 180 L64 56 Q64 44 50 36 L50 16"
            stroke="hsl(var(--border))"
            strokeWidth="2.5"
            fill="hsl(var(--card))"
          />
          {/* Water fill - clipped to bottle body */}
          <defs>
            <clipPath id="bottleClip">
              <path d="M30 16 L30 36 Q16 44 16 56 L16 180 Q16 192 28 192 L52 192 Q64 192 64 180 L64 56 Q64 44 50 36 L50 16 Z" />
            </clipPath>
          </defs>
          
          {/* Animated water fill */}
          <motion.rect
            clipPath="url(#bottleClip)"
            x="14"
            width="52"
            rx="0"
            fill="hsl(200 85% 55% / 0.6)"
            initial={{ y: 192, height: 0 }}
            animate={{
              y: 192 - fillHeight,
              height: fillHeight,
            }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />

          {/* Water surface wave */}
          {fillPercent > 0 && (
            <motion.path
              clipPath="url(#bottleClip)"
              d={`M14 ${192 - fillHeight} Q30 ${192 - fillHeight - 4} 40 ${192 - fillHeight} Q50 ${192 - fillHeight + 4} 66 ${192 - fillHeight}`}
              stroke="hsl(200 85% 65% / 0.5)"
              strokeWidth="2"
              fill="none"
              animate={{
                d: [
                  `M14 ${192 - fillHeight} Q30 ${192 - fillHeight - 4} 40 ${192 - fillHeight} Q50 ${192 - fillHeight + 4} 66 ${192 - fillHeight}`,
                  `M14 ${192 - fillHeight} Q30 ${192 - fillHeight + 3} 40 ${192 - fillHeight} Q50 ${192 - fillHeight - 3} 66 ${192 - fillHeight}`,
                  `M14 ${192 - fillHeight} Q30 ${192 - fillHeight - 4} 40 ${192 - fillHeight} Q50 ${192 - fillHeight + 4} 66 ${192 - fillHeight}`,
                ],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}

          {/* Percentage markers */}
          {[0.25, 0.5, 0.75].map(mark => (
            <g key={mark}>
              <line
                x1="16"
                y1={192 - mark * 160}
                x2="22"
                y2={192 - mark * 160}
                stroke="hsl(var(--muted-foreground))"
                strokeWidth="1"
                opacity="0.3"
              />
            </g>
          ))}
        </svg>
        
        {/* Bubbles when filling */}
        {fillPercent > 0 && fillPercent < 1 && (
          <>
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: 4 + i * 2,
                  height: 4 + i * 2,
                  left: 32 + i * 10,
                  background: 'hsl(200 85% 70% / 0.4)',
                }}
                animate={{
                  y: [0, -20 - i * 10, -40],
                  opacity: [0.6, 0.3, 0],
                }}
                transition={{
                  duration: 2 + i * 0.5,
                  repeat: Infinity,
                  delay: i * 0.8,
                  ease: 'easeOut',
                }}
                initial={{
                  bottom: `${(fillPercent * 72) + 12}%`,
                }}
              />
            ))}
          </>
        )}
      </div>
      <div className="text-center">
        <p className="text-lg font-bold text-foreground">{displayL}L</p>
        <p className="text-xs text-muted-foreground">of {goalL}L</p>
      </div>
    </div>
  );
};

export default WaterBottleAnimation;
