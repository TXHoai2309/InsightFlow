require('ts-node').register({ transpileOnly: true });
const { db } = require('./src/lib/server/firebaseAdmin.ts');

async function test() {
  const snapshot = await db.collection("notifications").get();
  console.log("Total notifications:", snapshot.size);
  snapshot.docs.forEach(doc => {
    console.log(doc.id, doc.data());
  });
}
test().catch(console.error);
