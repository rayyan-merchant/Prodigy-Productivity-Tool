import { useState, useEffect, useCallback } from 'react';
import { useOffline } from './useOffline';
import { toast } from 'sonner';

interface OfflineSyncItem {
  id: string;
  type: 'task' | 'note' | 'goal' | 'habit';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: string;
}

export const useOfflineSync = () => {
  const { isOnline, saveOfflineData, getOfflineData, clearSyncedData } = useOffline();
  const [pendingSync, setPendingSync] = useState<OfflineSyncItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const loadPendingItems = () => {
      const offlineData = localStorage.getItem('offlineData');
      if (offlineData) {
        try {
          const data = JSON.parse(offlineData);
          const pending = Object.values(data).filter((item: any) => !item.synced);
          setPendingSync(pending as OfflineSyncItem[]);
        } catch (error) {
          console.error('Error loading pending sync items:', error);
        }
      }
    };

    loadPendingItems();
  }, []);

  const queueOfflineAction = useCallback((item: Omit<OfflineSyncItem, 'timestamp'>) => {
    const syncItem: OfflineSyncItem = {
      ...item,
      timestamp: new Date().toISOString()
    };

    saveOfflineData(syncItem.id, syncItem);
    setPendingSync(prev => [...prev, syncItem]);
  }, [saveOfflineData]);

  const syncPendingItems = useCallback(async () => {
    if (!isOnline || isSyncing || pendingSync.length === 0) return;

    setIsSyncing(true);
    let successCount = 0;

    try {
      for (const item of pendingSync) {
        try {

          await new Promise(resolve => setTimeout(resolve, 100));

          const offlineData = JSON.parse(localStorage.getItem('offlineData') || '{}');
          if (offlineData[item.id]) {
            offlineData[item.id].synced = true;
            localStorage.setItem('offlineData', JSON.stringify(offlineData));
          }

          successCount++;
        } catch (error) {
          console.error(`Failed to sync item ${item.id}:`, error);
        }
      }

      if (successCount > 0) {
        toast.success(`Synced ${successCount} items successfully`);
        clearSyncedData();
        setPendingSync(prev => prev.filter(item => {
          const offlineData = JSON.parse(localStorage.getItem('offlineData') || '{}');
          return !offlineData[item.id]?.synced;
        }));
      }
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('Failed to sync offline changes');
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, pendingSync, clearSyncedData]);

  useEffect(() => {
    if (isOnline && pendingSync.length > 0) {
      const timer = setTimeout(syncPendingItems, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, pendingSync.length, syncPendingItems]);

  return {
    pendingSync,
    isSyncing,
    queueOfflineAction,
    syncPendingItems
  };
};
