// Import the Firebase services you need
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "REPLACE_WITH_YOUR_API_KEY",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "REPLACE_WITH_YOUR_AUTH_DOMAIN",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "REPLACE_WITH_YOUR_PROJECT_ID",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "REPLACE_WITH_YOUR_STORAGE_BUCKET",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "REPLACE_WITH_YOUR_MESSAGING_SENDER_ID",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "REPLACE_WITH_YOUR_APP_ID",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "REPLACE_WITH_YOUR_MEASUREMENT_ID"
};

// Initialize Firebase only if it hasn't been initialized already
let firebaseApp: FirebaseApp;
let analytics: Analytics | undefined;

if (!getApps().length) {
  firebaseApp = initializeApp(firebaseConfig);
  // Initialize analytics only in the browser environment
  if (typeof window !== 'undefined') {
    // Check if analytics is supported before initializing
    isSupported().then(yes => yes ? getAnalytics(firebaseApp) : undefined)
      .then(result => {
        analytics = result;
      }).catch(error => console.error("Analytics error:", error));
  }
} else {
  firebaseApp = getApps()[0];
}

// Initialize Firebase services
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

// Export the services for use throughout your app
export { auth, db, storage, firebaseApp, analytics }; 