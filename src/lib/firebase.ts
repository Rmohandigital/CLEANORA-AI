import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  setDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// CRITICAL: Initialize Firestore with database ID specified in config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Error Handling Infrastructure mandated by Firebase Integration Skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Google Sign-In with Firebase Auth
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(
        userRef,
        {
          userId: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'Creator',
          photoURL: user.photoURL || '',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      ).catch((err) => {
        console.warn('Firestore user profile sync warning:', err);
      });
    }
    return user;
  } catch (error: any) {
    console.error('Google Sign-in failed:', error);
    throw error;
  }
}

// Sign out
export async function logOutFirebase() {
  await signOut(auth);
}

// Save generation item to Firestore
export interface StoredGeneration {
  id: string;
  userId: string;
  type: 'text-to-video' | 'image-to-video' | 'image-create' | 'image-edit' | 'audio-transcribe' | 'music-generate';
  prompt: string;
  model: string;
  mediaUrl?: string;
  aspectRatio?: string;
  resultData?: string;
  createdAt: string;
}

export async function saveGenerationToFirestore(item: StoredGeneration) {
  if (!auth.currentUser) return;
  const path = `users/${auth.currentUser.uid}/generations/${item.id}`;
  try {
    const ref = doc(db, 'users', auth.currentUser.uid, 'generations', item.id);
    await setDoc(ref, {
      ...item,
      userId: auth.currentUser.uid,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Fetch user generations
export async function fetchUserGenerations(userId: string): Promise<StoredGeneration[]> {
  const path = `users/${userId}/generations`;
  try {
    const q = query(collection(db, 'users', userId, 'generations'), orderBy('createdAt', 'desc'), limit(50));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => docSnap.data() as StoredGeneration);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// Delete generation
export async function deleteGenerationFromFirestore(userId: string, generationId: string) {
  const path = `users/${userId}/generations/${generationId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'generations', generationId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Connection test on boot
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase connection check: Client currently offline.');
    }
  }
}

testFirestoreConnection();
