import { db, storage, auth } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { createSettingsActivity } from './activityService';

interface UserProfile {
  name: string;
  email: string;
  photoURL?: string;
  bio?: string;
  createdAt?: any;
  updatedAt?: any;
}

interface UserSettings {
  theme: 'light' | 'dark';
  notificationsEnabled: boolean;
  workDuration?: number;
  shortBreakDuration?: number;
  longBreakDuration?: number;
  longBreakInterval?: number;
}

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

export const getUserSettings = async (userId: string): Promise<UserSettings | null> => {
  try {
    const settingsRef = doc(db, 'users', userId, 'settings', 'preferences');
    const settingsSnap = await getDoc(settingsRef);

    if (settingsSnap.exists()) {
      return settingsSnap.data() as UserSettings;
    }

    return {
      theme: 'light',
      notificationsEnabled: true,
      workDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      longBreakInterval: 4
    };
  } catch (error) {
    console.error('Error getting user settings:', error);
    throw error;
  }
};

export const updateUserSettings = async (userId: string, settings: Partial<UserSettings>): Promise<void> => {
  try {
    const settingsRef = doc(db, 'users', userId, 'settings', 'preferences');
    await updateDoc(settingsRef, {
      ...settings,
      updatedAt: serverTimestamp()
    });

    const settingKeys = Object.keys(settings);
    if (settingKeys.length > 0) {
      const settingType = settingKeys[0];
      await createSettingsActivity(
        'Settings updated',
        `${settingType} setting was changed`,
        settingType
      );
    }
  } catch (error) {
    console.error('Error updating user settings:', error);
    throw error;
  }
};

export const updateUserProfile = async (userId: string, profileData: Partial<UserProfile>): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);

    await updateDoc(userRef, {
      ...profileData,
      updatedAt: serverTimestamp()
    });

    if (auth.currentUser && auth.currentUser.uid === userId) {
      await updateProfile(auth.currentUser, {
        displayName: profileData.name,
        photoURL: profileData.photoURL
      });
    }

    await createSettingsActivity(
      'Profile updated',
      'Profile information was updated',
      'profile'
    );
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export const uploadProfileImage = async (userId: string, file: File): Promise<string> => {
  try {

    const storageRef = ref(storage, `users/${userId}/profile/${file.name}`);

    await uploadBytes(storageRef, file);

    const downloadURL = await getDownloadURL(storageRef);

    await updateUserProfile(userId, { photoURL: downloadURL });

    return downloadURL;
  } catch (error) {
    console.error('Error uploading profile image:', error);
    throw error;
  }
};

export const createUserDocument = async (userId: string, userData: { name: string, email: string }): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        name: userData.name,
        email: userData.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      const settingsRef = doc(db, 'users', userId, 'settings', 'preferences');
      await setDoc(settingsRef, {
        theme: 'light',
        notificationsEnabled: true,
        workDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 15,
        longBreakInterval: 4,
        createdAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error creating user document:', error);
    throw error;
  }
};

export const generateInitialsAvatar = (name: string): string => {
  const colors = [
    '#FF6633', '#FFB399', '#FF33FF', '#FFFF99', '#00B3E6',
    '#E6B333', '#3366E6', '#999966', '#99FF99', '#B34D4D',
    '#80B300', '#809900', '#E6B3B3', '#6680B3', '#66991A',
    '#FF99E6', '#CCFF1A', '#FF1A66', '#E6331A', '#33FFCC'
  ];

  const initials = name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  const colorIndex = Math.abs(name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)) % colors.length;
  const color = colors[colorIndex];

  return `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" fill="${color}" />
      <text x="50" y="50" font-family="Arial" font-size="35" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">${initials}</text>
    </svg>
  `)}`;
};
