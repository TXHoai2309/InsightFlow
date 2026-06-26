const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");
const fs = require("fs");

const envVars = fs.readFileSync(".env.local", "utf8").split("\n").reduce((acc, line) => {
  const [key, ...value] = line.split("=");
  if (key && !key.startsWith("#")) acc[key.trim()] = value.join("=").trim();
  return acc;
}, {});

const secondFirebaseConfig = {
  apiKey: envVars.NEXT_PUBLIC_FIREBASE_SECOND_API_KEY,
  authDomain: envVars.NEXT_PUBLIC_FIREBASE_SECOND_AUTH_DOMAIN,
  projectId: envVars.NEXT_PUBLIC_FIREBASE_SECOND_PROJECT_ID,
  storageBucket: envVars.NEXT_PUBLIC_FIREBASE_SECOND_STORAGE_BUCKET,
  messagingSenderId: envVars.NEXT_PUBLIC_FIREBASE_SECOND_MESSAGING_SENDER_ID,
  appId: envVars.NEXT_PUBLIC_FIREBASE_SECOND_APP_ID,
};

const app = initializeApp(secondFirebaseConfig);
const db = getFirestore(app);

async function test() {
  try {
    console.log("Fetching 'comments'...");
    const commentsSnap = await getDocs(collection(db, "comments"));
    console.log("Comments:", commentsSnap.size);
    if (!commentsSnap.empty) console.log(commentsSnap.docs[0].data());
  } catch (e) { console.error("comments error:", e.message); }

  try {
    console.log("Fetching 'mentions'...");
    const mentionsSnap = await getDocs(collection(db, "mentions"));
    console.log("Mentions:", mentionsSnap.size);
    if (!mentionsSnap.empty) console.log(mentionsSnap.docs[0].data());
  } catch (e) { console.error("mentions error:", e.message); }

  process.exit(0);
}

test();
