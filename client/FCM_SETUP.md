# Firebase Cloud Messaging Setup Instructions

## Overview
This project uses Firebase Cloud Messaging (FCM) for push notifications. The setup includes:

1. **Service Worker**: Located at `public/firebase-messaging-sw.js`
2. **Firebase Configuration**: Shared between app and service worker
3. **Messaging Utilities**: In `src/lib/firebase.ts`

## Setup Steps

### 1. Environment Variables
Create a `.env.local` file in the client directory with your Firebase configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your-vapid-key
```

### 2. Update Service Worker Configuration
**IMPORTANT**: Service workers cannot access Next.js environment variables.

1. Run your app in development mode to see the Firebase config in the console
2. Copy the logged configuration values
3. Replace the placeholder values in `public/firebase-messaging-sw.js`:

```javascript
firebase.initializeApp({
  apiKey: "your-actual-api-key",
  authDomain: "your-actual-domain",
  projectId: "your-actual-project-id",
  storageBucket: "your-actual-bucket",
  messagingSenderId: "your-actual-sender-id",
  appId: "your-actual-app-id",
});
```

### 3. Add Notification Icons
Add these icon files to your `public` directory:
- `icon-192x192.png` - Main notification icon
- `badge-72x72.png` - Small badge icon

### 4. Firebase Console Configuration
1. Go to your Firebase project console
2. Navigate to Project Settings > Cloud Messaging
3. Generate a Web Push certificate (VAPID key)
4. Add your domain to the authorized domains

### 5. Testing
1. Open your app in a browser
2. Grant notification permissions when prompted
3. Check the browser console for FCM token generation
4. Test sending notifications from the Firebase console

## Troubleshooting

### Common Issues:
1. **Service worker not registering**: Check browser console for errors
2. **No FCM token**: Ensure notifications are enabled and VAPID key is correct
3. **Background notifications not working**: Verify service worker configuration
4. **Environment variables not working**: Remember service workers need hardcoded values

### Debug Steps:
1. Check browser console for error messages
2. Verify service worker is registered in DevTools > Application > Service Workers
3. Test notification permissions with `Notification.requestPermission()`
4. Verify Firebase project configuration in console

## Files Overview

- `public/firebase-messaging-sw.js` - Service worker for background messages
- `src/lib/firebase.ts` - Main Firebase configuration and utilities
- `src/lib/firebase-config.ts` - Shared configuration helper
- This README - Setup instructions and troubleshooting
