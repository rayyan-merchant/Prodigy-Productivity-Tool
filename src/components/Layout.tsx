
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { cn } from "@/lib/utils";
import Sidebar from './Sidebar';
import OfflineIndicator from './OfflineIndicator';
import { useIsMobile } from "@/hooks/use-mobile";

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();

  // On mobile: sidebar is overlay, controlled by mobileOpen
  // On desktop: sidebar is inline, controlled by collapsed
  const sidebarCollapsed = isMobile ? !mobileOpen : collapsed;

  const handleSetCollapsed = (value: boolean) => {
    if (isMobile) {
      setMobileOpen(!value);
    } else {
      setCollapsed(value);
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <OfflineIndicator />
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={handleSetCollapsed} />
      <main className="flex-1 transition-all duration-300 overflow-auto min-w-0">
        {children || <Outlet />}
      </main>
    </div>
  );
};

export default Layout;
