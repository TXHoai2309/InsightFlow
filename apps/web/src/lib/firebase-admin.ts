// apps/web/src/lib/firebase-admin.ts
// Firebase Admin SDK - runs server-side only (Next.js Route Handlers)
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";

let adminAuthInstance: Auth | null = null;

export const adminAuth = new Proxy({} as Auth, {
  get(target, prop, receiver) {
    if (!adminAuthInstance) {
      const existingApp = getApps().find((app) => app.name === "[DEFAULT]");
      let app;
      if (existingApp) {
        app = existingApp;
      } else {
        const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
        if (!serviceAccountJson) {
          throw new Error(
            "[Firebase Admin] Missing FIREBASE_SERVICE_ACCOUNT_JSON environment variable."
          );
        }
        const serviceAccount = JSON.parse(serviceAccountJson);
        app = initializeApp({
          credential: cert(serviceAccount),
          projectId: serviceAccount.project_id,
        });
      }
      adminAuthInstance = getAuth(app);
    }
    const value = Reflect.get(adminAuthInstance, prop, receiver);
    return typeof value === "function" ? value.bind(adminAuthInstance) : value;
  },
});
