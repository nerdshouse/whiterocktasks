import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, Timestamp } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCCM8CQ37vTZeD53TpgdJXVpW2aGWaG4ck',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'whiterock-tasks.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'whiterock-tasks',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'whiterock-tasks.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '472115769335',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:472115769335:web:4dbef707474d99d4d8c8f2',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-5GD001TYV0',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

setPersistence(auth, browserLocalPersistence).catch(console.warn);

// Analytics only in supported browser environments
let analytics: ReturnType<typeof getAnalytics> | null = null;
isSupported().then((yes) => {
  if (yes) analytics = getAnalytics(app);
});

export { db, auth, app, storage, analytics };

export const timestampToISO = (t: any): string => {
  if (t?.toDate) return t.toDate().toISOString();
  if (t instanceof Date) return t.toISOString();
  return t || new Date().toISOString();
};

export const isoToTimestamp = (iso: string) => Timestamp.fromDate(new Date(iso));

export const COLLECTIONS = {
  TASKS: 'tasks',
  USERS: 'tasks_users',
  HOLIDAYS: 'holidays',
  ABSENCES: 'absences',
  REMOVAL_REQUESTS: 'removal_requests',
};
