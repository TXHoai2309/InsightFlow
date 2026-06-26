const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs, limit, query } = require("firebase/firestore");
const fs = require("fs");

const envVars = fs.readFileSync(".env.local", "utf8").split("\n").reduce((acc, line) => {
  const [key, ...value] = line.split("=");
  if (key && !key.trim().startsWith("#")) {
    const k = key.trim();
    const v = value.join("=").trim();
    if (!acc[k]) {
      acc[k] = [];
    }
    acc[k].push(v);
  }
  return acc;
}, {});

const secondApiKeys = envVars.NEXT_PUBLIC_FIREBASE_SECOND_API_KEY || [];
const firstApiKeys = envVars.NEXT_PUBLIC_FIREBASE_API_KEY || [];

const runQuery = async (config, label) => {
  console.log(`\n--- Testing Config: ${label} ---`);
  console.log("Project:", config.projectId);
  console.log("API Key:", config.apiKey);
  try {
    const app = initializeApp(config, label);
    const db = getFirestore(app);
    const collectionsToTry = ["mentions_nlp_demo", "alerts_demo", "alerts", "leads", "comments", "mentions"];
    
    for (const coll of collectionsToTry) {
      try {
        const snap = await getDocs(query(collection(db, coll), limit(5)));
        console.log(`  Collection '${coll}': ${snap.size} docs`);
        if (snap.size > 0) {
          console.log(`    Sample doc from '${coll}':`, JSON.stringify(snap.docs[0].data(), null, 2));
        }
      } catch (err) {
        console.log(`  Failed to query '${coll}':`, err.message);
      }
    }
  } catch (err) {
    console.error(`Failed to initialize ${label}:`, err.message);
  }
};

async function main() {
  if (secondApiKeys.length > 0) {
    const config2_1 = {
      apiKey: secondApiKeys[0],
      authDomain: envVars.NEXT_PUBLIC_FIREBASE_SECOND_AUTH_DOMAIN?.[0],
      projectId: envVars.NEXT_PUBLIC_FIREBASE_SECOND_PROJECT_ID?.[0],
      storageBucket: envVars.NEXT_PUBLIC_FIREBASE_SECOND_STORAGE_BUCKET?.[0],
      messagingSenderId: envVars.NEXT_PUBLIC_FIREBASE_SECOND_MESSAGING_SENDER_ID?.[0],
      appId: envVars.NEXT_PUBLIC_FIREBASE_SECOND_APP_ID?.[0],
    };
    await runQuery(config2_1, "SECOND_FIREBASE_KEY_1");
  }

  if (secondApiKeys.length > 1) {
    const config2_2 = {
      apiKey: secondApiKeys[1],
      authDomain: envVars.NEXT_PUBLIC_FIREBASE_SECOND_AUTH_DOMAIN?.[0],
      projectId: envVars.NEXT_PUBLIC_FIREBASE_SECOND_PROJECT_ID?.[0],
      storageBucket: envVars.NEXT_PUBLIC_FIREBASE_SECOND_STORAGE_BUCKET?.[0],
      messagingSenderId: envVars.NEXT_PUBLIC_FIREBASE_SECOND_MESSAGING_SENDER_ID?.[0],
      appId: envVars.NEXT_PUBLIC_FIREBASE_SECOND_APP_ID?.[0],
    };
    await runQuery(config2_2, "SECOND_FIREBASE_KEY_2");
  }
}

main();
