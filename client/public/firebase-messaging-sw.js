// public/firebase-messaging-sw.js
importScripts("https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js");

// IMPORTANT: Replace these with your actual Firebase config values
// Environment variables don't work in service workers
const firebaseConfig = {
  apiKey: "AIzaSyBnTi25M_fiOluLfEMSrcUVghdX_vzEsvc",
  authDomain: "nagar-chakshu.firebaseapp.com",
  projectId: "nagar-chakshu",
  storageBucket: "nagar-chakshu.firebasestorage.app",
  messagingSenderId: "690683256092",
  appId: "1:827067796363:web:40c7dbaf6fc303d9573d8e",
  measurementId: "G-2SXQ87025T", 
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Received background message ", payload);

  // Handle cases where notification might be undefined
  if (!payload.notification) {
    console.log("No notification payload found");
    return;
  }

  // payload.fcmOptions?.link comes from our backend API route handle
  // payload.data.link comes from the Firebase Console where link is the 'key'
  const link = payload.fcmOptions?.link || payload.data?.link;

  const notificationTitle = payload.notification.title || "New Notification";
  const notificationOptions = {
    body: payload.notification.body || "You have a new message",
    icon: "./logo.png", // Make sure this file exists in your public folder
    badge: "./badge.png", // Optional: add a badge icon
    data: { url: link },
    // Add more options for better UX
    tag: 'notification-' + Date.now(), // Prevents duplicate notifications
    requireInteraction: false, // Auto-close after some time
    actions: link ? [
      {
        action: 'open',
        title: 'Open',
        icon: './open-icon.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: './close-icon.png'
      }
    ] : []
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener("notificationclick", function (event) {
  console.log("[firebase-messaging-sw.js] Notification click received.");

  event.notification.close();

  // Handle action buttons
  if (event.action === 'close') {
    return; // Just close the notification
  }

  // This checks if the client is already open and if it is, it focuses on the tab. 
  // If it is not open, it opens a new tab with the URL passed in the notification payload
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (clientList) {
        const url = event.notification.data.url;

        // If no URL is provided, just focus on the main app
        const targetUrl = url || '/dashboard'; // Default to dashboard

        // Check if the app is already open
        for (const client of clientList) {
          // For same origin, focus existing tab
          if (client.url.includes(self.location.origin) && "focus" in client) {
            // Navigate to the specific URL if provided
            if (url && client.navigate) {
              client.navigate(targetUrl);
            }
            return client.focus();
          }
        }

        // If no existing tab, open new one
        if (clients.openWindow) {
          console.log("Opening new window with URL:", targetUrl);
          return clients.openWindow(targetUrl);
        }
      })
      .catch(error => {
        console.error("Error handling notification click:", error);
      })
  );
});

// Handle notification close event (optional)
self.addEventListener('notificationclose', function(event) {
  console.log('[firebase-messaging-sw.js] Notification closed.');
  // You can track notification close events here
});