
import React from 'react';
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
  accentColor?: string;
  gradient?: string;
  changePercent?: number;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  description,
  icon,
  className,
  accentColor,
  gradient,
  changePercent
}) => {
  const isPositive = changePercent !== undefined && changePercent > 0;
  const isNegative = changePercent !== undefined && changePercent < 0;

  return (
    <div className={cn(
      "group relative rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-4 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 overflow-hidden",
      className
    )}>
      {/* Subtle gradient overlay */}
      {gradient && (
        <div className={cn("absolute inset-0 bg-gradient-to-br opacity-40 transition-opacity group-hover:opacity-60", gradient)} />
      )}

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</span>
          {icon && (
            <div className={cn(
              "w-9 h-9 flex items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110",
              accentColor ? `${accentColor}/10` : "bg-primary/10",
              accentColor ? accentColor.replace('bg-', 'text-') : "text-primary"
            )}>
              {icon}
            </div>
          )}
        </div>

        <div className="text-3xl font-bold text-foreground tracking-tight">{value}</div>

        {changePercent !== undefined && (
          <div className={cn(
            "flex items-center gap-1 mt-2 text-xs font-medium",
            isPositive && "text-green-600 dark:text-green-400",
            isNegative && "text-red-500 dark:text-red-400",
            !isPositive && !isNegative && "text-muted-foreground"
          )}>
            {isPositive ? <TrendingUp size={12} /> : isNegative ? <TrendingDown size={12} /> : <Minus size={12} />}
            {Math.abs(changePercent ?? 0)}% vs last period
          </div>
        )}

        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
