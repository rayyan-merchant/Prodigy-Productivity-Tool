
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

type TableName = 'tasks' | 'habits' | 'pomodoro_sessions' | 'water_intake';

/**
 * Hook that subscribes to realtime changes on a Supabase table.
 * Can invalidate react-query cache OR call a custom refetch callback.
 */
export const useRealtimeSubscription = (
  table: TableName,
  queryKeyOrRefetch?: string[] | (() => void)
) => {
  const queryClient = useQueryClient();
  const targetRef = useRef(queryKeyOrRefetch);

  useEffect(() => {
    targetRef.current = queryKeyOrRefetch;
  }, [queryKeyOrRefetch]);

  useEffect(() => {
    const channel = supabase
      .channel(`realtime-${table}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
        },
        () => {
          const target = targetRef.current;
          if (typeof target === 'function') {
            target();
          } else if (Array.isArray(target)) {
            queryClient.invalidateQueries({ queryKey: target });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, queryClient]);
};
