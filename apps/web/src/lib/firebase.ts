import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);

// Thiết lập duy trì phiên đăng nhập cục bộ (duy trì ngay cả khi đóng trình duyệt)
setPersistence(auth, browserLocalPersistence);

export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();

// Initialize the second Firebase project (DataInsight) containing the actual crawled data
const firebaseSecondConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_SECOND_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_SECOND_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_SECOND_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_SECOND_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_SECOND_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_SECOND_APP_ID,
};

const secondApp = getApps().find(a => a.name === "second") || 
  (firebaseSecondConfig.apiKey ? initializeApp(firebaseSecondConfig, "second") : null);

export const dbSecond = secondApp ? getFirestore(secondApp) : null;