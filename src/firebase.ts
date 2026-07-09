import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

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
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Add RSVP
export async function addRsvp(rsvpData: {
  guestName: string;
  attending: boolean;
  dietary: string;
  guestsCount: number;
  message: string;
}) {
  const path = 'rsvps';
  try {
    const docRef = await addDoc(collection(db, path), {
      ...rsvpData,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Get RSVPs
export async function getRsvps() {
  const path = 'rsvps';
  try {
    const snapshot = await getDocs(collection(db, path));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// Delete RSVP
export async function deleteRsvp(rsvpId: string) {
  const path = `rsvps/${rsvpId}`;
  try {
    await deleteDoc(doc(db, 'rsvps', rsvpId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Add Photo
export async function addPhoto(photoData: {
  guestName: string;
  photoUrl: string;
  caption: string;
}) {
  const path = 'photos';
  try {
    const docRef = await addDoc(collection(db, path), {
      ...photoData,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Subscribe to Photos
export function subscribeToPhotos(onUpdate: (photos: any[]) => void, onError?: (error: any) => void) {
  const path = 'photos';
  return onSnapshot(collection(db, path), (snapshot) => {
    const photos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    // Sort by createdAt descending
    photos.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    onUpdate(photos);
  }, (error) => {
    if (onError) {
      onError(error);
    } else {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  });
}

// Delete Photo
export async function deletePhoto(photoId: string) {
  const path = `photos/${photoId}`;
  try {
    await deleteDoc(doc(db, 'photos', photoId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
