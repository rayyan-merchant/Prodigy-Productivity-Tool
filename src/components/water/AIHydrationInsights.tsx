
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { WaterIntake } from '@/services/waterService';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getAccountStorage, setAccountStorage } from '@/lib/accountStorage';
import { toLocalDateKey } from '@/lib/dateOnly';
import { fingerprint } from '@/lib/fingerprint';

interface AIHydrationInsightsProps {
  history: WaterIntake[];
  goal: number;
  streak: number;
}

const AIHydrationInsights: React.FC<AIHydrationInsightsProps> = ({ history, goal, streak }) => {
  const { user } = useAuth();
  const [insights, setInsights] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [provenance, setProvenance] = useState('');

  // Load cached insights on mount
  useEffect(() => {
    if (user) {
      const cacheKey = `ai:hydration:${fingerprint({ goal, streak, history: history.map(({ amount_ml, logged_at }) => ({ amount_ml, logged_at })) })}`;
      const cached = getAccountStorage<{ data: string; provider: string; generatedAt: string } | null>(user.id, cacheKey, null);
      if (cached && Date.now() - new Date(cached.generatedAt).getTime() < 4 * 60 * 60 * 1_000) {
        setInsights(cached.data);
        setProvenance(`${cached.provider} | cached | ${new Date(cached.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      }
    }
  }, [user, history, goal, streak]);

  const generateInsights = async () => {
    setIsLoading(true);
    try {
      const cacheKey = `ai:hydration:${fingerprint({ goal, streak, history: history.map(({ amount_ml, logged_at }) => ({ amount_ml, logged_at })) })}`;
      if (user) {
        const cached = getAccountStorage<{ data: string; provider: string; generatedAt: string } | null>(user.id, cacheKey, null);
        if (cached && Date.now() - new Date(cached.generatedAt).getTime() < 4 * 60 * 60 * 1_000) {
          setInsights(cached.data);
          setProvenance(`${cached.provider} | cached | ${new Date(cached.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
          setIsLoading(false);
          return;
        }
      }
      // Build context from history
      const dailyMap = new Map<string, number>();
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      history.forEach(entry => {
        const d = new Date(entry.logged_at);
        const day = toLocalDateKey(d);
        dailyMap.set(day, (dailyMap.get(day) || 0) + entry.amount_ml);
      });

      const dailyData = Array.from(dailyMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, total]) => {
          const d = new Date(`${date}T12:00:00`);
          return `${dayNames[d.getDay()]}: ${(total / 1000).toFixed(1)}L`;
        })
        .join('\n');

      // Hourly patterns
      const hourlyMap = new Map<number, number>();
      history.forEach(entry => {
        const hour = new Date(entry.logged_at).getHours();
        hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + entry.amount_ml);
      });

      const hourlyData = Array.from(hourlyMap.entries())
        .sort(([a], [b]) => a - b)
        .map(([hour, total]) => `${hour}:00 - ${total}ml total`)
        .join(', ');

      const dailyTotals = Array.from(dailyMap.values());
      const avg = dailyTotals.length > 0
        ? (dailyTotals.reduce((a, b) => a + b, 0) / dailyTotals.length / 1000).toFixed(1)
        : '0';

      const prompt = `Analyze this water intake data and provide 3-4 brief, personalized hydration insights. Be specific and actionable.

Daily goal: ${(goal / 1000).toFixed(1)}L
Current streak: ${streak} days
Average intake: ${avg}L/day

Daily breakdown:
${dailyData || 'No data yet'}

Hourly patterns: ${hourlyData || 'No data yet'}

Format as bullet points. Keep each insight to 1-2 sentences. Focus on patterns, recommendations, and encouragement.`;

      const { data, error } = await supabase.functions.invoke('hydration-insights', {
        body: { prompt },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'No insight was generated');
      setInsights(data.data);
      setProvenance(`${data.provider} | ${new Date(data.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      if (user) setAccountStorage(user.id, cacheKey, data);
    } catch (error) {
      console.error('Error generating insights:', error);
      toast.error('Could not generate insights right now');
      setInsights(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" style={{ color: 'hsl(200 85% 55%)' }} />
            <CardTitle className="text-base font-semibold text-foreground">AI Insights</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={generateInsights}
            disabled={isLoading}
            className="text-muted-foreground hover:text-foreground"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : insights ? (
              <RefreshCw className="w-4 h-4" />
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                Generate
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {insights ? (
          <div className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
            {insights}
            {provenance && <p className="mt-3 text-xs">{provenance}</p>}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Click "Generate" to get AI-powered hydration insights based on your intake patterns.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default AIHydrationInsights;

