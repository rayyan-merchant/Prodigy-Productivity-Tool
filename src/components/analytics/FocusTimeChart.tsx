
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import NoDataPlaceholder from "@/components/analytics/NoDataPlaceholder";
import LoadingSkeleton from "@/components/LoadingSkeleton";

interface FocusChartData {
  date: string;
  hours: number;
}

interface FocusTimeChartProps {
  isLoading: boolean;
  focusData: FocusChartData[];
  totalFocusTime: number;
}

const FocusTimeChart: React.FC<FocusTimeChartProps> = ({ isLoading, focusData, totalFocusTime }) => {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Focus Time Chart</CardTitle>
          {!isLoading && focusData && focusData.length > 0 && (
            <div className="flex items-center space-x-4 mt-1">
              <div className="flex items-center text-xs text-muted-foreground">
                <span>Top: {Math.max(...focusData.map(d => d.hours))}h</span>
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <span>Average: {(totalFocusTime / Math.max(1, focusData.length)).toFixed(1)}h</span>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="h-[300px]">
        {isLoading ? (
          <LoadingSkeleton type="chart" />
        ) : focusData && focusData.length > 0 ? (
          <ChartContainer config={{ line: { color: "hsl(var(--brand))" } }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={focusData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--brand))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--brand))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area 
                  type="monotone" 
                  dataKey="hours" 
                  stroke="hsl(var(--brand))"
                  strokeWidth={2} 
                  fill="url(#focusGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <NoDataPlaceholder />
        )}
      </CardContent>
    </Card>
  );
};

export default FocusTimeChart;
