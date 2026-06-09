const admin = require('firebase-admin');
const path = require('path');

function initFirebase(){
  if (admin.apps.length) return admin.app();
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!serviceAccountPath) {
    console.warn('FIREBASE_SERVICE_ACCOUNT_PATH not set; Firebase not initialized');
    return null;
  }
  const serviceAccount = require(path.resolve(serviceAccountPath));
  const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
  });
  return app;
}

module.exports = { initFirebase, admin };
