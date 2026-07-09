const { initializeApp } = require("firebase/app");
const { getFirestore, collection, query, where, getDocs } = require("firebase/firestore");
const fs = require("fs");

const envVars = fs.readFileSync(".env.local", "utf8").split("\n").reduce((acc, line) => {
  const [key, ...value] = line.split("=");
  if (key && !key.startsWith("#")) acc[key.trim()] = value.join("=").trim();
  return acc;
}, {});

const firebaseConfig = {
  apiKey: envVars.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: envVars.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: envVars.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: envVars.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: envVars.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: envVars.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  try {
    console.log("Checking manager...");
    const q1 = query(collection(db, "users"), where("email", "==", "manager@highlandscoffee.com"));
    const snap1 = await getDocs(q1);
    if (snap1.empty) {
      console.log("manager@highlandscoffee.com NOT found");
    } else {
      snap1.forEach(d => {
        console.log("ID:", d.id);
        console.log("Data:", JSON.stringify(d.data(), null, 2));
      });
    }

    console.log("\nChecking crisis...");
    const q2 = query(collection(db, "users"), where("email", "==", "nguyen_van_crisis@highlandscoffee.com"));
    const snap2 = await getDocs(q2);
    if (snap2.empty) {
      console.log("nguyen_van_crisis@highlandscoffee.com NOT found");
    } else {
      snap2.forEach(d => {
        console.log("ID:", d.id);
        console.log("Data:", JSON.stringify(d.data(), null, 2));
      });
    }
  } catch (e) {
    console.error("Error checking firebase users:", e);
  }
  process.exit(0);
}

check();
