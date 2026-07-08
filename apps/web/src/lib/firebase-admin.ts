// apps/web/src/lib/firebase-admin.ts
// Firebase Admin SDK - runs server-side only (Next.js Route Handlers)
import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";

let adminAuth: Auth;

function getAdminApp(): App {
  const existingApp = getApps().find((app) => app.name === "[DEFAULT]");
  if (existingApp) return existingApp;

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountJson) {
    throw new Error(
      "[Firebase Admin] Missing FIREBASE_SERVICE_ACCOUNT_JSON environment variable."
    );
  }

  const serviceAccount = JSON.parse(serviceAccountJson);

  return initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
}

try {
  const app = getAdminApp();
  adminAuth = getAuth(app);
} catch (e: any) {
  console.error("[Firebase Admin] Initialization failed:", e.message);
  throw e;
}

export { adminAuth };
