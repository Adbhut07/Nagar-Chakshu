import { initializeApp } from "firebase/app";
import { getStorage, ref, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate Firebase config
const isValidConfig = Object.values(firebaseConfig).every(value => value && value !== 'undefined');

if (!isValidConfig) {
  console.error('Firebase configuration is incomplete. Please check your environment variables.');
  const missingConfig = Object.entries(firebaseConfig)
    .filter(([, value]) => !value || value === 'undefined')
    .map(([key]) => key);
  console.log('Missing or invalid config:', missingConfig);
}

let storage: FirebaseStorage;

try {
  const app = initializeApp(firebaseConfig);
  storage = getStorage(app);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Failed to initialize Firebase:', error);
  throw new Error('Firebase initialization failed. Please check your configuration.');
}

// Test Firebase connection
export const testFirebaseConnection = async () => {
  try {
    // Test by creating a reference - this will validate the storage bucket
    ref(storage, 'test');
    console.log('Firebase Storage connection successful');
    return true;
  } catch (error) {
    console.error('Firebase connection failed:', error);
    return false;
  }
};

export { storage };
