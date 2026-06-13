import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export const useOffline = () => {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Connection restored. Changes are available again.');
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('You are offline. Prodigy is read-only until the connection returns.', {
        duration: 6_000,
      });
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline };
};
