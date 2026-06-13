
import React from 'react';
import StatsCard from "@/components/StatsCard";

interface DashboardStatsProps {
  stats: Array<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    accent?: string;
    gradient?: string;
    changePercent?: number;
  }>;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <StatsCard
          key={stat.title}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          accentColor={stat.accent}
          gradient={stat.gradient}
          changePercent={stat.changePercent}
        />
      ))}
    </div>
  );
};

export default DashboardStats;
