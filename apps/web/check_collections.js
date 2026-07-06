const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs, limit, query } = require("firebase/firestore");
const fs = require("fs");

const envVars = fs.readFileSync(".env.local", "utf8").split("\n").reduce((acc, line) => {
  const [key, ...value] = line.split("=");
  if (key && !key.trim().startsWith("#")) {
    acc[key.trim()] = value.join("=").trim();
  }
  return acc;
}, {});

const config1 = {
  apiKey: envVars.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: envVars.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: envVars.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: envVars.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: envVars.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: envVars.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const config2 = {
  apiKey: envVars.NEXT_PUBLIC_FIREBASE_SECOND_API_KEY,
  authDomain: envVars.NEXT_PUBLIC_FIREBASE_SECOND_AUTH_DOMAIN,
  projectId: envVars.NEXT_PUBLIC_FIREBASE_SECOND_PROJECT_ID,
  storageBucket: envVars.NEXT_PUBLIC_FIREBASE_SECOND_STORAGE_BUCKET,
  messagingSenderId: envVars.NEXT_PUBLIC_FIREBASE_SECOND_MESSAGING_SENDER_ID,
  appId: envVars.NEXT_PUBLIC_FIREBASE_SECOND_APP_ID,
};

async function testConfig(config, label) {
  console.log(`\n=== Testing ${label} (Project: ${config.projectId}) ===`);
  try {
    const app = initializeApp(config, label);
    const db = getFirestore(app);
    const collections = ["insightflow_labels", "alerts", "leads", "users"];
    for (const coll of collections) {
      try {
        const snap = await getDocs(query(collection(db, coll), limit(3)));
        console.log(`  Collection '${coll}': ${snap.size} docs`);
        if (snap.size > 0) {
          console.log(`    Sample:`, JSON.stringify(snap.docs[0].data()).slice(0, 150));
        }
      } catch (e) {
        console.log(`  Failed '${coll}':`, e.message);
      }
    }
  } catch (e) {
    console.error(`Failed ${label}:`, e.message);
  }
}

async function main() {
  await testConfig(config1, "FIRST_DB");
  await testConfig(config2, "SECOND_DB");
}

main();
