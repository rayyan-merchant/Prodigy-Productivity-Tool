import { supabase } from '@/integrations/supabase/client';
import { createSettingsActivity } from './activityService';
import type { Database, Json } from '@/integrations/supabase/types';
import { bioSchema } from '@/lib/validation';

export interface UserProfile {
  name: string;
  email: string;
  photoURL?: string;
  bio?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserSettings {
  theme: 'light' | 'dark';
  notificationsEnabled: boolean;
  workDuration?: number;
  shortBreakDuration?: number;
  longBreakDuration?: number;
  longBreakInterval?: number;
}

const defaultSettings: UserSettings = {
  theme: 'light',
  notificationsEnabled: true,
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
};

const parsePreferences = (value: Json | null): UserSettings => {
  if (!value || Array.isArray(value) || typeof value !== 'object') return defaultSettings;
  return { ...defaultSettings, ...value } as UserSettings;
};

const resolveAvatarUrl = async (path?: string | null): Promise<string> => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  const { data, error } = await supabase.storage.from('avatars').createSignedUrl(path, 60 * 60);
  return error ? '' : data.signedUrl;
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    name: data.display_name || data.name || '',
    email: '',
    photoURL: await resolveAvatarUrl(data.avatar_url),
    bio: data.bio || '',
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

export const getUserSettings = async (userId: string): Promise<UserSettings> => {
  const { data, error } = await supabase.from('profiles').select('preferences').eq('id', userId).single();
  if (error) throw error;
  return parsePreferences(data.preferences);
};

export const updateUserSettings = async (userId: string, settings: Partial<UserSettings>): Promise<void> => {
  const current = await getUserSettings(userId);
  const next = { ...current, ...settings };
  const { error } = await supabase.from('profiles').update({ preferences: next as unknown as Json }).eq('id', userId);
  if (error) throw error;
  await createSettingsActivity('Settings updated', 'Account preferences were changed', Object.keys(settings)[0] || 'preferences');
};

export const updateUserProfile = async (userId: string, profileData: Partial<UserProfile>): Promise<void> => {
  const update: Database['public']['Tables']['profiles']['Update'] = {};
  if (profileData.name !== undefined) {
    update.name = profileData.name.trim();
    update.display_name = profileData.name.trim();
  }
  if (profileData.bio !== undefined) update.bio = bioSchema.parse(profileData.bio);
  const { error } = await supabase.from('profiles').update(update).eq('id', userId);
  if (error) throw error;
  await createSettingsActivity('Profile updated', 'Profile information was updated', 'profile');
};

export const uploadProfileImage = async (userId: string, file: File): Promise<string> => {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Choose a JPG, PNG, or WebP image');
  }
  if (file.size > 5 * 1024 * 1024) throw new Error('Profile images must be 5 MB or smaller');
  const extension = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1];
  const path = `${userId}/avatar.${extension}`;
  const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, {
    upsert: true,
    contentType: file.type,
    cacheControl: '3600',
  });
  if (uploadError) throw uploadError;
  const { error: profileError } = await supabase.from('profiles').update({ avatar_url: path }).eq('id', userId);
  if (profileError) throw profileError;
  const signedUrl = await resolveAvatarUrl(path);
  // Store both the path and the signed URL
  localStorage.setItem('avatarPath', path);
  localStorage.setItem('profileImage', signedUrl);
  return signedUrl;
};

export const createUserDocument = async (): Promise<void> => {
  // Profiles are created by the database auth trigger.
};

export const generateInitialsAvatar = (name: string): string => {
  const initials = name.split(' ').map((part) => part[0]).join('').toUpperCase().substring(0, 2);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#4f46e5"/><text x="50" y="52" font-family="Arial" font-size="35" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">${initials}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};
