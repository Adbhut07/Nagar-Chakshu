// import * as functions from "firebase-functions/v2/scheduler";
// import admin from "../utils/firebase";
// import geohash from "ngeohash";

// const db = admin.firestore();

// // Helper function to calculate distance between two coordinates (Haversine formula)
// const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
//   const R = 6371e3; // Earth's radius in meters
//   const φ1 = lat1 * Math.PI / 180;
//   const φ2 = lat2 * Math.PI / 180;
//   const Δφ = (lat2 - lat1) * Math.PI / 180;
//   const Δλ = (lon2 - lon1) * Math.PI / 180;

//   const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
//             Math.cos(φ1) * Math.cos(φ2) *
//             Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

//   return R * c;
// };

// // Helper function to get geohash bounds for radius query
// const getGeohashBounds = (lat: number, lng: number, radiusInM: number): string[] => {
//   // Calculate appropriate geohash precision based on radius
//   // For 2km radius, precision 5 should be sufficient
//   const precision = radiusInM > 5000 ? 4 : radiusInM > 1000 ? 5 : 6;
  
//   // Generate center geohash
//   const centerHash = geohash.encode(lat, lng, precision);
  
//   // Get neighboring geohashes to cover the radius
//   const neighbors = geohash.neighbors(centerHash);
//   const bounds = [centerHash, ...Object.values(neighbors)];
  
//   return bounds.sort();
// };

// // Helper function to check if user should receive notification based on categories
// const shouldNotifyUser = (userCategories: string[], incidentCategories: string[]): boolean => {
//   if (!userCategories || !incidentCategories) return false;
  
//   // Check if user has subscribed to any of the incident categories
//   return incidentCategories.some(category => 
//     userCategories.some(userCat => 
//       userCat.toLowerCase() === category.toLowerCase()
//     )
//   );
// };

// // Helper function to check quiet hours
// const isInQuietHours = (quietHours: any): boolean => {
//   if (!quietHours || !quietHours.start || !quietHours.end) return false;
  
//   const now = new Date();
//   const currentHour = now.getHours();
  
//   const startHour = parseInt(quietHours.start.split(':')[0]);
//   const endHour = parseInt(quietHours.end.split(':')[0]);
  
//   if (startHour < endHour) {
//     return currentHour >= startHour && currentHour < endHour;
//   } else {
//     // Quiet hours span midnight
//     return currentHour >= startHour || currentHour < endHour;
//   }
// };

// export const notifyUsersOnNewIncidents = functions.onSchedule(
//   { schedule: "every 15 minutes" },
//   async (event) => {
//     try {
//       console.log("Starting notification cron job...");
      
//       const now = Date.now();
//       const fifteenMinutesAgo = now - 15 * 60 * 1000;

//       // Query new incidents from summarized_data collection
//       const incidentSnap = await db
//         .collection("summarized_data")
//         .where("timestamp", ">", fifteenMinutesAgo)
//         .get();

//       console.log(`Found ${incidentSnap.docs.length} new incidents to process`);

//       for (const doc of incidentSnap.docs) {
//         const incident = doc.data();
//         const incidentId = doc.id;
        
//         // Extract coordinates from the nested structure
//         const lat = incident.coordinates?.lat;
//         const lng = incident.coordinates?.lng;
//         const summary = incident.summary;
//         const categories = incident.categories || [];

//         if (!lat || !lng) {
//           console.log(`Skipping incident ${incidentId} - missing coordinates`);
//           continue;
//         }

//         console.log(`Processing incident ${incidentId} at coordinates (${lat}, ${lng})`);

//         // Use 2km radius as specified
//         const radiusInM = 2000;
//         const bounds = getGeohashBounds(lat, lng, radiusInM);

//         const usersToNotify: any[] = [];

//         // Query users within geohash bounds
//         for (const bound of bounds) {
//           const userSnap = await db
//             .collection("users")
//             .where("location.geohash", ">=", bound)
//             .where("location.geohash", "<", bound + '\uf8ff')
//             .get();

//           for (const userDoc of userSnap.docs) {
//             const user = userDoc.data();
//             const userId = userDoc.id;
            
//             // Check if user has required data
//             if (!user.location?.lat || !user.location?.lng || !user.fcmToken) {
//               console.log(`Skipping user ${userId} - missing location or FCM token`);
//               continue;
//             }

