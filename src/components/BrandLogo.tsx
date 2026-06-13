import React from 'react';
import { cn } from '@/lib/utils';
import logoSrc from '@/assets/c4590b3f-facb-4ff8-ba27-1efd9f7c4e9f.png';
import iconSrc from '@/assets/prodigy_icon.png';

interface BrandLogoProps {
  compact?: boolean;
  className?: string;
}

const BrandLogo: React.FC<BrandLogoProps> = ({ compact = false, className }) => (
  <span className={cn('inline-flex items-center', className)} aria-label="prodigy">
    <img 
      src={compact ? iconSrc : logoSrc} 
      alt={compact ? "Prodigy Icon" : "Prodigy Logo"} 
      className={cn(
        "transition-transform duration-300 ease-in-out",
        compact ? 'h-8 hover:-rotate-12' : 'h-10'
      )} 
    />
  </span>
);

export default BrandLogo;
