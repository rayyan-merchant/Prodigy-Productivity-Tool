
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, icon, color }) => {
  return (
    <Card className="overflow-hidden relative">
      <div className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-lg", 
        color === "text-brand" ? "bg-brand" : "bg-primary"
      )} />
      <CardContent className="flex flex-col p-6">
        <div className="flex items-center gap-2">
          <div className={cn("shrink-0", color)}>{icon}</div>
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
        </div>
        <div className="mt-2">
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SummaryCard;
