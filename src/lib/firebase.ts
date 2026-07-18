import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, Auth, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, Firestore, collection, doc, addDoc, getDocs, deleteDoc, query, where, orderBy, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { DebateMessage, StrategyReport } from '../types';

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

// Inherent model for saved debates
export interface SavedDebate {
  id: string;
  userId: string;
  idea: string;
  messages: DebateMessage[];
  report: StrategyReport;
  createdAt: number;
}

// Inherent mock model for active user profile
export interface BoardUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  isMock: boolean;
}

// Check if Firebase configuration is fully supplied
export const isFirebaseConfigured = !!(
  firebaseConfig &&
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== ''
);

// Fetch app-id dynamically from environment variables or custom fallbacks
const appId = (window as any).__app_id || 'IdeaCaprice-boardroom-app';

let firebaseApp;
let appAuth: Auth | null = null;
let appDb: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    appAuth = getAuth(firebaseApp);
    appDb = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

    // Validate connection to Firestore on initial boot
    const testConnection = async () => {
      try {
        if (appDb) {
          // Point test query to authorized public sandbox directory
          await getDocs(collection(appDb, 'artifacts', appId, 'public', 'data', 'connection_test'));
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration: client is offline.");
        }
      }
    };
    testConnection();
  } catch (error) {
    console.error('Failed to initialize real Firebase services:', error);
  }
}

export const auth = appAuth;
export const db = appDb;

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const currentAuthUser = auth?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentAuthUser?.uid || 'guest-active',
      email: currentAuthUser?.email || null,
      emailVerified: currentAuthUser?.emailVerified || false,
      isAnonymous: currentAuthUser?.isAnonymous || false,
      tenantId: currentAuthUser?.tenantId || null,
      providerInfo: currentAuthUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error Info: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Save user debate session (supports both real Firestore and LocalStorage fallback)
 */
export async function saveDebateSession(
  user: BoardUser,
  idea: string,
  messages: DebateMessage[],
  report: StrategyReport
): Promise<SavedDebate> {
  const newDebate: SavedDebate = {
    id: `deb-${Math.random().toString(36).substring(2, 11)}`,
    userId: user.uid,
    idea,
    messages,
    report,
    createdAt: Date.now(),
  };

  const activeUid = auth?.currentUser?.uid || (user.isMock ? null : user.uid);

  if (isFirebaseConfigured && db && activeUid) {
    // ⚠️ STICKY RULES: Must read/write inside the secure user sandbox directory
    const securePath = `artifacts/${appId}/users/${activeUid}/debates`;
    try {
      const secureCollection = collection(db, 'artifacts', appId, 'users', activeUid, 'debates');
      await addDoc(secureCollection, newDebate);
      return newDebate;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `${securePath}/${newDebate.id}`);
    }
  } else {
    // Falls back seamlessly to LocalStorage
    const localSessions = getLocalStorageDebates();
    localSessions.push(newDebate);
    localStorage.setItem('IdeaCaprice_debates', JSON.stringify(localSessions));
    return newDebate;
  }
}

/**
 * Retrieve saved debate sessions
 */
export async function getDebateSessions(user: BoardUser): Promise<SavedDebate[]> {
  const activeUid = auth?.currentUser?.uid || (user.isMock ? null : user.uid);

  if (isFirebaseConfigured && db && activeUid) {
    const securePath = `artifacts/${appId}/users/${activeUid}/debates`;
    try {
      const debatesRef = collection(db, 'artifacts', appId, 'users', activeUid, 'debates');
      // Simplified query (Rule 2: Fetch all matching sandbox items, then sort in JS memory)
      const snapshot = await getDocs(debatesRef);
      const debates: SavedDebate[] = [];
      snapshot.forEach((doc) => {
        debates.push(doc.data() as SavedDebate);
      });
      // Sort descending by createdAt in local memory
      return debates.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, securePath);
    }
  } else {
    const local = getLocalStorageDebates();
    // Filter by local user profile representation
    return local
      .filter((d) => d.userId === user.uid)
      .sort((a, b) => b.createdAt - a.createdAt);
  }
}

/**
 * Delete a saved debate session
 */
export async function deleteDebateSession(debateId: string, user: BoardUser): Promise<void> {
  const activeUid = auth?.currentUser?.uid || (user.isMock ? null : user.uid);

  if (isFirebaseConfigured && db && activeUid) {
    const securePath = `artifacts/${appId}/users/${activeUid}/debates`;
    try {
      const debatesRef = collection(db, 'artifacts', appId, 'users', activeUid, 'debates');
      const q = query(debatesRef, where('id', '==', debateId));
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(document => 
        deleteDoc(doc(db, 'artifacts', appId, 'users', activeUid, 'debates', document.id))
      );
      await Promise.all(deletePromises);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${securePath}/${debateId}`);
    }
  } else {
    const local = getLocalStorageDebates();
    const updated = local.filter((d) => !(d.id === debateId && d.userId === user.uid));
    localStorage.setItem('IdeaCaprice_debates', JSON.stringify(updated));
  }
}

// Helpers for Local Storage
function getLocalStorageDebates(): SavedDebate[] {
  const raw = localStorage.getItem('IdeaCaprice_debates');
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}