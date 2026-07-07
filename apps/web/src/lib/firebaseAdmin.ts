import fs from "fs";
import path from "path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const ADMIN_APP_NAME = "insightflow-web-admin";

function findServiceAccountPath() {
  const candidates = [
    path.join(process.cwd(), "service-account.json"),
    path.join(process.cwd(), "..", "api", "service-account.json"),
    path.join(process.cwd(), "apps", "api", "service-account.json"),
  ];

  return candidates.find((candidate) => fs.existsSync(candidate));
}

function getAdminApp() {
  const existing = getApps().find((app) => app.name === ADMIN_APP_NAME);
  if (existing) return existing;

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "insightflow-6ce1f";
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (serviceAccountJson) {
    const serviceAccount = JSON.parse(serviceAccountJson);
    return initializeApp(
      {
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id || projectId,
      },
      ADMIN_APP_NAME,
    );
  }

  const serviceAccountPath = findServiceAccountPath();
  if (serviceAccountPath) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
    return initializeApp(
      {
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id || projectId,
      },
      ADMIN_APP_NAME,
    );
  }

  return initializeApp({ projectId }, ADMIN_APP_NAME);
}

const adminApp = getAdminApp();

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
