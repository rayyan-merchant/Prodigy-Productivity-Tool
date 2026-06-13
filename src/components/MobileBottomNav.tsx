
import React, { useState } from 'react';
import { Home, CheckSquare, Timer, Flame, MoreHorizontal, CalendarDays, Droplets, BarChart2, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const mainNavItems = [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: CheckSquare, label: "Tasks", path: "/tasks" },
    { icon: Timer, label: "Focus", path: "/pomodoro" },
    { icon: Droplets, label: "Water", path: "/water" },
  ];

  const moreNavItems = [
    { icon: CalendarDays, label: "Calendar", path: "/calendar" },
    { icon: Flame, label: "Habits", path: "/habits" },
    { icon: BarChart2, label: "Analytics", path: "/analytics" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border lg:hidden">
        <div className="flex items-center justify-around h-16 px-2">
          {mainNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-lg transition-colors",
                  isActive ? "text-brand" : "text-muted-foreground"
                )}
              >
                <item.icon size={20} className={cn(isActive && "text-brand")} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
          <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-lg transition-colors",
                  moreNavItems.some(i => i.path === location.pathname) ? "text-brand" : "text-muted-foreground"
                )}
              >
                <MoreHorizontal size={20} className={cn(moreNavItems.some(i => i.path === location.pathname) && "text-brand")} />
                <span className="text-[10px] font-medium">More</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-1/2 rounded-t-xl">
              <SheetHeader>
                <SheetTitle>More Pages</SheetTitle>
              </SheetHeader>
              <div className="mt-6 grid grid-cols-2 gap-4">
                {moreNavItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMoreOpen(false)}
                    >
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full flex flex-col items-center justify-center gap-2 py-4",
                          isActive ? "text-brand" : "text-muted-foreground"
                        )}
                      >
                        <item.icon size={24} />
                        <span>{item.label}</span>
                      </Button>
                    </Link>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </>
  );
};

export default MobileBottomNav;
