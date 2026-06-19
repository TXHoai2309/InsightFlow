import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase project 1: Auth + user management (insightflow-6ce1f)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const secondFirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_SECOND_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_SECOND_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_SECOND_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_SECOND_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_SECOND_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_SECOND_APP_ID,
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

// Firebase project 2: Crawled data storage (datainsight-330eb)
const dataInsightConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_SECOND_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_SECOND_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_SECOND_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_SECOND_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_SECOND_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_SECOND_APP_ID,
};

const dataInsightApp =
  getApps().find((a) => a.name === "datainsight") ??
  initializeApp(dataInsightConfig, "datainsight");

/** Firestore instance for the data/crawl project (mentions_nlp_demo, etc.) */
export const dbData = getFirestore(dataInsightApp);

export const facebookProvider = new FacebookAuthProvider();

export const secondApp = getApps().find(a => a.name === "secondApp") || initializeApp(secondFirebaseConfig, "secondApp");
export const secondDb = getFirestore(secondApp);