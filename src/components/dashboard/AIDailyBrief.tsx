
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getTasks } from '@/services/taskService';
import { getHabits } from '@/services/habitService';
import { getAllSessions } from '@/services/sessionService';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getAccountStorage, setAccountStorage } from '@/lib/accountStorage';
import { getEdgeFunctionErrorMessage } from '@/lib/edgeFunctionError';
import AIResponseMarkdown from '@/components/AIResponseMarkdown';

const CACHE_KEY = 'ai-daily-brief';
const CACHE_DURATION = 4 * 60 * 60 * 1000;

const AIDailyBrief: React.FC = () => {
  const { user } = useAuth();
  const [brief, setBrief] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [lastGenerated, setLastGenerated] = useState<string>('');
  const [provider, setProvider] = useState('');

  // Load cached content on mount
  useEffect(() => {
    if (user) {
      const cached = getAccountStorage<{
        brief: string; generatedAt: string; provider: string; sourceFingerprint: string;
      } | null>(user.id, CACHE_KEY, null);
      if (cached && Date.now() - new Date(cached.generatedAt).getTime() < CACHE_DURATION) {
        setBrief(cached.brief);
        setLastGenerated(cached.generatedAt);
        setProvider(`${cached.provider} · cached`);
      }
    }
  }, [user]);

  const generateBrief = async () => {
    setIsLoading(true);
    try {
      const [tasks, habits, sessions] = await Promise.all([
        getTasks().catch(() => []),
        getHabits().catch(() => []),
        getAllSessions().catch(() => []),
      ]);
      const sourceFingerprint = JSON.stringify({
        tasks: tasks.map(({ id, status, priority, dueDate }) => ({ id, status, priority, dueDate })),
        habits: habits.map(({ id, currentStreak, completedDates }) => ({ id, currentStreak, completedDates })),
        sessions: sessions.slice(0, 10).map(({ id, duration, completed }) => ({ id, duration, completed })),
      });
      if (user) {
        const cached = getAccountStorage<{
          brief: string; generatedAt: string; provider: string; sourceFingerprint: string;
        } | null>(user.id, CACHE_KEY, null);
        if (cached && cached.sourceFingerprint === sourceFingerprint && Date.now() - new Date(cached.generatedAt).getTime() < CACHE_DURATION) {
          setBrief(cached.brief);
          setLastGenerated(cached.generatedAt);
          setProvider(`${cached.provider} · cached`);
          return;
        }
      }

      const { data, error } = await supabase.functions.invoke('daily-brief', {
        body: { tasks, habits, sessions: sessions.slice(0, 10) },
      });

      if (error) throw error;
      if (!data?.success) {
        toast.error(data?.error || 'Daily brief could not be generated');
        return;
      }

      setBrief(data.brief);
      setLastGenerated(data.generatedAt);
      setProvider(data.provider);
      if (user) setAccountStorage(user.id, CACHE_KEY, { ...data, sourceFingerprint });
    } catch (err) {
      console.error('Error generating daily brief:', err);
      toast.error(await getEdgeFunctionErrorMessage(err, 'Failed to generate daily brief'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 via-card/80 to-transparent backdrop-blur-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles size={16} className="text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">AI Daily Brief</h3>
            {lastGenerated && (
              <p className="text-[11px] text-muted-foreground">
                {provider} · {new Date(lastGenerated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={generateBrief} disabled={isLoading}>
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </Button>
        </div>
      </div>
      {isExpanded && (
        <div className="px-5 pb-4">
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-3 bg-muted rounded-full animate-pulse w-full" />
              <div className="h-3 bg-muted rounded-full animate-pulse w-3/4" />
              <div className="h-3 bg-muted rounded-full animate-pulse w-5/6" />
            </div>
          ) : brief ? (
            <AIResponseMarkdown>{brief}</AIResponseMarkdown>
          ) : (
            <p className="text-sm text-muted-foreground">Click refresh to generate your morning brief.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AIDailyBrief;

