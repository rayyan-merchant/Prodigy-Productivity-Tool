import { db } from '@/lib/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, getDocs, query, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';
import { getCurrentUser } from '@/lib/auth';
import { Goal } from '@/types/goals';
import { createGoalActivity } from '@/services/activityService';

const convertFirestoreGoal = (doc: any): Goal => {
  const data = doc.data();
  return {
    id: doc.id,
    title: data.title,
    description: data.description,
    targetValue: data.targetValue,
    currentValue: data.currentValue || 0,
    unit: data.unit,
    category: data.category,
    deadline: data.deadline,
    isCompleted: data.isCompleted || false,
    createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
  };
};

export const getGoals = async (): Promise<Goal[]> => {
  try {
    const user = getCurrentUser();
    console.log('🔍 [GOALS] Checking authentication state:', {
      user: user ? { uid: user.uid, email: user.email } : null,
      authCurrentUser: !!user
    });

    if (!user) {
      console.error('❌ [GOALS] User not authenticated in getGoals');
      throw new Error('User not authenticated');
    }

    console.log('📥 [GOALS] Fetching goals for user:', user.uid);
    const goalsRef = collection(db, 'users', user.uid, 'goals');
    console.log('📍 [GOALS] Collection path:', `users/${user.uid}/goals`);

    const q = query(goalsRef, orderBy('updatedAt', 'desc'));

    const querySnapshot = await getDocs(q);
    const goals = querySnapshot.docs.map(convertFirestoreGoal);
    console.log('✅ [GOALS] Successfully fetched goals:', goals.length);
    return goals;
  } catch (error) {
    console.error('❌ [GOALS] Error getting goals:', error);
    console.error('❌ [GOALS] Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    throw error;
  }
};

export const createGoal = async (goalData: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Goal> => {
  const user = getCurrentUser();

  try {
    console.log('🔍 [GOALS] Create - Authentication check:', {
      user: user ? { uid: user.uid, email: user.email } : null,
      authenticated: !!user
    });

    if (!user) {
      console.error('❌ [GOALS] User not authenticated in createGoal');
      throw new Error('User not authenticated');
    }

    console.log('📝 [GOALS] Creating goal for user:', user.uid);
    console.log('📝 [GOALS] Goal data:', goalData);

    const now = serverTimestamp();
    const goalsRef = collection(db, 'users', user.uid, 'goals');
    console.log('📍 [GOALS] Target collection path:', `users/${user.uid}/goals`);

    const dataToSave = {
      ...goalData,
      createdAt: now,
      updatedAt: now,
      userId: user.uid
    };

    console.log('💾 [GOALS] Data being saved to Firestore:', dataToSave);

    const docRef = await addDoc(goalsRef, dataToSave);

    console.log('✅ [GOALS] Successfully created goal with ID:', docRef.id);

    await createGoalActivity(
      'New goal created',
      `"${goalData.title}" was created`,
      docRef.id
    );

    return {
      id: docRef.id,
      ...goalData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ [GOALS] Error creating goal:', error);
    console.error('❌ [GOALS] Firestore error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      name: error.name
    });

    if (error.code === 'permission-denied') {
      console.error('🚫 [GOALS] PERMISSION DENIED - Check Firestore security rules!');
      console.error('🚫 [GOALS] Current user:', user?.uid);
      console.error('🚫 [GOALS] Attempted path:', `users/${user?.uid}/goals`);
    }

    throw error;
  }
};

export const updateGoal = async (goalId: string, goalData: Partial<Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> => {
  try {
    const user = getCurrentUser();
    if (!user) {
      console.error('User not authenticated in updateGoal');
      throw new Error('User not authenticated');
    }

    console.log('Updating goal:', goalId, goalData);
    const goalRef = doc(db, 'users', user.uid, 'goals', goalId);

    await updateDoc(goalRef, {
      ...goalData,
      updatedAt: serverTimestamp()
    });

    console.log('Successfully updated goal:', goalId);

    if (goalData.title) {
      await createGoalActivity(
        'Goal updated',
        `"${goalData.title}" was updated`,
        goalId
      );
    }

    if (goalData.isCompleted) {
      await createGoalActivity(
        'Goal completed',
        `"${goalData.title}" was completed`,
        goalId
      );
    }
  } catch (error) {
    console.error('Error updating goal:', error);
    throw error;
  }
};

export const deleteGoal = async (goalId: string): Promise<void> => {
  try {
    const user = getCurrentUser();
    if (!user) {
      console.error('User not authenticated in deleteGoal');
      throw new Error('User not authenticated');
    }

    const goalRef = doc(db, 'users', user.uid, 'goals', goalId);
    const goalDoc = await getDocs(query(collection(db, 'users', user.uid, 'goals')));
    const goal = goalDoc.docs.find(doc => doc.id === goalId);
    const goalTitle = goal?.data().title || 'Unknown goal';

    console.log('Deleting goal:', goalId);
    await deleteDoc(goalRef);
    console.log('Successfully deleted goal:', goalId);

    await createGoalActivity(
      'Goal deleted',
      `"${goalTitle}" was deleted`,
      goalId
    );
  } catch (error) {
    console.error('Error deleting goal:', error);
    throw error;
  }
};