//             // Check if notifications are enabled
//             if (!user.notifications?.enabled) {
//               console.log(`Skipping user ${userId} - notifications disabled`);
//               continue;
//             }

//             // Check quiet hours
//             if (isInQuietHours(user.notifications?.quietHours)) {
//               console.log(`Skipping user ${userId} - in quiet hours`);
//               continue;
//             }

//             // Check if user is interested in this type of incident
//             if (!shouldNotifyUser(user.categories, categories)) {
//               console.log(`Skipping user ${userId} - not interested in categories: ${categories.join(', ')}`);
//               continue;
//             }

//             const distance = calculateDistance(lat, lng, user.location.lat, user.location.lng);

//             // Check user's custom radius preference (convert km to meters)
//             const userRadiusInM = (user.radius_km || 2) * 1000;
//             const effectiveRadius = Math.min(radiusInM, userRadiusInM);

//             if (distance <= effectiveRadius) {
//               // Check if already notified
//               const notifSnap = await db
//                 .collection("notifications_sent")
//                 .where("userId", "==", userId)
//                 .where("incidentId", "==", incidentId)
//                 .limit(1)
//                 .get();

//               if (notifSnap.empty) {
//                 usersToNotify.push({ 
//                   ...user, 
//                   userId,
//                   distance: Math.round(distance)
//                 });
//                 console.log(`Added user ${userId} to notification list (distance: ${Math.round(distance)}m)`);
//               } else {
//                 console.log(`User ${userId} already notified for incident ${incidentId}`);
//               }
//             } else {
//               console.log(`User ${userId} outside radius (distance: ${Math.round(distance)}m, max: ${effectiveRadius}m)`);
//             }
//           }
//         }

//         console.log(`Sending notifications to ${usersToNotify.length} users for incident ${incidentId}`);

//         // Send FCM notifications in batches to avoid overwhelming the service
//         const batchSize = 10;
//         for (let i = 0; i < usersToNotify.length; i += batchSize) {
//           const batch = usersToNotify.slice(i, i + batchSize);
          
//           const promises = batch.map(async (user) => {
//             const payload = {
//               notification: {
//                 title: `🚨 Incident Alert`,
//                 body: summary || "New incident reported in your area.",
//               },
//               data: {
//                 incidentId: incidentId,
//                 type: "incident_alert",
//                 timestamp: now.toString(),
//                 distance: user.distance.toString(),
//                 location: incident.location || "Unknown location",
//                 categories: categories.join(',')
//               }
//             };

//             try {
//               await admin.messaging().sendToDevice(user.fcmToken, payload);

//               // Log successful notification
//               await db.collection("notifications_sent").add({
//                 userId: user.userId,
//                 incidentId: incidentId,
//                 timestamp: now,
//                 notificationType: "incident_alert",
//                 sent: true,
//                 distance: user.distance,
//                 categories: categories
//               });

//               console.log(`Successfully sent notification to user ${user.userId}`);
//               return { success: true, userId: user.userId };
              
//             } catch (err) {
//               console.error(`Error sending notification to ${user.userId}:`, err);
              
//               // Log failed notification attempt
//               await db.collection("notifications_sent").add({
//                 userId: user.userId,
//                 incidentId: incidentId,
//                 timestamp: now,
//                 notificationType: "incident_alert",
//                 sent: false,
//                 error: err instanceof Error ? err.message : "Unknown error",
//                 distance: user.distance,
//                 categories: categories
//               });

//               return { success: false, userId: user.userId, error: err };
//             }
//           });

//           // Wait for current batch to complete before processing next batch
//           await Promise.allSettled(promises);
//         }
//       }

//       console.log("Notification cron job completed successfully");
      
//     } catch (error) {
//       console.error("Error in notification cron job:", error);
//     }
//   });


import * as functions from "firebase-functions/v2/scheduler";
import * as httpsFunction from "firebase-functions/v2/https";
import admin from "../utils/firebase";
import geohash from "ngeohash";

const db = admin.firestore();

// Helper function to calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

// Helper function to get geohash bounds for radius query
const getGeohashBounds = (lat: number, lng: number, radiusInM: number): string[] => {
  // Calculate appropriate geohash precision based on radius
  const precision = radiusInM > 5000 ? 4 : radiusInM > 1000 ? 5 : 6;
  
  // Generate center geohash
  const centerHash = geohash.encode(lat, lng, precision);
  
  // Get neighboring geohashes to cover the radius
  const neighbors = geohash.neighbors(centerHash);
  const bounds = [centerHash, ...Object.values(neighbors)];
  
  return bounds.sort();
};

