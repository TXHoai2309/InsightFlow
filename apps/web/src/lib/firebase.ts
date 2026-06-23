import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// Firebase project 1: Auth + user management (insightflow-6ce1f)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Kiểm tra nếu thiếu API Key để báo lỗi rõ ràng hơn
if (!firebaseConfig.apiKey) {
  console.error("Firebase API Key is missing. Check your .env.local file.");
}

const app = getApps().find((a) => a.name === "[DEFAULT]") ?? initializeApp(firebaseConfig);

export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();

// Firebase project 2: Crawled data storage (datainsight-330eb)
const secondFirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_SECOND_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_SECOND_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_SECOND_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_SECOND_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_SECOND_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_SECOND_APP_ID,
};

const secondApp = getApps().find((a) => a.name === "datainsight" || a.name === "second" || a.name === "secondApp") ??
  (secondFirebaseConfig.apiKey ? initializeApp(secondFirebaseConfig, "datainsight") : null);

export const dbSecond = (secondApp ? getFirestore(secondApp) : null) as Firestore;
export const dbData = dbSecond;
export const secondDb = dbSecond;
