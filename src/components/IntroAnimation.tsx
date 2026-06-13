
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Flame, Target, Zap, TrendingUp } from "lucide-react";

interface IntroAnimationProps {
  onComplete: () => void;
}

const IntroAnimation: React.FC<IntroAnimationProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<"enter" | "hold" | "exit">("enter");

  useEffect(() => {
    const holdTimer = setTimeout(() => setPhase("hold"), 1200);
    const exitTimer = setTimeout(() => setPhase("exit"), 2200);
    const completeTimer = setTimeout(() => onComplete(), 2800);

    return () => {
      clearTimeout(holdTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  const iconVariants: Variants = {
    hidden: { scale: 0, rotate: -180, opacity: 0 },
    visible: (i: number) => ({
      scale: 1,
      rotate: 0,
      opacity: 1,
      transition: {
        delay: 0.15 + i * 0.12,
        duration: 0.5,
        type: "spring" as const,
        stiffness: 200,
        damping: 15,
      },
    }),
    exit: (i: number) => ({
      scale: 0,
      opacity: 0,
      y: -20,
      transition: { delay: i * 0.05, duration: 0.3 },
    }),
  };

  const textVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { delay: 0.6, duration: 0.5, ease: "easeOut" as const },
    },
    exit: {
      opacity: 0,
      y: -15,
      transition: { duration: 0.3 },
    },
  };

  const taglineVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { delay: 0.9, duration: 0.4, ease: "easeOut" as const },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.25 },
    },
  };

  const ringVariants: Variants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { delay: 0.1, duration: 0.6, ease: "easeOut" as const },
    },
    exit: {
      scale: 1.2,
      opacity: 0,
      transition: { duration: 0.4 },
    },
  };

  const icons = [
    { Icon: Target, color: "text-primary" },
    { Icon: Zap, color: "text-yellow-500" },
    { Icon: TrendingUp, color: "text-emerald-500" },
    { Icon: Flame, color: "text-brand" },
  ];

  return (
    <AnimatePresence>
      {phase !== "exit" && (
        <motion.div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Animated background rings */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            variants={ringVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="absolute w-64 h-64 rounded-full border border-primary/10" />
            <motion.div
              className="absolute w-48 h-48 rounded-full border border-brand/10"
              animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>

          {/* Icons cluster */}
          <div className="relative flex items-center justify-center gap-4 mb-8">
            {icons.map(({ Icon, color }, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={iconVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className={`p-3 rounded-2xl bg-card border border-border shadow-sm ${color}`}
              >
                <Icon size={28} strokeWidth={2} />
              </motion.div>
            ))}
          </div>

          {/* Brand name */}
          <motion.h1
            className="text-5xl md:text-6xl font-display font-extrabold text-foreground tracking-tight"
            variants={textVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            Prodigy
          </motion.h1>

          {/* Tagline */}
          <motion.p
            className="mt-3 text-lg text-muted-foreground font-medium tracking-wide"
            variants={taglineVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            Master Your Day. Forge Your Future.
          </motion.p>

          {/* Progress bar */}
          <motion.div
            className="mt-10 w-48 h-1 bg-muted rounded-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-primary via-brand to-accent rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ delay: 0.5, duration: 1.8, ease: "easeInOut" }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IntroAnimation;
