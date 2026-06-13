
import React from 'react';
import { Outlet } from 'react-router-dom';
import Layout from './Layout';
import ProfileHeader from './ProfileHeader';
import MobileBottomNav from './MobileBottomNav';
import OnboardingTour from './OnboardingTour';
import KeyboardShortcutsOverlay from './KeyboardShortcutsOverlay';
import { useTheme } from '@/hooks/useTheme';
import { useOffline } from '@/hooks/useOffline';
import { useIsMobile } from '@/hooks/use-mobile';
import { useHydrationReminders } from '@/hooks/useHydrationReminders';
import FloatingTimer from './FloatingTimer';

const LayoutWrapper: React.FC = () => {
  const { theme } = useTheme();
  useOffline();
  const isMobile = useIsMobile();
  useHydrationReminders();
  
  React.useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return (
    <Layout>
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border px-3 sm:px-4 md:px-6 py-2 flex justify-end">
        <ProfileHeader />
      </div>
      <div className={`px-3 sm:px-4 md:px-6 py-4 ${isMobile ? 'pb-20' : ''}`}>
        <Outlet />
      </div>
      {isMobile && <MobileBottomNav />}
      <OnboardingTour />
      <KeyboardShortcutsOverlay />
      <FloatingTimer />
    </Layout>
  );
};

export default LayoutWrapper;
