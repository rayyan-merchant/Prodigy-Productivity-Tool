
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useTheme } from '@/hooks/useTheme';
import { Moon, Sun, Settings, LogOut } from 'lucide-react';
import { logout, getCurrentUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import NotificationBell from './NotificationBell';
import { getUserProfile } from '@/services/userService';
import { Skeleton } from '@/components/ui/skeleton';

const ProfileHeader = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
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

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="flex items-center gap-2">
      <NotificationBell />

      <Button
        variant="outline"
        size="icon"
        className="rounded-full"
        onClick={toggleTheme}
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10 cursor-pointer">
              {loading ? (
                <Skeleton className="h-10 w-10 rounded-full" />
              ) : (
                <>
                  <AvatarImage src={profileImage} />
                  <AvatarFallback>{getInitials(userName)}</AvatarFallback>
                </>
              )}
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="flex flex-col space-y-1 p-2">
            <p className="text-sm font-medium">{userName}</p>
            <p className="text-xs text-muted-foreground">
              {userEmail}
            </p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate('/settings')}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ProfileHeader;
