const path = require("path");
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

const serviceAccount = require(path.join(__dirname, "..", "service-account.json"));

if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
}

const auth = getAuth();
const db = getFirestore();

const password = "Test@123456";

const users = [
  {
    email: "demo.admin@insightflow.com",
    displayName: "InsightFlow Admin",
    role: "admin",
    companyDomain: "insightflow.com",
    defaultRoute: "/admin",
    permissions: [
      "admin_panel",
      "admin_user_management",
      "admin_label_review",
      "admin_crawler_health",
      "admin_audit",
    ],
  },
  {
    email: "manager@highlandscoffee.com",
    displayName: "Highlands Brand Manager",
    role: "brand_manager",
    brandId: "highlands-coffee",
    brandName: "Highlands Coffee",
    companyDomain: "highlandscoffee.com",
    defaultRoute: "/dashboard",
    permissions: [
      "dashboard",
      "mentions",
      "alerts",
      "leads",
      "reports",
      "staff_management",
      "brand_settings",
      "label_request_review",
      "response_settings",
    ],
  },
  {
    email: "nguyen_van_crisis@highlandscoffee.com",
    displayName: "Nguyen Van Crisis",
    role: "crisis_employee",
    brandId: "highlands-coffee",
    brandName: "Highlands Coffee",
    companyDomain: "highlandscoffee.com",
    defaultRoute: "/alerts",
    permissions: ["dashboard", "mentions", "alerts", "reports", "label_request_create"],
  },
  {
    email: "tran_thi_lead@highlandscoffee.com",
    displayName: "Tran Thi Lead",
    role: "lead_employee",
    brandId: "highlands-coffee",
    brandName: "Highlands Coffee",
    companyDomain: "highlandscoffee.com",
    defaultRoute: "/leads",
    permissions: ["dashboard", "mentions", "leads", "reports"],
  },
];

async function upsertUser(userConfig) {
  let firebaseUser;

  try {
    firebaseUser = await auth.getUserByEmail(userConfig.email);
    await auth.updateUser(firebaseUser.uid, {
      password,
      displayName: userConfig.displayName,
      emailVerified: true,
      disabled: false,
    });
  } catch (error) {
    if (error.code !== "auth/user-not-found") {
      throw error;
    }

    firebaseUser = await auth.createUser({
      email: userConfig.email,
      password,
      displayName: userConfig.displayName,
      emailVerified: true,
      disabled: false,
    });
  }

  await db.collection("users").doc(firebaseUser.uid).set(
    {
      uid: firebaseUser.uid,
      email: userConfig.email,
      displayName: userConfig.displayName,
      photoURL: "",
      role: userConfig.role,
      brandId: userConfig.brandId || null,
      brandName: userConfig.brandName || null,
      companyDomain: userConfig.companyDomain,
      permissions: userConfig.permissions,
      defaultRoute: userConfig.defaultRoute,
      updatedAt: FieldValue.serverTimestamp(),
      seededForTesting: true,
    },
    { merge: true },
  );

  return { ...userConfig, uid: firebaseUser.uid };
}

async function main() {
  console.log(`Seeding ${users.length} test users into Firebase project ${serviceAccount.project_id}...`);
  const results = [];

  for (const userConfig of users) {
    const result = await upsertUser(userConfig);
    results.push(result);
    console.log(`OK ${result.role}: ${result.email} (${result.uid})`);
  }

  console.log("\nTest credentials:");
  for (const result of results) {
    console.log(`${result.role.padEnd(13)} ${result.email.padEnd(38)} ${password} -> ${result.defaultRoute}`);
  }
}

main().catch((error) => {
  console.error("Failed to seed test users:", error);
  process.exitCode = 1;
});
