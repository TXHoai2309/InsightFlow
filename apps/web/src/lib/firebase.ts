import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";
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