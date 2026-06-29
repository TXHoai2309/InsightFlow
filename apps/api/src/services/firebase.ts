// apps/api/src/services/firebase.ts
import fs from "fs";
import path from "path";
import { initializeApp, getApps, cert, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const SERVICE_ACCOUNT_PATH = path.join(process.cwd(), "service-account.json");
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_SECOND_PROJECT_ID || "datainsight-330eb";

// Attempt to load .env.local for other variables
const possiblePaths = [
  path.join(process.cwd(), ".env.local"),
  path.join(process.cwd(), "..", "..", ".env.local"),
  path.join(process.cwd(), "..", "web", ".env.local"),
];

for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    try {
      const content = fs.readFileSync(p, "utf8");
      const regex = /^([A-Z0-9_]+)=(['"]([\s\S]*?)['"]|([^\n\r]*))/gm;
      let match;
      while ((match = regex.exec(content)) !== null) {
        const key = match[1];
        const value = match[3] || match[4];
        if (value !== undefined && !process.env[key]) {
          process.env[key] = value.trim();
        }
      }
      console.log(`[Firebase Admin] Loaded environment variables from: ${p}`);
      break;
    } catch (err: any) {
      console.warn(`Failed to read env file at ${p}:`, err.message);
    }
  }
}

// Re-evaluate PROJECT_ID after loading env
const primaryProjectId = "insightflow-6ce1f";
const secondaryProjectId = process.env.NEXT_PUBLIC_FIREBASE_SECOND_PROJECT_ID || PROJECT_ID;

if (getApps().length === 0) {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (serviceAccountJson) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      const projId1 = serviceAccount.project_id || primaryProjectId;
      
      // Default app (Project 1) for Auth
      initializeApp({
        credential: cert(serviceAccount),
        projectId: projId1,
      });

      // Named app (Project 2) for Firestore
      initializeApp({
        credential: cert(serviceAccount),
        projectId: secondaryProjectId,
      }, "datainsight");

      console.log(`[Firebase Admin] Initialized default (Auth) for: ${projId1} and named (Firestore) for: ${secondaryProjectId}`);
    } catch (e: any) {
      console.error("[Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:", e.message);
      initializeApp({ projectId: primaryProjectId });
      initializeApp({ projectId: secondaryProjectId }, "datainsight");
    }
  } else if (fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    try {
      const serviceAccount = require(SERVICE_ACCOUNT_PATH);
      const projId1 = serviceAccount.project_id || primaryProjectId;

      // Default app (Project 1) for Auth
      initializeApp({
        credential: cert(serviceAccount),
        projectId: projId1,
      });

      // Named app (Project 2) for Firestore
      initializeApp({
        credential: cert(serviceAccount),
        projectId: secondaryProjectId,
      }, "datainsight");

      console.log(`[Firebase Admin] Initialized default (Auth) for: ${projId1} and named (Firestore) for: ${secondaryProjectId}`);
    } catch (e: any) {
      console.error("[Firebase Admin] Failed to load service-account.json:", e.message);
      initializeApp({ projectId: primaryProjectId });
      initializeApp({ projectId: secondaryProjectId }, "datainsight");
    }
  } else {
    console.warn("[Firebase Admin] No service account credentials found. Attempting basic/emulator initialization...");
    try {
      initializeApp({
        projectId: primaryProjectId,
      });
      initializeApp({
        projectId: secondaryProjectId,
      }, "datainsight");
    } catch (e: any) {
      console.warn("[Firebase Admin] Failed basic initialization, attempting applicationDefault:", e.message);
      try {
        initializeApp({
          credential: applicationDefault(),
          projectId: primaryProjectId,
        });
        initializeApp({
          credential: applicationDefault(),
          projectId: secondaryProjectId,
        }, "datainsight");
      } catch (err: any) {
        console.error("[Firebase Admin] Critical: All initialization attempts failed.", err.message);
      }
    }
  }
}

// Get the apps
const defaultApp = getApps().find(app => app.name === "[DEFAULT]");
const secondApp = getApps().find(app => app.name === "datainsight") || defaultApp;

export const db = secondApp ? getFirestore(secondApp) : getFirestore();
export const authAdmin = defaultApp ? getAuth(defaultApp) : getAuth();
export default defaultApp;
