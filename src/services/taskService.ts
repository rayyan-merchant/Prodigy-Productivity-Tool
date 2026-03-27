import { db } from '@/lib/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import type { Task } from '@/types/tasks';
import { getCurrentUser } from '@/lib/auth';
import { createTaskActivity } from '@/services/activityService';

export type { Task } from '@/types/tasks';

export const getUserTasks = async (): Promise<Task[]> => {
  try {
    const user = getCurrentUser();
    console.log('🔍 [TASKS] Checking authentication state:', {
      user: user ? { uid: user.uid, email: user.email } : null,
      authCurrentUser: !!user
    });

    if (!user) {
      console.error('❌ [TASKS] User not authenticated in getUserTasks');
      throw new Error('User not authenticated');
    }

    console.log('📥 [TASKS] Fetching tasks for user:', user.uid);
    const tasksRef = collection(db, 'tasks');
    const q = query(
      tasksRef,
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    console.log('📍 [TASKS] Query path: tasks collection with userId filter');

    const snapshot = await getDocs(q);
    const tasks = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Task));

    console.log('✅ [TASKS] Successfully fetched tasks:', tasks.length);
    return tasks;
  } catch (error) {
    console.error('❌ [TASKS] Error fetching tasks:', error);
    console.error('❌ [TASKS] Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    throw error;
  }
};

export const getTasks = getUserTasks;

export const getTasksByStatus = async (status?: string): Promise<Task[]> => {
  try {
    const tasks = await getUserTasks();
    if (!status) return tasks;
    return tasks.filter(task => task.status === status);
  } catch (error) {
    console.error('Error fetching tasks by status:', error);
    return [];
  }
};

export const createTask = async (task: Omit<Task, 'id' | 'createdAt'>): Promise<Task> => {
  const user = getCurrentUser();

  try {
    console.log('🔍 [TASKS] Create - Authentication check:', {
      user: user ? { uid: user.uid, email: user.email } : null,
      authenticated: !!user
    });

    if (!user) {
      console.error('❌ [TASKS] User not authenticated in createTask');
      throw new Error('User not authenticated');
    }

    console.log('📝 [TASKS] Creating task for user:', user.uid);
    console.log('📝 [TASKS] Task data:', task);

    const newTask = {
      ...task,
      userId: user.uid,
      createdAt: serverTimestamp(),
    };

    console.log('💾 [TASKS] Data being saved to Firestore:', newTask);
    console.log('📍 [TASKS] Target collection: tasks');

    const docRef = await addDoc(collection(db, 'tasks'), newTask);

    const docSnapshot = await getDoc(doc(db, 'tasks', docRef.id));
    if (docSnapshot.exists()) {
      const createdTask = { id: docSnapshot.id, ...docSnapshot.data() } as Task;
      console.log('✅ [TASKS] Successfully created task with ID:', docRef.id);

      await createTaskActivity(
        'New task created',
        `"${task.title}" was created`,
        docRef.id
      );

      return createdTask;
    } else {
      throw new Error('Failed to retrieve newly created task');
    }
  } catch (error) {
    console.error('❌ [TASKS] Error creating task:', error);
    console.error('❌ [TASKS] Firestore error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      name: error.name
    });

    if (error.code === 'permission-denied') {
      console.error('🚫 [TASKS] PERMISSION DENIED - Check Firestore security rules!');
      console.error('🚫 [TASKS] Current user:', user?.uid);
      console.error('🚫 [TASKS] Attempted collection: tasks');
    }

    throw error;
  }
};

export const addTask = createTask;

export const getTaskById = async (id: string): Promise<Task | null> => {
  try {
    const taskDoc = await getDoc(doc(db, 'tasks', id));
    if (taskDoc.exists()) {
      console.log('Successfully fetched task:', id);
      return { id: taskDoc.id, ...taskDoc.data() } as Task;
    } else {
      console.log('Task not found:', id);
      return null;
    }
  } catch (error) {
    console.error('Error fetching task:', error);
    throw error;
  }
};

export const updateTask = async (id: string, updates: Partial<Task>): Promise<Task> => {
  try {
    console.log('Updating task:', id, updates);
    const taskRef = doc(db, 'tasks', id);

    const originalTaskDoc = await getDoc(taskRef);
    const originalTask = originalTaskDoc.exists() ? originalTaskDoc.data() as Task : null;

    await updateDoc(taskRef, updates);

    const updatedTaskDoc = await getDoc(taskRef);
    if (updatedTaskDoc.exists()) {
      console.log('Successfully updated task:', id);
      const updatedTask = { id: updatedTaskDoc.id, ...updatedTaskDoc.data() } as Task;

      if (originalTask && updates.status && originalTask.status !== updates.status) {
        const statusLabels = {
          'todo': 'To-Do',
          'in-progress': 'In Progress',
          'completed': 'Completed'
        };

        await createTaskActivity(
          'Task status updated',
          `"${updatedTask.title}" moved to ${statusLabels[updates.status]}`,
          id
        );
      }

      return updatedTask;
    } else {
      throw new Error('Failed to retrieve updated task');
    }
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

export const deleteTask = async (id: string): Promise<void> => {
  try {
    console.log('Deleting task:', id);

    const taskRef = doc(db, 'tasks', id);
    const taskDoc = await getDoc(taskRef);
    const taskTitle = taskDoc.exists() ? taskDoc.data().title : 'Unknown task';

    await deleteDoc(taskRef);
    console.log('Successfully deleted task:', id);

    await createTaskActivity(
      'Task deleted',
      `"${taskTitle}" was deleted`,
      id
    );
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};