// Helper function to check if user should receive notification based on categories
const shouldNotifyUser = (userCategories: string[], incidentCategories: string[]): boolean => {
  if (!userCategories || !incidentCategories) return false;
  
  // Check if user has subscribed to any of the incident categories
  return incidentCategories.some(category => 
    userCategories.some(userCat => 
      userCat.toLowerCase() === category.toLowerCase()
    )
  );
};

// Helper function to check quiet hours
const isInQuietHours = (quietHours: any): boolean => {
  if (!quietHours || !quietHours.start || !quietHours.end) return false;
  
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  // Parse start and end times
  const [startHour, startMinute] = quietHours.start.split(':').map((t: string) => parseInt(t));
  const [endHour, endMinute] = quietHours.end.split(':').map((t: string) => parseInt(t));
  
  const currentTotalMinutes = currentHour * 60 + currentMinute;
  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;
  
  if (startTotalMinutes < endTotalMinutes) {
    // Normal case: quiet hours don't span midnight
    return currentTotalMinutes >= startTotalMinutes && currentTotalMinutes < endTotalMinutes;
  } else {
    // Quiet hours span midnight
    return currentTotalMinutes >= startTotalMinutes || currentTotalMinutes < endTotalMinutes;
  }
};

// Helper function to format incident categories for display
const formatCategories = (categories: string[]): string => {
  return categories.map(cat => 
    cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase()
  ).join(', ');
};

// Helper function to get appropriate emoji for incident categories
const getIncidentEmoji = (categories: string[]): string => {
  const categoryEmojiMap: { [key: string]: string } = {
    'traffic': '🚦',
    'emergency': '🚨',
    'infrastructure': '🏗️',
    'events': '📅',
    'weather': '🌦️',
    'safety': '⚠️',
    'construction': '🚧',
    'accident': '🚗',
    'fire': '🔥',
    'medical': '🏥'
  };

  // Find the first matching category or use default
  for (const category of categories) {
    const emoji = categoryEmojiMap[category.toLowerCase()];
    if (emoji) return emoji;
  }
  
  return '📍'; // Default emoji
};

export const notifyUsersOnNewIncidents = functions.onSchedule(
  { schedule: "every 15 minutes", timeZone: "Asia/Kolkata" },
  async (event) => {
    await processIncidentNotifications();
  }
);

