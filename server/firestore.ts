import * as admin from 'firebase-admin';

const firestore = admin.firestore()

if (process.env.IS_TEST) {
  console.log('Setting Firestore test settings.');
  firestore.settings({
    projectId: 'test',
    host: 'localhost',
    port: 8081,
  })
} else {
  firestore.settings({
    projectId: process.env.GOOGLE_CLOUD_PROJECT
  })
}

export default firestore;

export const deleteCollection = async (db, collectionPath, batchSize=32) => {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.orderBy('__name__').limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(db, query, resolve).catch(reject);
  });
};

const deleteQueryBatch = async (db, query, resolve) => {
  const snapshot = await query.get();

  const batchSize = snapshot.size;
  if (batchSize === 0) {
    // When there are no documents left, we are done
    resolve();
    return;
  }

  // Delete documents in a batch
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  // Recurse on the next process tick, to avoid
  // exploding the stack.
  process.nextTick(() => {
    deleteQueryBatch(db, query, resolve);
  });
};