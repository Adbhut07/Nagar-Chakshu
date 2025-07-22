// lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from 'firebase/auth';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { firebaseConfig } from './firebase-config';

// Validate Firebase config
const validateFirebaseConfig = () => {
  const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  for (const key of requiredKeys) {
    if (!firebaseConfig[key as keyof typeof firebaseConfig]) {
      console.error(`Missing Firebase config: ${key}`);
      throw new Error(`Firebase configuration incomplete: ${key} is missing`);
    }
  }
};

// Validate config before initializing
validateFirebaseConfig();

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Configure Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Optional: Configure custom parameters
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Initialize Firebase Storage
export const storage = getStorage(app);

// Initialize Firebase Messaging (only in browser environment)
let messaging: any = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      messaging = getMessaging(app);
    }
  }).catch(console.error);
}

export { messaging };

// FCM Token Management
export const getFCMToken = async (): Promise<string | null> => {
  try {
    console.log('Starting FCM token generation process...');
    
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      console.log('FCM not supported in server environment');
      return null;
    }

    // Check if messaging is supported
    const supported = await isSupported();
    if (!supported) {
      console.log('FCM not supported in this browser');
      return null;
    }

    // Check if service worker is available
    if (!('serviceWorker' in navigator)) {
      console.log('Service worker not supported');
      return null;
    }

    // Register service worker if not already registered
    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('Service worker registered:', registration);
    } catch (swError) {
      console.error('Service worker registration failed:', swError);
      // Continue anyway, maybe it's already registered
    }

    // Get messaging instance
    if (!messaging) {
      messaging = getMessaging(app);
      console.log('Messaging instance created');
    }

    // Get VAPID key from environment
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.error('VAPID key not configured in environment variables');
      return null;
    }

    console.log('VAPID key found, requesting notification permission...');
    
    // Request notification permission
    const permission = await Notification.requestPermission();
    console.log('Notification permission result:', permission);
    
    if (permission !== 'granted') {
      console.log('Notification permission denied by user');
      return null;
    }

    console.log('Permission granted, getting FCM token...');
    
    // Get FCM token
    const token = await getToken(messaging, {
      vapidKey: vapidKey,
      serviceWorkerRegistration: await navigator.serviceWorker.ready
    });

    if (token) {
      console.log('FCM token generated successfully:', token.substring(0, 50) + '...');
      return token;
    } else {
      console.log('No FCM token available - this can happen if notifications are blocked');
      return null;
    }

  } catch (error) {
    console.error('Error getting FCM token:', error);
    
    // Log specific error details
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
    }
    
    return null;
  }
};

// Listen for foreground messages
export const onForegroundMessage = (callback: (payload: any) => void) => {
  if (typeof window !== 'undefined' && messaging) {
    return onMessage(messaging, callback);
  }
  return () => {}; // Return empty unsubscribe function
};

// Utility to check if FCM is available
export const isFCMAvailable = async (): Promise<boolean> => {
  try {
    if (typeof window === 'undefined') return false;
    const supported = await isSupported();
    return supported && 'serviceWorker' in navigator;
  } catch {
    return false;
  }
};

export default app;