import { db } from '@/lib/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, getDocs, getDoc, query, orderBy, Timestamp } from 'firebase/firestore';
import { getCurrentUser } from '@/lib/auth';
import { Note, ChecklistItemData } from '@/types/notes';
import { createNoteActivity } from '@/services/activityService';

const convertFirestoreNote = (doc: any): Note => {
  const data = doc.data();
  return {
    id: doc.id,
    title: data.title,
    content: data.content,
    tags: data.tags || [],
    folderId: data.folderId,
    isFavorite: data.isFavorite || false,
    isEncrypted: data.isEncrypted || false,
    encryptedContent: data.encryptedContent,
    passwordHash: data.passwordHash,
    salt: data.salt,
    isLocked: data.isLocked || false,
    lockPasswordHash: data.lockPasswordHash,
    lockSalt: data.lockSalt,
    isChecklist: data.isChecklist || false,
    checklistItems: data.checklistItems || [],
    createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
  };
};

export const getNotes = async (): Promise<Note[]> => {
  try {
    const user = getCurrentUser();
    console.log('🔍 [NOTES] Checking authentication state:', {
      user: user ? { uid: user.uid, email: user.email } : null,
      authCurrentUser: !!user
    });

    if (!user) {
      console.error('❌ [NOTES] User not authenticated in getNotes');
      throw new Error('User not authenticated');
    }

    console.log('📥 [NOTES] Fetching notes for user:', user.uid);
    const notesRef = collection(db, 'users', user.uid, 'notes');
    console.log('📍 [NOTES] Collection path:', `users/${user.uid}/notes`);

    const q = query(notesRef, orderBy('updatedAt', 'desc'));

    const querySnapshot = await getDocs(q);
    const notes = querySnapshot.docs.map(convertFirestoreNote);
    console.log('✅ [NOTES] Successfully fetched notes:', notes.length);
    return notes;
  } catch (error) {
    console.error('❌ [NOTES] Error getting notes:', error);
    console.error('❌ [NOTES] Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    throw error;
  }
};

export const getNoteById = async (noteId: string): Promise<Note> => {
  try {
    const user = getCurrentUser();
    if (!user) {
      console.error('User not authenticated in getNoteById');
      throw new Error('User not authenticated');
    }

    const noteRef = doc(db, 'users', user.uid, 'notes', noteId);
    const noteDoc = await getDoc(noteRef);

    if (!noteDoc.exists()) {
      throw new Error('Note not found');
    }

    console.log('Successfully fetched note:', noteId);
    return convertFirestoreNote(noteDoc);
  } catch (error) {
    console.error('Error getting note:', error);
    throw error;
  }
};

export const createNote = async (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> => {
  const user = getCurrentUser();

  try {
    console.log('🔍 [NOTES] Create - Authentication check:', {
      user: user ? { uid: user.uid, email: user.email } : null,
      authenticated: !!user
    });

    if (!user) {
      console.error('❌ [NOTES] User not authenticated in createNote');
      throw new Error('User not authenticated');
    }

    console.log('📝 [NOTES] Creating note for user:', user.uid);
    console.log('📝 [NOTES] Note data:', noteData);

    const now = Timestamp.now();
    const notesRef = collection(db, 'users', user.uid, 'notes');
    console.log('📍 [NOTES] Target collection path:', `users/${user.uid}/notes`);

    const dataToSave = {
      ...noteData,
      createdAt: now,
      updatedAt: now,
      userId: user.uid
    };

    console.log('💾 [NOTES] Data being saved to Firestore:', dataToSave);

    const docRef = await addDoc(notesRef, dataToSave);

    console.log('✅ [NOTES] Successfully created note with ID:', docRef.id);

    await createNoteActivity(
      'New note created',
      `"${noteData.title}" was created`,
      docRef.id
    );

    return {
      id: docRef.id,
      ...noteData,
      createdAt: now.toDate().toISOString(),
      updatedAt: now.toDate().toISOString()
    };
  } catch (error) {
    console.error('❌ [NOTES] Error creating note:', error);
    console.error('❌ [NOTES] Firestore error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      name: error.name
    });

    if (error.code === 'permission-denied') {
      console.error('🚫 [NOTES] PERMISSION DENIED - Check Firestore security rules!');
      console.error('🚫 [NOTES] Current user:', user?.uid);
      console.error('🚫 [NOTES] Attempted path:', `users/${user?.uid}/notes`);
    }

    throw error;
  }
};

export const updateNote = async (noteId: string, noteData: Partial<Omit<Note, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> => {
  try {
    const user = getCurrentUser();
    if (!user) {
      console.error('User not authenticated in updateNote');
      throw new Error('User not authenticated');
    }

    console.log('Updating note:', noteId, noteData);
    const noteRef = doc(db, 'users', user.uid, 'notes', noteId);

    await updateDoc(noteRef, {
      ...noteData,
      updatedAt: Timestamp.now()
    });

    console.log('Successfully updated note:', noteId);

    if (noteData.title) {
      await createNoteActivity(
        'Note updated',
        `"${noteData.title}" was edited`,
        noteId
      );
    }
  } catch (error) {
    console.error('Error updating note:', error);
    throw error;
  }
};

export const deleteNote = async (noteId: string): Promise<void> => {
  try {
    const user = getCurrentUser();
    if (!user) {
      console.error('User not authenticated in deleteNote');
      throw new Error('User not authenticated');
    }

    const noteRef = doc(db, 'users', user.uid, 'notes', noteId);
    const noteDoc = await getDoc(noteRef);
    const noteTitle = noteDoc.exists() ? noteDoc.data().title : 'Unknown note';

    console.log('Deleting note:', noteId);
    await deleteDoc(noteRef);
    console.log('Successfully deleted note:', noteId);

    await createNoteActivity(
      'Note deleted',
      `"${noteTitle}" was deleted`,
      noteId
    );
  } catch (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
};

export const createChecklistNote = async (title: string, checklistItems: ChecklistItemData[]): Promise<Note> => {
  return createNote({
    title,
    content: '',
    isChecklist: true,
    checklistItems,
    tags: [],
    isFavorite: false,
    isEncrypted: false,
    isLocked: false
  });
};

export const updateChecklistItems = async (noteId: string, checklistItems: ChecklistItemData[]): Promise<void> => {
  return updateNote(noteId, {
    checklistItems,
    isChecklist: true
  });
};
