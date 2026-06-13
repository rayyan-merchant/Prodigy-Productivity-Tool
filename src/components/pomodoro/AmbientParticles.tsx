import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

const AmbientParticles: React.FC<{ isBreak?: boolean }> = ({ isBreak = false }) => {
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 15 + 10,
      delay: Math.random() * 5,
      opacity: Math.random() * 0.3 + 0.05,
    }));
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Subtle radial gradient overlay */}
      <div 
        className="absolute inset-0"
        style={{
          background: isBreak
            ? 'radial-gradient(ellipse at 30% 20%, hsl(var(--accent) / 0.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, hsl(var(--accent) / 0.04) 0%, transparent 50%)'
            : 'radial-gradient(ellipse at 30% 20%, hsl(var(--primary) / 0.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, hsl(var(--primary) / 0.04) 0%, transparent 50%)',
        }}
      />

      {/* Floating particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: isBreak 
              ? `hsl(var(--accent) / ${p.opacity})` 
              : `hsl(var(--primary) / ${p.opacity})`,
          }}
          animate={{
            y: [0, -30, 0, 20, 0],
            x: [0, 15, -10, 5, 0],
            scale: [1, 1.3, 0.8, 1.1, 1],
            opacity: [p.opacity, p.opacity * 1.5, p.opacity * 0.5, p.opacity * 1.2, p.opacity],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Slow-moving larger orbs */}
      <motion.div
        className="absolute rounded-full blur-3xl"
        style={{
          width: 300,
          height: 300,
          left: '10%',
          top: '20%',
          background: isBreak 
            ? 'hsl(var(--accent) / 0.03)' 
            : 'hsl(var(--primary) / 0.03)',
        }}
        animate={{
          x: [0, 80, -40, 60, 0],
          y: [0, -60, 40, -20, 0],
        }}
        transition={{ duration: 40, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute rounded-full blur-3xl"
        style={{
          width: 250,
          height: 250,
          right: '15%',
          bottom: '25%',
          background: isBreak
            ? 'hsl(var(--accent) / 0.04)'
            : 'hsl(var(--primary) / 0.04)',
        }}
        animate={{
          x: [0, -60, 30, -40, 0],
          y: [0, 50, -30, 20, 0],
        }}
        transition={{ duration: 35, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
};

export default AmbientParticles;
