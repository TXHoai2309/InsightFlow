const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
const fs = require('fs');

async function run() {
  const accountPath = path.join(process.cwd(), 'service-account.json');
  const serviceAccount = JSON.parse(fs.readFileSync(accountPath, 'utf8'));

  const secondApp = getApps().find(app => app.name === 'datainsight') || initializeApp({
    credential: cert(serviceAccount),
    projectId: "datainsight-330eb"
  }, 'datainsight');

  const dbData = getFirestore(secondApp);

  const snapshot = await dbData.collection('notifications').orderBy('created_at', 'desc').limit(5).get();
  snapshot.docs.forEach(doc => {
    console.log(doc.id, '=>', doc.data());
  });
}

run().catch(console.error);
