const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");
const fs = require("fs");

const envVars = fs.readFileSync(".env.local", "utf8").split("\n").reduce((acc, line) => {
  const [key, ...value] = line.split("=");
  if (key && !key.trim().startsWith("#")) {
    acc[key.trim()] = value.join("=").trim();
  }
  return acc;
}, {});

const config2 = {
  apiKey: envVars.NEXT_PUBLIC_FIREBASE_SECOND_API_KEY,
  authDomain: envVars.NEXT_PUBLIC_FIREBASE_SECOND_AUTH_DOMAIN,
  projectId: envVars.NEXT_PUBLIC_FIREBASE_SECOND_PROJECT_ID,
  storageBucket: envVars.NEXT_PUBLIC_FIREBASE_SECOND_STORAGE_BUCKET,
  messagingSenderId: envVars.NEXT_PUBLIC_FIREBASE_SECOND_MESSAGING_SENDER_ID,
  appId: envVars.NEXT_PUBLIC_FIREBASE_SECOND_APP_ID,
};

async function main() {
  const app = initializeApp(config2, "dump");
  const db = getFirestore(app);
  const snap = await getDocs(collection(db, "insightflow_labels"));
  console.log("Total docs:", snap.size);
  snap.docs.forEach((doc) => {
    console.log("Doc ID:", doc.id, JSON.stringify(doc.data(), null, 2));
  });
}

main();
