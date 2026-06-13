import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { setCurrentAuthSession } from '@/lib/auth';
import { persistLegacyAccountStorage } from '@/lib/accountStorage';

interface AuthContextValue {
  isLoading: boolean;
  session: Session | null;
  user: User | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const applyAccountPreferences = async (nextSession: Session | null) => {
      if (!nextSession?.user) return;
      const { data } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', nextSession.user.id)
        .maybeSingle();
      const preferences = data?.preferences;
      if (preferences && !Array.isArray(preferences) && typeof preferences === 'object') {
        const theme = preferences.theme;
        if (theme === 'light' || theme === 'dark') {
          localStorage.setItem('theme', theme);
          document.documentElement.classList.toggle('dark', theme === 'dark');
        }
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setCurrentAuthSession(data.session);
      void applyAccountPreferences(data.session);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setCurrentAuthSession(nextSession);
      void applyAccountPreferences(nextSession);
      setIsLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user.id) return;
    const persist = () => persistLegacyAccountStorage(session.user.id);
    const persistWhenHidden = () => {
      if (document.visibilityState === 'hidden') persist();
    };
    window.addEventListener('pagehide', persist);
    document.addEventListener('visibilitychange', persistWhenHidden);
    return () => {
      window.removeEventListener('pagehide', persist);
      document.removeEventListener('visibilitychange', persistWhenHidden);
    };
  }, [session?.user.id]);

  const value = useMemo<AuthContextValue>(() => ({
    isLoading,
    session,
    user: session?.user ?? null,
  }), [isLoading, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
