import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { clearAccountStorage, clearPrivateCaches, switchLegacyAccountStorage } from '@/lib/accountStorage';
import type { Json } from '@/integrations/supabase/types';

// Store the current user and session
let currentUser: User | null = null;
let currentSession: Session | null = null;

export const setCurrentAuthSession = (session: Session | null) => {
  switchLegacyAccountStorage(currentUser?.id, session?.user.id);
  currentUser = session?.user || null;
  currentSession = session;
  
  // Store display info in localStorage for convenience (NOT for auth decisions)
  if (session?.user) {
    localStorage.setItem('userEmail', session.user.email || '');
    if (session.user.user_metadata?.name) {
      localStorage.setItem('userName', session.user.user_metadata.name);
    }
  } else {
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userBio');
    localStorage.removeItem('profileImage');
  }
};

// Auth check relies ONLY on Supabase session state
export const isAuthenticated = (): boolean => {
  return !!currentUser && !!currentSession;
};

export const getCurrentUser = (): User | null => {
  return currentUser;
};

export const getCurrentSession = (): Session | null => {
  return currentSession;
};

export const isEmailVerified = (): boolean => {
  return currentUser?.email_confirmed_at !== null;
};

export const resendVerificationEmail = async (): Promise<void> => {
  try {
    if (!currentUser?.email) {
      toast.error('No user found or email not available.');
      return;
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: currentUser.email,
    });

    if (error) {
      throw error;
    }

    toast.success('Verification email sent! Please check your inbox.');
  } catch (error) {
    console.error('Error sending verification email', error);
    toast.error('Failed to send verification email. Please try again.');
    throw error;
  }
};

export const signUp = async (email: string, password: string, name: string): Promise<{ user: User; requiresVerification: boolean }> => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      throw error;
    }

    if (!data.user) {
      throw new Error('Failed to create user');
    }

    if (data.session) setCurrentAuthSession(data.session);
    return { user: data.user, requiresVerification: !data.session };
  } catch (error) {
    console.error('Error signing up', error);
    throw error;
  }
};

export const signIn = async (email: string, password: string): Promise<User> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    if (!data.user) {
      throw new Error('Failed to sign in');
    }
    setCurrentAuthSession(data.session);

    // Fetch and store user profile info
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, display_name')
      .eq('id', data.user.id)
      .single();

    if (profile) {
      localStorage.setItem('userName', profile.display_name || profile.name || '');
    }
    localStorage.setItem('userEmail', data.user.email || '');
    
    return data.user;
  } catch (error) {
    console.error('Error signing in', error);
    throw error;
  }
};

export const sendPasswordReset = async (email: string): Promise<void> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      throw error;
    }

    toast.success('Password reset email sent! Please check your inbox.');
  } catch (error) {
    console.error('Error sending password reset email', error);
    throw error;
  }
};

export const updatePassword = async (newPassword: string): Promise<void> => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw error;
    }

    toast.success('Password updated successfully!');
  } catch (error) {
    console.error('Error updating password', error);
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  try {
    const userId = currentUser?.id;
    // Immediately update current session state before any async operations
    setCurrentAuthSession(null);
    // Clear localStorage
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userBio');
    localStorage.removeItem('profileImage');
    localStorage.removeItem('avatarPath');
    
    // Now sign out from Supabase
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw error;
    }
    if (userId) clearAccountStorage(userId);
    await clearPrivateCaches();
  } catch (error) {
    console.error('Error signing out', error);
    throw error;
  }
};

// Helper function to get user profile
export const getUserProfile = async (userId?: string) => {
  const id = userId || currentUser?.id;
  if (!id) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data;
};

// Helper function to update user profile
export const updateUserProfile = async (updates: {
  name?: string;
  display_name?: string;
  avatar_url?: string;
  preferences?: Json;
}) => {
  if (!currentUser?.id) {
    throw new Error('No authenticated user');
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', currentUser.id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Update localStorage if display name changed
  if (updates.display_name || updates.name) {
    localStorage.setItem('userName', updates.display_name || updates.name || '');
  }

  return data;
};

export const deleteAccount = async (): Promise<void> => {
  const userId = currentUser?.id;
  const { data, error } = await supabase.functions.invoke('delete-account');
  if (error || data?.error) {
    throw new Error(data?.error || error?.message || 'Unable to delete account');
  }
  setCurrentAuthSession(null);
  if (userId) clearAccountStorage(userId);
  await clearPrivateCaches();
};
