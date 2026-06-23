// apps/api/src/services/firebase.ts
import fs from "fs";
import path from "path";
import { initializeApp, getApps, cert, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Attempt to load .env.local
const possiblePaths = [
  path.join(process.cwd(), ".env.local"),
  path.join(process.cwd(), "..", "..", ".env.local"),
  path.join(process.cwd(), "..", "web", ".env.local"),
];

for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    try {
      const content = fs.readFileSync(p, "utf8");
      content.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
          const parts = trimmed.split("=");
          const key = parts[0].trim();
          const val = parts.slice(1).join("=").trim();
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      });
      console.log(`[Firebase Admin] Loaded environment variables from: ${p}`);
      break;
    } catch (err: any) {
      console.warn(`Failed to read env file at ${p}:`, err.message);
    }
  }
}

const projectId = process.env.NEXT_PUBLIC_FIREBASE_SECOND_PROJECT_ID || "datainsight-330eb";

if (getApps().length === 0) {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (serviceAccountJson) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      initializeApp({
        credential: cert(serviceAccount),
        projectId,
      });
      console.log(`[Firebase Admin] Initialized with service account for project: ${projectId}`);
    } catch (e: any) {
      console.error("[Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON, falling back:", e.message);
      initializeApp({ projectId });
    }
  } else {
    try {
      // Attempt default credentials or emulator connection
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
export default getApps()[0];
