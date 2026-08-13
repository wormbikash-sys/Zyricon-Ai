import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  browserLocalPersistence,
  inMemoryPersistence,
  setPersistence,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
} from 'firebase/auth';
import { getDatabase, ref, get, set, update, push, remove, onValue } from 'firebase/database';
import firebaseConfig from '../../firebase-applet-config.json';

const databaseURL = (firebaseConfig as any).databaseURL || `https://${firebaseConfig.projectId}-default-rtdb.firebaseio.com`;

const app = initializeApp({
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId,
  databaseURL: databaseURL,
});

export const auth = getAuth(app);

// Safe persistence setting with inMemoryPersistence fallback for iframe/IndexedDB constraints
setPersistence(auth, browserLocalPersistence).catch(() => {
  return setPersistence(auth, inMemoryPersistence).catch(() => {});
});

export const googleProvider = new GoogleAuthProvider();
export const rtdb = getDatabase(app);

export {
  ref,
  get,
  set,
  update,
  push,
  remove,
  onValue,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
};

export default app;

