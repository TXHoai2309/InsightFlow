// apps/api/src/services/firebase.ts
import fs from "fs";
import path from "path";
import { initializeApp, getApps, cert, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const SERVICE_ACCOUNT_PATH = path.join(process.cwd(), "service-account.json");
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_SECOND_PROJECT_ID || "insightflow-6ce1f";

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
      break;
    } catch (err: any) {
      console.warn(`Failed to read env file at ${p}:`, err.message);
    }
  }
}

if (getApps().length === 0) {
  if (fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    try {
      const serviceAccount = require(SERVICE_ACCOUNT_PATH);
      initializeApp({
        credential: cert(serviceAccount),
        projectId: PROJECT_ID,
      });
      console.log(`[Firebase Admin] Initialized with service-account.json for project: ${PROJECT_ID}`);
    } catch (e: any) {
      console.error("[Firebase Admin] Failed to load service-account.json:", e.message);
      initializeApp({ projectId: PROJECT_ID });
    }
  } else {
    console.warn("[Firebase Admin] service-account.json not found. Attempting basic initialization...");
    try {
      initializeApp({ projectId: PROJECT_ID });
      console.log(`[Firebase Admin] Initialized with project ID: ${PROJECT_ID}`);
    } catch (err: any) {
      console.error("[Firebase Admin] Critical: Initialization failed.", err.message);
    }
  }
}

export const db = getFirestore();
export const authAdmin = getAuth();
export default getApps()[0];
