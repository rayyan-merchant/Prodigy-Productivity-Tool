import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, Clock, Calendar, CheckCircle2, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { getAllSessions, PomodoroSession } from '@/services/sessionService';
import { format, isToday, isYesterday } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentUser } from '@/lib/auth';

interface SessionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

const SessionHistory: React.FC<SessionHistoryProps> = ({ isOpen, onClose }) => {
  const [sessions, setSessions] = useState<(PomodoroSession & { taskTitle?: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    if (isOpen) loadSessions();
  }, [isOpen]);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const all = await getAllSessions();
      
      // Fetch task titles for sessions with task_id
      const taskIds = [...new Set(all.filter(s => s.taskId).map(s => s.taskId!))];
      let taskMap: Record<string, string> = {};
      
      if (taskIds.length > 0) {
        const user = getCurrentUser();
        if (user) {
          const { data: tasks } = await supabase
            .from('tasks')
            .select('id, title')
            .eq('user_id', user.id)
            .in('id', taskIds);
          if (tasks) {
            taskMap = Object.fromEntries(tasks.map(t => [t.id, t.title]));
          }
        }
      }
      
      setSessions(all.map(s => ({
        ...s,
        taskTitle: s.taskId ? taskMap[s.taskId] || 'Unknown Task' : undefined
      })));
    } catch (e) {
      console.error('Error loading session history:', e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // Group sessions by date
  const groupedSessions: Record<string, typeof sessions> = {};
  const paginatedSessions = sessions.slice(page * pageSize, (page + 1) * pageSize);
  
  paginatedSessions.forEach(session => {
    const dateKey = format(new Date(session.date), 'yyyy-MM-dd');
    if (!groupedSessions[dateKey]) groupedSessions[dateKey] = [];
    groupedSessions[dateKey].push(session);
  });

  const totalPages = Math.ceil(sessions.length / pageSize);

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'EEEE, MMM d, yyyy');
  };

  const formatDuration = (mins: number) => {
    if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60}m`;
    return `${mins}m`;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'focus': return 'bg-primary/10 text-primary border-primary/20';
      case 'short-break': return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20';
      case 'long-break': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'focus': return 'Focus';
      case 'short-break': return 'Short Break';
      case 'long-break': return 'Long Break';
      default: return type;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg max-w-2xl w-full max-h-[85vh] flex flex-col border shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <History className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Session History</h2>
              <p className="text-sm text-muted-foreground">{sessions.length} total sessions</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-16">
                <History className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No sessions yet</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Complete a Pomodoro session to see it here</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedSessions).map(([dateKey, daySessions]) => (
                  <div key={dateKey}>
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-sm font-semibold text-foreground">{formatDateLabel(dateKey)}</h3>
                      <span className="text-xs text-muted-foreground">
                        ({daySessions.length} session{daySessions.length !== 1 ? 's' : ''})
                      </span>
                    </div>
                    <div className="space-y-2">
                      {daySessions.map((session, idx) => (
                        <Card key={session.id || idx} className="border-border bg-card hover:bg-accent/5 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {session.completed ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-destructive shrink-0" />
                                )}
                                <div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className={`text-xs ${getTypeColor(session.type)}`}>
                                      {getTypeLabel(session.type)}
                                    </Badge>
                                    <span className="text-sm font-medium text-foreground flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {formatDuration(session.duration)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-muted-foreground">
                                      {format(new Date(session.date), 'h:mm a')}
                                    </span>
                                    {session.taskTitle && (
                                      <span className="text-xs text-muted-foreground">
                                        • {session.taskTitle}
                                      </span>
                                    )}
                                    {session.focusLabel && session.focusLabel !== session.taskTitle && (
                                      <span className="text-xs text-muted-foreground">
                                        • {session.focusLabel}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {session.notes && (
                                <span className="text-xs text-muted-foreground max-w-[150px] truncate hidden sm:block">
                                  📝 {session.notes}
                                </span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionHistory;
