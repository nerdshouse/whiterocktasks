import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, Timestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAvsR0zWKo0_bgEUpTh0NGULAPIHthpQKo',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'whiterock-crm-5b59c.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'whiterock-crm-5b59c',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'whiterock-crm-5b59c.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '533948349234',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:533948349234:web:380283becb003b6a5e352b',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

setPersistence(auth, browserLocalPersistence).catch(console.warn);

export { db, auth, app };

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
