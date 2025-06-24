// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// Add this import:
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

// Production fallback for Firebase configuration
const productionFirebaseConfig = {
  apiKey: "your_firebase_api_key", // Replace with your actual API key in production
  authDomain: "your_firebase_auth_domain",
  projectId: "your_firebase_project_id",
  storageBucket: "your_firebase_storage_bucket",
  messagingSenderId: "your_firebase_messaging_sender_id",
  appId: "your_firebase_app_id",
  measurementId: "your_firebase_measurement_id",
};

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || productionFirebaseConfig.apiKey,
  authDomain:
    process.env.FIREBASE_AUTH_DOMAIN || productionFirebaseConfig.authDomain,
  projectId:
    process.env.FIREBASE_PROJECT_ID || productionFirebaseConfig.projectId,
  storageBucket:
    process.env.FIREBASE_STORAGE_BUCKET ||
    productionFirebaseConfig.storageBucket,
  messagingSenderId:
    process.env.FIREBASE_MESSAGING_SENDER_ID ||
    productionFirebaseConfig.messagingSenderId,
  appId: process.env.FIREBASE_APP_ID || productionFirebaseConfig.appId,
  measurementId:
    process.env.FIREBASE_MEASUREMENT_ID ||
    productionFirebaseConfig.measurementId,
};

// Initialize Firebase with error handling
let app;
let auth;
let db;
let storage;
let analytics = null;

try {
  app = initializeApp(firebaseConfig);

  // Initialize Auth with persistence
  if (typeof navigator !== "undefined" && navigator.product === "ReactNative") {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
  } else {
    auth = getAuth(app);
  }

  // Initialize Firestore and Storage
  db = getFirestore(app);
  storage = getStorage(app);

  // Initialize Analytics conditionally
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch((e) => {
      console.log("Analytics not supported:", e);
    });

  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Firebase initialization error:", error);

  // Fallback initialization (minimal)
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}

export { app, auth, db, storage, analytics };
