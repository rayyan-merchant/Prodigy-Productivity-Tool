import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Keyboard, Download, Plug } from 'lucide-react';
import { toast } from 'sonner';
import { logout, getCurrentUser } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { getUserProfile, getUserSettings, updateUserSettings } from '@/services/userService';
import { Skeleton } from '@/components/ui/skeleton';
import KeyboardShortcutsTab from '@/components/settings/KeyboardShortcutsTab';
import ProfileSettings from '@/components/settings/ProfileSettings';
import NotificationSettings from '@/components/settings/NotificationSettings';
import AppearanceSettings from '@/components/settings/AppearanceSettings';
import AccountActions from '@/components/settings/AccountActions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DataExport from '@/components/DataExport';
import IntegrationsPanel from '@/components/integrations/IntegrationsPanel';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [isExportOpen, setIsExportOpen] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        const user = getCurrentUser();
        if (!user) {
          toast.error('User not authenticated');
          navigate('/auth');
          return;
        }
        
        const userId = user.id;
        
        const profile = await getUserProfile(userId);
        if (profile) {
          setName(profile.name || '');
          setEmail(user.email || '');
          setBio(profile.bio || '');
          setProfileImage(profile.photoURL || '');
        }
        
        const settings = await getUserSettings(userId);
        if (settings) {
          setNotificationsEnabled(settings.notificationsEnabled);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        toast.error('Failed to load user data');
        
        setName(localStorage.getItem('userName') || '');
        setEmail(localStorage.getItem('userEmail') || '');
        setBio(localStorage.getItem('userBio') || '');
        setProfileImage(localStorage.getItem('profileImage') || '');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleNotificationToggle = async () => {
    try {
      const user = getCurrentUser();
      if (!user) return;
      
      const newValue = !notificationsEnabled;
      setNotificationsEnabled(newValue);
      await updateUserSettings(user.id, { notificationsEnabled: newValue });
      toast.success(`Notifications ${newValue ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error("Error updating notification settings:", error);
      setNotificationsEnabled(!notificationsEnabled);
      toast.error("Failed to update notification settings");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="mb-4">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-7 w-32 mb-2" />
              <Skeleton className="h-5 w-48" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="space-y-3">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-5 w-48" />
                </div>
              </div>
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-28 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6 fade-in max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold mb-1 text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="profile" className="text-xs sm:text-sm">Profile</TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs sm:text-sm">Notifications</TabsTrigger>
          <TabsTrigger value="appearance" className="text-xs sm:text-sm">Appearance</TabsTrigger>
          <TabsTrigger value="integrations" className="text-xs sm:text-sm">
            <Plug className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Integrations</span>
            <span className="sm:hidden">Sync</span>
          </TabsTrigger>
          <TabsTrigger value="shortcuts" className="text-xs sm:text-sm">
            <Keyboard className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Shortcuts</span>
            <span className="sm:hidden">Keys</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="mt-6">
          <ProfileSettings
            profileImage={profileImage}
            name={name}
            email={email}
            bio={bio}
            onProfileImageChange={setProfileImage}
            onNameChange={setName}
            onBioChange={setBio}
          />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="appearance" className="mt-6">
          <AppearanceSettings />
        </TabsContent>

        <TabsContent value="integrations" className="mt-6">
          <IntegrationsPanel />
        </TabsContent>

        <TabsContent value="shortcuts" className="mt-6">
          <KeyboardShortcutsTab />
        </TabsContent>
      </Tabs>

      <div className="flex flex-col space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Data Management</CardTitle>
            <CardDescription>Export your data for backup or analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="gap-2" onClick={() => setIsExportOpen(true)}>
              <Download size={16} />
              Export Data
            </Button>
          </CardContent>
        </Card>
        <AccountActions />
      </div>

      <DataExport isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
    </div>
  );
};

export default Settings;