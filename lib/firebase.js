// lib/firebase.js
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";

// Firebase config will come from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const isBrowser = typeof window !== "undefined";

// Avoid re-initializing the app in dev; only initialize in the browser.
const app = isBrowser
  ? !getApps().length
    ? initializeApp(firebaseConfig)
    : getApps()[0]
  : null;

export const db = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app) : null;
export const auth = app ? getAuth(app) : null;
export const functions = app ? getFunctions(app) : null;

// Ensure auth can persist in the browser (prevents session loss in stricter contexts)
if (auth) {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.error("Auth persistence error:", err);
  });
}