// Core notification processing logic extracted for reusability
async function processIncidentNotifications(): Promise<{ processed: number; sent: number }> {
  try {
    console.log("🔄 Starting incident notification scheduler...");
    
    const now = Date.now();
    const fifteenMinutesAgo = now - 15 * 60 * 1000;

    // Query new incidents from summarized_data collection
    const incidentSnap = await db
      .collection("summarized_data")
      .where("timestamp", ">", fifteenMinutesAgo)
      .orderBy("timestamp", "desc")
      .get();

    console.log(`📊 Found ${incidentSnap.docs.length} new incidents to process`);

    if (incidentSnap.docs.length === 0) {
      console.log("ℹ️ No new incidents found. Scheduler completed.");
      return { processed: 0, sent: 0 };
    }

    let totalNotificationsSent = 0;
    let totalUsersProcessed = 0;

      for (const doc of incidentSnap.docs) {
        const incident = doc.data();
        const incidentId = doc.id;
        
        // Extract incident data
        const lat = incident.coordinates?.lat;
        const lng = incident.coordinates?.lng;
        const summary = incident.summary || "New incident reported in your area";
        const description = incident.descriptions?.[0] || summary;
        const location = incident.location || "Unknown location";
        const categories = incident.categories || [];
        const advice = incident.advice;

        if (!lat || !lng) {
          console.log(`⚠️ Skipping incident ${incidentId} - missing coordinates`);
          continue;
        }

        console.log(`🔍 Processing incident ${incidentId} at ${location} (${lat}, ${lng})`);
        console.log(`📋 Categories: ${categories.join(', ')}`);

        // Use maximum 5km radius for geohash bounds, but respect user preferences
        const maxRadiusInM = 5000;
        const bounds = getGeohashBounds(lat, lng, maxRadiusInM);

        const usersToNotify: any[] = [];

        // Query users within geohash bounds
        for (const bound of bounds) {
          const userSnap = await db
            .collection("users")
            .where("location.geohash", ">=", bound)
            .where("location.geohash", "<", bound + '\uf8ff')
            .get();

          totalUsersProcessed += userSnap.docs.length;

          for (const userDoc of userSnap.docs) {
            const user = userDoc.data();
            const userId = userDoc.id;
            
            // Validate user data
            if (!user.location?.lat || !user.location?.lng || !user.fcmToken) {
              console.log(`⚠️ Skipping user ${userId} - missing location or FCM token`);
              continue;
            }

            // Check if notifications are enabled
            if (!user.notifications?.enabled) {
              console.log(`🔇 Skipping user ${userId} - notifications disabled`);
              continue;
            }

            // Check quiet hours
            if (isInQuietHours(user.notifications?.quietHours)) {
              console.log(`😴 Skipping user ${userId} - in quiet hours`);
              continue;
            }

            // Check if user is interested in this type of incident
            if (!shouldNotifyUser(user.categories, categories)) {
              console.log(`🚫 Skipping user ${userId} - not subscribed to categories: ${categories.join(', ')}`);
              continue;
            }

            const distance = calculateDistance(lat, lng, user.location.lat, user.location.lng);

            // Check user's custom radius preference (convert km to meters)
            const userRadiusInM = (user.radius_km || 2) * 1000;

            if (distance <= userRadiusInM) {
              // Check if already notified for this incident
              const notifSnap = await db
                .collection("notifications_sent")
                .where("userId", "==", userId)
                .where("incidentId", "==", incidentId)
                .limit(1)
                .get();

              if (notifSnap.empty) {
                usersToNotify.push({ 
                  ...user, 
                  userId,
                  distance: Math.round(distance)
                });
                console.log(`✅ Added user ${userId} to notification list (distance: ${Math.round(distance)}m)`);
              } else {
                console.log(`🔄 User ${userId} already notified for incident ${incidentId}`);
              }
            } else {
              console.log(`📏 User ${userId} outside radius (distance: ${Math.round(distance)}m, max: ${userRadiusInM}m)`);
            }
          }
        }

        console.log(`📤 Preparing to notify ${usersToNotify.length} users for incident ${incidentId}`);

        if (usersToNotify.length === 0) {
          console.log(`ℹ️ No users to notify for incident ${incidentId}`);
          continue;
        }

        // Prepare notification payload
        const incidentEmoji = getIncidentEmoji(categories);
        const formattedCategories = formatCategories(categories);
        const distanceText = usersToNotify.length > 0 ? 
          `${Math.round(usersToNotify[0].distance)}m away` : '';

        // Your website URL - replace with your actual domain
        const websiteUrl = "https://nagar-chakshu.web.app"; // Replace with your actual deployed URL

        // Send FCM notifications in batches
        const batchSize = 10;
        let batchNotificationsSent = 0;

        for (let i = 0; i < usersToNotify.length; i += batchSize) {
          const batch = usersToNotify.slice(i, i + batchSize);
          
          const promises = batch.map(async (user) => {
            const payload = {
              notification: {
                title: `${incidentEmoji} Incident Alert - ${formattedCategories}`,
                body: `${description.substring(0, 120)}${description.length > 120 ? '...' : ''}\n📍 ${location} (${user.distance}m away)`,
                icon: './logo.png', // Matches your service worker
                badge: './badge.png', // Matches your service worker
                click_action: websiteUrl
              },
              data: {
                incidentId: incidentId,
                type: "incident_alert",
                timestamp: now.toString(),
                distance: user.distance.toString(),
                location: location,
                categories: categories.join(','),
                summary: summary,
                description: description,
                advice: advice || '',
                link: websiteUrl, // This is what your service worker looks for
                url: websiteUrl, // Backup for compatibility
                coordinates: JSON.stringify({ lat, lng })
              },
              // Enhanced FCM options for better compatibility
              fcmOptions: {
                link: websiteUrl, // This is also checked by your service worker
                analyticsLabel: `incident_${incidentId}`
              }
            };

            try {
              await admin.messaging().sendToDevice(user.fcmToken, payload);
              batchNotificationsSent++;

              // Log successful notification
              await db.collection("notifications_sent").add({
                userId: user.userId,
                incidentId: incidentId,
                timestamp: now,
                notificationType: "incident_alert",
                sent: true,
                distance: user.distance,
                categories: categories,
                location: location,
                title: payload.notification.title,
                body: payload.notification.body,
                url: websiteUrl
              });

              console.log(`✅ Successfully sent notification to user ${user.userId}`);
              return { success: true, userId: user.userId };
              
            } catch (err: any) {
              console.error(`❌ Error sending notification to ${user.userId}:`, err);
              
              // Handle invalid FCM tokens
              if (err.code === 'messaging/invalid-registration-token' || 
                  err.code === 'messaging/registration-token-not-registered') {
                console.log(`🗑️ Removing invalid FCM token for user ${user.userId}`);
                // Optionally remove invalid token from user document
                await db.collection("users").doc(user.userId).update({
                  fcmToken: admin.firestore.FieldValue.delete()
                });
              }
              
              // Log failed notification attempt
              await db.collection("notifications_sent").add({
                userId: user.userId,
                incidentId: incidentId,
                timestamp: now,
                notificationType: "incident_alert",
                sent: false,
                error: err.message || "Unknown error",
                errorCode: err.code || "unknown",
                distance: user.distance,
                categories: categories,
                location: location
              });

              return { success: false, userId: user.userId, error: err };
            }
          });

          // Wait for current batch to complete before processing next batch
          const results = await Promise.allSettled(promises);
          
          // Add small delay between batches to avoid rate limiting
          if (i + batchSize < usersToNotify.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        totalNotificationsSent += batchNotificationsSent;
        console.log(`📊 Sent ${batchNotificationsSent} notifications for incident ${incidentId}`);
      }

      console.log(`🎉 Notification scheduler completed successfully!`);
      console.log(`📈 Summary: Processed ${totalUsersProcessed} users, sent ${totalNotificationsSent} notifications`);
      
      return { processed: totalUsersProcessed, sent: totalNotificationsSent };
      
    } catch (error) {
      console.error("💥 Error in notification scheduler:", error);
      
      // Log the error for monitoring
      await db.collection("scheduler_logs").add({
        timestamp: Date.now(),
        type: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : null
      });
      
      throw error; // Re-throw to maintain error handling behavior
    }
}



/*
 * TEST FUNCTIONS DOCUMENTATION
 * ===========================
 * 
 * These functions are designed for testing the notification system:
 * 
 * 1. testNotificationScheduler - Tests the entire notification pipeline
 *    Usage: POST/GET /testNotificationScheduler
 *    Creates a test incident and triggers the notification system
 * 
 * 2. createTestUser - Creates a test user for notification testing
 *    Usage: POST/GET /createTestUser?lat=12.9716&lng=77.5946&email=test@example.com
 *    Creates a user with specified coordinates and preferences
 * 
 * 3. cleanupTestData - Removes all test data from the database
 *    Usage: POST/GET /cleanupTestData
 *    Cleans up test users, incidents, and old notifications
 * 
 * Note: Replace TEST_FCM_TOKEN with a real FCM token for actual notification testing
 */

// Test function to manually trigger the scheduler
export const testNotificationScheduler = httpsFunction.onRequest(
  { cors: true },
  async (req: any, res: any) => {
    try {
      console.log("🧪 Manual test trigger for notification scheduler");
      
      // Create a test incident in summarized_data
      const testIncident = {
        advice: "Test advice for incident testing",
        categories: ["traffic", "emergency"],
        cluster_id: 999,
        coordinates: {
          lat: 12.9716, // Bangalore coordinates
          lng: 77.5946
        },
        descriptions: [
          "This is a test incident for notification testing. Please ignore if you receive this notification."
        ],
        geohash: "tdr1qxkc1",
        location: "Test Location, Bangalore",
        occurrences: 1,
        resolution_time: new Date(),
        source_city: "Bengaluru",
        summary: "Test incident for notification scheduler testing",
        votes: 0,
        timestamp: Date.now() // Current timestamp to trigger notifications
      };

      // Add test incident to database
      const testIncidentRef = await db.collection("summarized_data").add(testIncident);
      console.log(`✅ Test incident created with ID: ${testIncidentRef.id}`);

      // Create a mock event object that matches the scheduler event structure
      const mockEvent = {
        scheduledTime: new Date().toISOString(),
        jobName: "test-notification-scheduler"
      };

      // Manually trigger the notification function using the extracted core logic
      const result = await processIncidentNotifications();

      // Clean up - remove test incident after testing (using Promise instead of setTimeout)
      const cleanupDelay = 5000;
      await new Promise<void>((resolve) => {
        setTimeout(async () => {
          try {
            await testIncidentRef.delete();
            console.log("🧹 Test incident cleaned up");
          } catch (cleanupError) {
            console.error("⚠️ Error cleaning up test incident:", cleanupError);
          }
          resolve();
        }, cleanupDelay);
      });

      res.status(200).json({
        success: true,
        message: "Test scheduler triggered successfully",
        testIncidentId: testIncidentRef.id,
        result: result,
        note: "Test incident will be cleaned up automatically"
      });

    } catch (error) {
      console.error("❌ Error in test scheduler:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
);

// Test function to create a test user near a specific location
export const createTestUser = httpsFunction.onRequest(
  { cors: true },
  async (req: any, res: any) => {
    try {
      // Handle both GET and POST requests - use query params for GET, body for POST
      const requestData = req.method === 'GET' ? req.query : (req.body || {});
      const { lat = 12.9716, lng = 77.5946, email = "test@example.com" } = requestData;
      
      // Validate coordinates
      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lng as string);
      
      if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({
          success: false,
          error: "Invalid latitude or longitude provided"
        });
      }
      
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return res.status(400).json({
          success: false,
          error: "Coordinates out of valid range"
        });
      }
      
      // Generate unique test user data
      const timestamp = Date.now();
      const testUser = {
        categories: ["traffic", "emergency", "infrastructure"],
        createdAt: new Date(),
        email: email as string,
        fcmToken: "TEST_FCM_TOKEN_" + timestamp, // Placeholder - should be replaced with real token for testing
        lastActiveAt: new Date(),
        location: {
          geohash: geohash.encode(latitude, longitude, 9),
          lat: latitude,
          lng: longitude
        },
        name: "Test User " + timestamp,
        notifications: {
          enabled: true,
          quietHours: null
        },
        preferences: {
          manualLocality: null,
          useCurrentLocation: true
        },
        radius_km: 5,
        uid: "test_user_" + timestamp
      };

      const testUserRef = await db.collection("users").add(testUser);
      
      res.status(200).json({
        success: true,
        message: "Test user created successfully",
        testUserId: testUserRef.id,
        userData: {
          ...testUser,
          id: testUserRef.id
        },
        instructions: {
          cleanup: `To delete this test user, call DELETE /users/${testUserRef.id}`,
          fcmToken: "Replace TEST_FCM_TOKEN with a real FCM token for notification testing"
        }
      });

    } catch (error) {
      console.error("❌ Error creating test user:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
);

// Helper function to clean up test data
export const cleanupTestData = httpsFunction.onRequest(
  { cors: true },
  async (req: any, res: any) => {
    try {
      console.log("🧹 Starting cleanup of test data...");
      
      // Clean up test users (those with uid starting with "test_user_")
      const testUsersSnap = await db
        .collection("users")
        .where("uid", ">=", "test_user_")
        .where("uid", "<", "test_user_\uf8ff")
        .get();

      let deletedUsers = 0;
      for (const doc of testUsersSnap.docs) {
        await doc.ref.delete();
        deletedUsers++;
      }

      // Clean up test incidents (those with cluster_id === 999)
      const testIncidentsSnap = await db
        .collection("summarized_data")
        .where("cluster_id", "==", 999)
        .get();

      let deletedIncidents = 0;
      for (const doc of testIncidentsSnap.docs) {
        await doc.ref.delete();
        deletedIncidents++;
      }

      // Clean up old test notifications
      const testNotificationsSnap = await db
        .collection("notifications_sent")
        .where("notificationType", "==", "incident_alert")
        .where("timestamp", "<", Date.now() - 24 * 60 * 60 * 1000) // Older than 24 hours
        .limit(100) // Limit to avoid timeouts
        .get();

      let deletedNotifications = 0;
      for (const doc of testNotificationsSnap.docs) {
        await doc.ref.delete();
        deletedNotifications++;
      }

      console.log(`✅ Cleanup completed: ${deletedUsers} users, ${deletedIncidents} incidents, ${deletedNotifications} notifications`);

      res.status(200).json({
        success: true,
        message: "Test data cleanup completed",
        deleted: {
          users: deletedUsers,
          incidents: deletedIncidents,
          notifications: deletedNotifications
        }
      });

    } catch (error) {
      console.error("❌ Error during cleanup:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
);