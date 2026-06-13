
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
      toast.error(err instanceof Error ? err.message : 'Failed to generate daily brief');
    } finally {
      setIsLoading(false);
    }
  };

  const renderInlineMarkdown = (text: string) => {
    return text.split(/(\*\*[^*]+\*\*)/g).map((segment, index) => {
      if (segment.startsWith('**') && segment.endsWith('**')) {
        return (
          <strong key={index} className="font-semibold text-foreground">
            {segment.slice(2, -2)}
          </strong>
        );
      }
      return <React.Fragment key={index}>{segment}</React.Fragment>;
    });
  };

  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    const blocks: React.ReactNode[] = [];
    let listType: 'ul' | 'ol' | null = null;
    let listItems: React.ReactNode[] = [];

    const flushList = () => {
      if (!listType || listItems.length === 0) return;

      blocks.push(
        listType === 'ul' ? (
          <ul key={`list-${blocks.length}`} className="space-y-1 pl-5 text-sm text-muted-foreground list-disc">
            {listItems}
          </ul>
        ) : (
          <ol key={`list-${blocks.length}`} className="space-y-1 pl-5 text-sm text-muted-foreground list-decimal">
            {listItems}
          </ol>
        )
      );

      listType = null;
      listItems = [];
    };

    lines.forEach((rawLine, index) => {
      const line = rawLine.trim();

      if (!line) {
        flushList();
        return;
      }

      const unorderedMatch = /^[-*]\s+(.+)/.exec(line);
      const orderedMatch = /^\d+\.\s+(.+)/.exec(line);

      if (unorderedMatch) {
        if (listType !== 'ul') {
          flushList();
          listType = 'ul';
        }
        listItems.push(<li key={`li-${index}`}>{renderInlineMarkdown(unorderedMatch[1])}</li>);
        return;
      }

      if (orderedMatch) {
        if (listType !== 'ol') {
          flushList();
          listType = 'ol';
        }
        listItems.push(<li key={`li-${index}`}>{renderInlineMarkdown(orderedMatch[1])}</li>);
        return;
      }

      flushList();

      if (line.startsWith('#### ')) {
        blocks.push(<h4 key={`h4-${index}`} className="pt-2 text-sm font-semibold text-foreground">{renderInlineMarkdown(line.slice(5))}</h4>);
        return;
      }

      if (line.startsWith('### ')) {
        blocks.push(<h3 key={`h3-${index}`} className="pt-2 text-sm font-semibold text-foreground">{renderInlineMarkdown(line.slice(4))}</h3>);
        return;
      }

      if (line.startsWith('## ')) {
        blocks.push(<h2 key={`h2-${index}`} className="pt-2 text-base font-semibold text-foreground">{renderInlineMarkdown(line.slice(3))}</h2>);
        return;
      }

      if (line.startsWith('# ')) {
        blocks.push(<h2 key={`h1-${index}`} className="pt-2 text-lg font-semibold text-foreground">{renderInlineMarkdown(line.slice(2))}</h2>);
        return;
      }

      blocks.push(
        <p key={`p-${index}`} className="text-sm leading-6 text-muted-foreground">
          {renderInlineMarkdown(line)}
        </p>
      );
    });

    flushList();
    return blocks;
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
            <div className="space-y-2">{renderMarkdown(brief)}</div>
          ) : (
            <p className="text-sm text-muted-foreground">Click refresh to generate your morning brief.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AIDailyBrief;

