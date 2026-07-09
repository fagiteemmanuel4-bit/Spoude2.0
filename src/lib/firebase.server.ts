import * as admin from "firebase-admin";

const initializeFirebaseAdmin = () => {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    : undefined;

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.FIREBASE_PROJECT_ID || "spoude";

  if (privateKey && clientEmail) {
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      storageBucket: `${projectId}.firebasestorage.app`,
    });
  } else {
    return admin.initializeApp({
      projectId,
      storageBucket: `${projectId}.firebasestorage.app`,
    });
  }
};

const adminApp = initializeFirebaseAdmin();
const adminAuth = admin.auth(adminApp);
const adminDb = admin.firestore(adminApp);
const adminStorage = admin.storage(adminApp);

export { adminApp, adminAuth, adminDb, adminStorage };
