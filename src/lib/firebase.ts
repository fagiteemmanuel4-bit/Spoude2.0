import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyA2eOLsLd27ud7auKHpx8XrxKa9FEJlwjk",
  authDomain: "spoude.firebaseapp.com",
  projectId: "spoude",
  storageBucket: "spoude.firebasestorage.app",
  messagingSenderId: "546104486056",
  appId: "1:546104486056:web:164bf9ce774d8c8d5c3a9d",
  measurementId: "G-MB7BCVQXR3",
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

let analytics: any = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, auth, db, storage, googleProvider, analytics };
