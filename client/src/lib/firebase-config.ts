// src/lib/firebase-config.ts
// This file exports the Firebase configuration that can be used in both
// the main app and copied to the service worker

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// For service worker usage (since it can't access process.env)
// You'll need to manually copy these values to your service worker
export const getFirebaseConfigForServiceWorker = () => {
  return {
    apiKey: firebaseConfig.apiKey,
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    messagingSenderId: firebaseConfig.messagingSenderId,
    appId: firebaseConfig.appId,
  };
};

// Log config for copying to service worker (development only)
if (process.env.NODE_ENV === 'development') {
  console.log('Firebase config for service worker:', JSON.stringify(getFirebaseConfigForServiceWorker(), null, 2));
}
