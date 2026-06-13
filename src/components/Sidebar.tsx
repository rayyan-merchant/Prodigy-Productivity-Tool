
import React, { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Home, CheckSquare, BarChart2, Settings, Timer, Flame, Droplets, Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion, AnimatePresence } from "framer-motion";
import BrandLogo from '@/components/BrandLogo';
import { getUserProfile } from '@/services/userService';
import { getCurrentUser } from '@/lib/auth';
import { Skeleton } from '@/components/ui/skeleton';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [userName, setUserName] = useState(() => localStorage.getItem('userName') || 'User');
  const [profileImage, setProfileImage] = useState(() => localStorage.getItem('profileImage') || '');
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('userEmail') || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = getCurrentUser();
        if (user) {
          const profile = await getUserProfile(user.id);
          if (profile) {
            setUserName(profile.name || 'User');
            setProfileImage(profile.photoURL || '');
            setUserEmail(user.email || '');
            localStorage.setItem('userName', profile.name || 'User');
            if (profile.photoURL) {
              localStorage.setItem('profileImage', profile.photoURL);
            }
            if (user.email) {
              localStorage.setItem('userEmail', user.email);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);
  
  const getInitials = (name: string) => {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);
  };
  
  const navItems = [
    { icon: Home, label: "Dashboard", path: "/dashboard" },
    { icon: CheckSquare, label: "Tasks", path: "/tasks" },
    { icon: Timer, label: "Pomodoro", path: "/pomodoro" },
    { icon: Flame, label: "Habits", path: "/habits" },
    { icon: Droplets, label: "Water", path: "/water" },
    { icon: BarChart2, label: "Analytics", path: "/analytics" },
    { icon: Settings, label: "Settings", path: "/settings" }
  ];

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {isMobile && !collapsed && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setCollapsed(true)}
          />
        )}
      </AnimatePresence>
      
      <aside 
        className={cn(
          "bg-card border-r border-border h-screen transition-all duration-300 z-50 flex flex-col",
          isMobile ? "fixed left-0 top-0" : "relative",
          collapsed ? (isMobile ? "-translate-x-full" : "w-16") : "w-64"
        )}
      >
        {/* Logo + Toggle */}
        <div className={cn(
          "flex items-center border-b border-border",
          collapsed ? "justify-center p-3" : "gap-3 p-3"
        )}>
          {!collapsed ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                onClick={() => setCollapsed(true)}
                title="Collapse sidebar"
              >
                <Menu size={18} />
              </Button>
              <BrandLogo />
            </>
          ) : (
            <div 
              className="flex items-center justify-center w-9 h-9 group cursor-pointer rounded-lg hover:bg-muted/60 transition-colors"
              onClick={() => setCollapsed(false)}
              title="Expand sidebar"
            >
              <BrandLogo compact />
            </div>
          )}
        </div>

        {/* User Avatar Section */}
        {!collapsed && (
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                {loading ? (
                  <Skeleton className="h-9 w-9 rounded-full" />
                ) : (
                  <>
                    <AvatarImage src={profileImage} />
                    <AvatarFallback className="bg-brand/10 text-brand text-sm font-semibold">{getInitials(userName)}</AvatarFallback>
                  </>
                )}
              </Avatar>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-foreground truncate">{userName}</p>
                <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="p-2 flex-1 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.label}>
                  <Link to={item.path} onClick={() => isMobile && setCollapsed(true)}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full flex items-center justify-start gap-3 transition-all duration-200",
                        collapsed ? "px-2 justify-center" : "px-3",
                        "text-muted-foreground hover:bg-brand/10 hover:text-brand",
                        isActive && "bg-brand/10 text-brand font-medium"
                      )}
                    >
                      <item.icon size={20} className={cn(
                        "shrink-0",
                        isActive ? "text-brand" : "text-muted-foreground"
                      )} />
                      {!collapsed && (
                        <span className={cn(
                          isActive ? "text-brand" : "text-foreground"
                        )}>{item.label}</span>
                      )}
                    </Button>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
