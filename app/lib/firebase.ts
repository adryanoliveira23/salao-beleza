import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCVcWcpfrsgje7Ll6ZaYTKcbJzwpMXKBcY",
  authDomain: "salao-beleza-dc04b.firebaseapp.com",
  projectId: "salao-beleza-dc04b",
  storageBucket: "salao-beleza-dc04b.firebasestorage.app",
  messagingSenderId: "524412415672",
  appId: "1:524412415672:web:5e1301cd0160cc99370e4d",
  measurementId: "G-SF9ZXCKLNP",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

let analytics;
// Analytics is only supported in browser environments
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, auth, db, storage, analytics, firebaseConfig };
