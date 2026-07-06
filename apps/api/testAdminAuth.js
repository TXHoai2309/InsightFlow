// apps/api/testAdminAuth.js
const fs = require("fs");
const path = require("path");
const { initializeApp, getApps, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

// Load .env.local
const p = path.join(__dirname, "..", "web", ".env.local");
if (fs.existsSync(p)) {
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
  console.log("Loaded environment variables from:", p);
} else {
  console.error("Could not find .env.local at:", p);
  process.exit(1);
}

const projectId = process.env.NEXT_PUBLIC_FIREBASE_SECOND_PROJECT_ID || "insightflow-6ce1f";
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

console.log("Project ID:", projectId);
console.log("Has Service Account JSON:", !!serviceAccountJson);

if (serviceAccountJson) {
  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    console.log("Successfully parsed service account JSON.");
    console.log("Service Account Project ID:", serviceAccount.project_id);
    console.log("Client Email:", serviceAccount.client_email);

    initializeApp({
      credential: cert(serviceAccount),
      projectId,
    });
    console.log("Firebase Admin initialized successfully.");
  } catch (e) {
    console.error("Failed to parse or initialize service account:", e.message);
    process.exit(1);
  }
} else {
  console.error("FIREBASE_SERVICE_ACCOUNT_JSON is missing from environment variables.");
  process.exit(1);
}

async function testReset() {
  try {
    const email = "toxuanhoai2309123@gmail.com";
    console.log(`Generating password reset link for email: ${email}...`);
    const link = await getAuth().generatePasswordResetLink(email);
    console.log("SUCCESS! Generated link:", link);
  } catch (err) {
    console.error("ERROR generating link:", err.code, err.message);
  }
  process.exit(0);
}

testReset();
