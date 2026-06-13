import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { WaterIntake } from '@/services/waterService';
import { toLocalDateKey } from '@/lib/dateOnly';

interface WaterHistoryProps {
  history: WaterIntake[];
  goal: number;
}

const WaterHistory: React.FC<WaterHistoryProps> = ({ history, goal }) => {
  // Group by day
  const dailyMap = new Map<string, number>();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Fill last 7 days
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = toLocalDateKey(d);
    dailyMap.set(key, 0);
  }

  history.forEach(entry => {
    const day = toLocalDateKey(new Date(entry.logged_at));
    if (dailyMap.has(day)) {
      dailyMap.set(day, (dailyMap.get(day) || 0) + entry.amount_ml);
    }
  });

  const chartData = Array.from(dailyMap.entries()).map(([date, total]) => {
    const d = new Date(date);
    return {
      day: dayNames[d.getDay()],
      total,
      totalL: (total / 1000).toFixed(1),
    };
  });

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-foreground">Weekly Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barSize={28}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <YAxis hide />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value: number) => [`${(value / 1000).toFixed(1)}L`, 'Intake']}
              />
              <ReferenceLine y={goal} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" />
              <Bar
                dataKey="total"
                radius={[6, 6, 0, 0]}
                fill="hsl(200 85% 55%)"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Dashed line = daily goal ({(goal / 1000).toFixed(1)}L)
        </p>
      </CardContent>
    </Card>
  );
};

export default WaterHistory;
