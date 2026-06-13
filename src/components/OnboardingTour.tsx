import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BarChart2, CheckSquare, ChevronRight, HeartPulse, Timer, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { accountStorageKey } from '@/lib/accountStorage';

const steps = [
  {
    title: 'Welcome to Prodigy',
    description: 'A focused workspace for planning, routines, and deliberate work.',
    icon: BarChart2,
    tip: 'This beta stores your product data in your Supabase-backed account.',
  },
  {
    title: 'Manage Tasks',
    description: 'Create tasks with priorities, date-only deadlines, recurrence, and explicit status controls.',
    icon: CheckSquare,
    tip: 'Completing a recurring task creates exactly one next occurrence.',
  },
  {
    title: 'Focus with Pomodoro',
    description: 'Run focused work intervals and keep completed or interrupted sessions in your history.',
    icon: Timer,
    tip: 'Timer progress is scoped to this account on this device.',
  },
  {
    title: 'Build Routines',
    description: 'Track daily or weekly habits and hydration from history you can inspect and correct.',
    icon: HeartPulse,
    tip: 'AI assistance is optional and never replaces your underlying records.',
  },
] as const;

const OnboardingTour: React.FC = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const storageKey = user ? accountStorageKey(user.id, 'onboarding-complete') : '';

  useEffect(() => {
    if (!storageKey || localStorage.getItem(storageKey)) return;
    const timer = window.setTimeout(() => setIsVisible(true), 600);
    return () => window.clearTimeout(timer);
  }, [storageKey]);

  const finish = () => {
    setIsVisible(false);
    if (storageKey) localStorage.setItem(storageKey, 'true');
  };
  const next = () => currentStep === steps.length - 1 ? finish() : setCurrentStep((step) => step + 1);
  if (!isVisible) return null;

  const step = steps[currentStep];
  const Icon = step.icon;
  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div className="w-full max-w-md overflow-hidden rounded-xl border bg-card shadow-xl" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="relative border-b bg-muted/40 p-7 text-center">
            <button onClick={finish} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground" aria-label="Close onboarding">
              <X className="h-5 w-5" />
            </button>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon /></div>
            <h2 className="text-xl font-semibold">{step.title}</h2>
          </div>
          <div className="space-y-5 p-6">
            <p className="text-center leading-relaxed text-muted-foreground">{step.description}</p>
            <p className="rounded-md bg-muted/50 p-3 text-center text-xs text-muted-foreground">{step.tip}</p>
            <div className="flex justify-center gap-2">
              {steps.map((item, index) => <span key={item.title} className={index === currentStep ? 'h-2 w-6 rounded-full bg-primary' : 'h-2 w-2 rounded-full bg-muted-foreground/30'} />)}
            </div>
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={finish}>Skip</Button>
              <Button size="sm" onClick={next}>{currentStep === steps.length - 1 ? 'Get started' : 'Next'}<ChevronRight className="ml-1 h-4 w-4" /></Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingTour;
