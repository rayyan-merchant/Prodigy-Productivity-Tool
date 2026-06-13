import React from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  illustration?: 'tasks' | 'habits' | 'analytics' | 'generic';
}

const illustrations: Record<string, React.FC<{ className?: string }>> = {
  tasks: ({ className }) => (
    <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="30" y="20" width="140" height="30" rx="8" className="fill-muted" />
      <rect x="38" y="30" width="12" height="12" rx="3" className="fill-brand/30" />
      <rect x="58" y="32" width="60" height="6" rx="3" className="fill-muted-foreground/20" />
      <rect x="30" y="60" width="140" height="30" rx="8" className="fill-muted" />
      <rect x="38" y="70" width="12" height="12" rx="3" className="fill-accent/30" />
      <rect x="58" y="72" width="80" height="6" rx="3" className="fill-muted-foreground/20" />
      <rect x="30" y="100" width="140" height="30" rx="8" className="fill-muted/60" opacity="0.5" />
      <rect x="38" y="110" width="12" height="12" rx="3" className="fill-primary/20" />
      <rect x="58" y="112" width="50" height="6" rx="3" className="fill-muted-foreground/10" />
      <circle cx="160" cy="35" r="6" className="fill-brand/40" />
      <path d="M157 35l2 2 4-4" stroke="hsl(var(--brand-foreground))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="stroke-brand" />
    </svg>
  ),
  habits: ({ className }) => (
    <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="110" width="22" height="30" rx="4" className="fill-muted-foreground/15" />
      <rect x="48" y="90" width="22" height="50" rx="4" className="fill-muted-foreground/20" />
      <rect x="76" y="70" width="22" height="70" rx="4" className="fill-primary/25" />
      <rect x="104" y="50" width="22" height="90" rx="4" className="fill-primary/35" />
      <rect x="132" y="60" width="22" height="80" rx="4" className="fill-accent/30" />
      <rect x="160" y="30" width="22" height="110" rx="4" className="fill-brand/40" />
      <path d="M31 105 L59 85 L87 65 L115 45 L143 55 L171 25" className="stroke-brand" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 4" fill="none" />
    </svg>
  ),
  analytics: ({ className }) => (
    <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="80" r="50" className="fill-muted" />
      <path d="M100 30 A50 50 0 0 1 143 110 L100 80Z" className="fill-brand/40" />
      <path d="M143 110 A50 50 0 0 1 57 110 L100 80Z" className="fill-primary/30" />
      <path d="M57 110 A50 50 0 0 1 100 30 L100 80Z" className="fill-accent/30" />
    </svg>
  ),
  generic: ({ className }) => (
    <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="50" y="30" width="100" height="100" rx="16" className="fill-muted" />
      <circle cx="100" cy="70" r="20" className="fill-brand/20" />
      <rect x="70" y="100" width="60" height="6" rx="3" className="fill-muted-foreground/15" />
      <rect x="80" y="112" width="40" height="5" rx="2.5" className="fill-muted-foreground/10" />
    </svg>
  ),
};

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  illustration = 'generic'
}) => {
  const Illustration = illustrations[illustration] || illustrations.generic;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center p-8 text-center"
    >
      <Illustration className="w-48 h-36 mb-6" />
      
      {icon && (
        <div className="rounded-full bg-muted p-3 mb-3">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-display font-semibold mb-1 text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mb-5 max-w-xs leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="bg-brand text-white hover:bg-brand/90">
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
};

export default EmptyState;
