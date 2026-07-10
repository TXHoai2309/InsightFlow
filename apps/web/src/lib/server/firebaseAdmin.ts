import fs from "fs";
import path from "path";
import { initializeApp, getApps, cert, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const SERVICE_ACCOUNT_PATHS = [
  path.join(process.cwd(), "service-account.json"),
  path.join(process.cwd(), "..", "api", "service-account.json"),
];

const possiblePaths = [
  path.join(process.cwd(), ".env.local"),
  path.join(process.cwd(), "..", "..", ".env.local"),
  path.join(process.cwd(), "..", "api", ".env.local"),
];

for (const envPath of possiblePaths) {
  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, "utf8");
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
    } catch {
      // ignore env parse errors
    }
  }
}

const primaryProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "insightflow-6ce1f";
const secondaryProjectId = process.env.NEXT_PUBLIC_FIREBASE_SECOND_PROJECT_ID || "datainsight-330eb";

function loadServiceAccountFromFile(): Record<string, unknown> | null {
  for (const accountPath of SERVICE_ACCOUNT_PATHS) {
    if (!fs.existsSync(accountPath)) continue;
    try {
      const raw = fs.readFileSync(accountPath, "utf8");
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        return require(accountPath) as Record<string, unknown>;
      } catch {
        // try next path
      }
    }
  }
  return null;
}

function initFirebaseAdmin() {
  if (getApps().length > 0) return;

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (serviceAccountJson) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      const projId1 = serviceAccount.project_id || primaryProjectId;
      initializeApp({ credential: cert(serviceAccount), projectId: projId1 });
      initializeApp({ credential: cert(serviceAccount), projectId: secondaryProjectId }, "datainsight");
      return;
    } catch {
      // fall through
    }
  }

  const serviceAccount = loadServiceAccountFromFile();
  if (serviceAccount) {
    try {
      const projId1 = (serviceAccount.project_id as string) || primaryProjectId;
      initializeApp({ credential: cert(serviceAccount), projectId: projId1 });
      initializeApp({ credential: cert(serviceAccount), projectId: secondaryProjectId }, "datainsight");
      return;
    } catch {
      // fall through
    }
  }

  try {
    initializeApp({ projectId: primaryProjectId });
    initializeApp({ projectId: secondaryProjectId }, "datainsight");
  } catch {
    try {
      initializeApp({ credential: applicationDefault(), projectId: primaryProjectId });
      initializeApp({ credential: applicationDefault(), projectId: secondaryProjectId }, "datainsight");
    } catch {
      // last resort
    }
  }
}

initFirebaseAdmin();

let dbInstance: any = null;
export const db = new Proxy({} as any, {
  get(target, prop, receiver) {
    if (!dbInstance) {
      const defaultApp = getApps().find((app) => app.name === "[DEFAULT]");
      dbInstance = defaultApp ? getFirestore(defaultApp) : getFirestore();
    }
    const value = Reflect.get(dbInstance, prop, receiver);
    return typeof value === "function" ? value.bind(dbInstance) : value;
  }
});

let dbDataInstance: any = null;
export const dbData = new Proxy({} as any, {
  get(target, prop, receiver) {
    if (!dbDataInstance) {
      const defaultApp = getApps().find((app) => app.name === "[DEFAULT]");
      const secondApp = getApps().find((app) => app.name === "datainsight") || defaultApp;
      dbDataInstance = secondApp ? getFirestore(secondApp) : getFirestore();
    }
    const value = Reflect.get(dbDataInstance, prop, receiver);
    return typeof value === "function" ? value.bind(dbDataInstance) : value;
  }
});

let authAdminInstance: any = null;
export const authAdmin = new Proxy({} as any, {
  get(target, prop, receiver) {
    if (!authAdminInstance) {
      const defaultApp = getApps().find((app) => app.name === "[DEFAULT]");
      authAdminInstance = defaultApp ? getAuth(defaultApp) : getAuth();
    }
    const value = Reflect.get(authAdminInstance, prop, receiver);
    return typeof value === "function" ? value.bind(authAdminInstance) : value;
  }
});
