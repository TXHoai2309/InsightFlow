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
const projectId = process.env.NEXT_PUBLIC_FIREBASE_SECOND_PROJECT_ID || PROJECT_ID;

if (getApps().length === 0) {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (serviceAccountJson) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      initializeApp({
        credential: cert(serviceAccount),
        projectId,
      });
      console.log(`[Firebase Admin] Initialized with FIREBASE_SERVICE_ACCOUNT_JSON env for project: ${projectId}`);
    } catch (e: any) {
      console.error("[Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:", e.message);
      initializeApp({ projectId });
    }
  } else if (fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    try {
      const serviceAccount = require(SERVICE_ACCOUNT_PATH);
      initializeApp({
        credential: cert(serviceAccount),
        projectId,
      });
      console.log(`[Firebase Admin] Initialized with service-account.json file for project: ${projectId}`);
    } catch (e: any) {
      console.error("[Firebase Admin] Failed to load service-account.json:", e.message);
      initializeApp({ projectId });
    }
  } else {
    console.warn("[Firebase Admin] No service account credentials found. Attempting basic/emulator initialization...");
    try {
      initializeApp({
        projectId,
      });
      console.log(`[Firebase Admin] Initialized with project ID: ${projectId}`);
    } catch (e: any) {
      console.warn("[Firebase Admin] Failed basic initialization, attempting applicationDefault:", e.message);
      try {
        initializeApp({
          credential: applicationDefault(),
          projectId,
        });
      } catch (err: any) {
        console.error("[Firebase Admin] Critical: All initialization attempts failed.", err.message);
      }
    }
  }
}

export const db = getFirestore();
export const authAdmin = getAuth();
export default getApps()[0];
