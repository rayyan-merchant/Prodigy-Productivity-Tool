import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, User } from 'lucide-react';
import { toast } from 'sonner';
import { getCurrentUser } from '@/lib/auth';
import { updateUserProfile, uploadProfileImage } from '@/services/userService';

interface ProfileSettingsProps {
  profileImage: string;
  name: string;
  email: string;
  bio: string;
  onProfileImageChange: (imageUrl: string) => void;
  onNameChange: (name: string) => void;
  onBioChange: (bio: string) => void;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({
  profileImage,
  name,
  email,
  bio,
  onProfileImageChange,
  onNameChange,
  onBioChange
}) => {
  const [saving, setSaving] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const user = getCurrentUser();
        if (!user) {
          toast.error('User not authenticated');
          return;
        }
        
        toast.loading("Uploading image...");
        const imageUrl = await uploadProfileImage(user.id, file);
        onProfileImageChange(imageUrl);
        toast.success("Profile image updated");
      } catch (error) {
        console.error("Error uploading image:", error);
        toast.error("Failed to upload image");
      }
    }
  };

  const handleSaveProfile = async () => {
    try {
      const user = getCurrentUser();
      if (!user) {
        toast.error('User not authenticated');
        return;
      }
      
      setSaving(true);
      await updateUserProfile(user.id, {
        name,
        bio
      });
      toast.success("Profile settings saved");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>
          Update your personal information and preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center space-y-4 lg:items-start">
          <Label htmlFor="profile-image" className="text-center lg:text-left">Profile Picture</Label>
          <div className="flex flex-col items-center gap-4 lg:flex-row">
            <Avatar className="h-24 w-24 cursor-pointer border-2 border-border hover:border-primary">
              <AvatarImage src={profileImage} alt="Profile picture" />
              <AvatarFallback className="text-2xl bg-muted">
                <User />
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-2">
              <Label htmlFor="picture" className="cursor-pointer">
                <div className="flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 hover:border-primary hover:bg-primary/5 hover:text-primary">
                  <Camera size={16} /> Upload Image
                </div>
                <Input 
                  id="picture" 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </Label>
              <p className="text-xs text-muted-foreground">Square JPG, PNG, or WebP. Maximum 5 MB.</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                placeholder="John Doe" 
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                maxLength={120}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="john@example.com" 
                value={email}
                disabled
                className="bg-muted"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <textarea
              id="bio"
              className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background text-sm"
              placeholder="Tell us about yourself"
              value={bio}
              onChange={(e) => onBioChange(e.target.value)}
              maxLength={500}
            ></textarea>
            <p className="text-right text-xs text-muted-foreground">{bio.length}/500</p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={handleSaveProfile}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileSettings;
