import * as functions from "firebase-functions/v2/scheduler";
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
  // For 2km radius, precision 5 should be sufficient
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
  
  const startHour = parseInt(quietHours.start.split(':')[0]);
  const endHour = parseInt(quietHours.end.split(':')[0]);
  
  if (startHour < endHour) {
    return currentHour >= startHour && currentHour < endHour;
  } else {
    // Quiet hours span midnight
    return currentHour >= startHour || currentHour < endHour;
  }
};

export const notifyUsersOnNewIncidents = functions.onSchedule(
  { schedule: "every 15 minutes" },
  async (event) => {
    try {
      console.log("Starting notification cron job...");
      
      const now = Date.now();
      const fifteenMinutesAgo = now - 15 * 60 * 1000;

      // Query new incidents from summarized_data collection
      const incidentSnap = await db
        .collection("summarized_data")
        .where("timestamp", ">", fifteenMinutesAgo)
        .get();

      console.log(`Found ${incidentSnap.docs.length} new incidents to process`);

      for (const doc of incidentSnap.docs) {
        const incident = doc.data();
        const incidentId = doc.id;
        
        // Extract coordinates from the nested structure
        const lat = incident.coordinates?.lat;
        const lng = incident.coordinates?.lng;
        const summary = incident.summary;
        const categories = incident.categories || [];

        if (!lat || !lng) {
          console.log(`Skipping incident ${incidentId} - missing coordinates`);
          continue;
        }

        console.log(`Processing incident ${incidentId} at coordinates (${lat}, ${lng})`);

        // Use 2km radius as specified
        const radiusInM = 2000;
        const bounds = getGeohashBounds(lat, lng, radiusInM);

        const usersToNotify: any[] = [];

        // Query users within geohash bounds
        for (const bound of bounds) {
          const userSnap = await db
            .collection("users")
            .where("location.geohash", ">=", bound)
            .where("location.geohash", "<", bound + '\uf8ff')
            .get();

          for (const userDoc of userSnap.docs) {
            const user = userDoc.data();
            const userId = userDoc.id;
            
            // Check if user has required data
            if (!user.location?.lat || !user.location?.lng || !user.fcmToken) {
              console.log(`Skipping user ${userId} - missing location or FCM token`);
              continue;
            }

            // Check if notifications are enabled
            if (!user.notifications?.enabled) {
              console.log(`Skipping user ${userId} - notifications disabled`);
              continue;
            }

            // Check quiet hours
            if (isInQuietHours(user.notifications?.quietHours)) {
              console.log(`Skipping user ${userId} - in quiet hours`);
              continue;
            }

            // Check if user is interested in this type of incident
            if (!shouldNotifyUser(user.categories, categories)) {
              console.log(`Skipping user ${userId} - not interested in categories: ${categories.join(', ')}`);
              continue;
            }

            const distance = calculateDistance(lat, lng, user.location.lat, user.location.lng);

            // Check user's custom radius preference (convert km to meters)
            const userRadiusInM = (user.radius_km || 2) * 1000;
            const effectiveRadius = Math.min(radiusInM, userRadiusInM);

            if (distance <= effectiveRadius) {
              // Check if already notified
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
                console.log(`Added user ${userId} to notification list (distance: ${Math.round(distance)}m)`);
              } else {
                console.log(`User ${userId} already notified for incident ${incidentId}`);
              }
            } else {
              console.log(`User ${userId} outside radius (distance: ${Math.round(distance)}m, max: ${effectiveRadius}m)`);
            }
          }
        }

        console.log(`Sending notifications to ${usersToNotify.length} users for incident ${incidentId}`);

        // Send FCM notifications in batches to avoid overwhelming the service
        const batchSize = 10;
        for (let i = 0; i < usersToNotify.length; i += batchSize) {
          const batch = usersToNotify.slice(i, i + batchSize);
          
          const promises = batch.map(async (user) => {
            const payload = {
              notification: {
                title: `🚨 Incident Alert`,
                body: summary || "New incident reported in your area.",
              },
              data: {
                incidentId: incidentId,
                type: "incident_alert",
                timestamp: now.toString(),
                distance: user.distance.toString(),
                location: incident.location || "Unknown location",
                categories: categories.join(',')
              }
            };

            try {
              await admin.messaging().sendToDevice(user.fcmToken, payload);

              // Log successful notification
              await db.collection("notifications_sent").add({
                userId: user.userId,
                incidentId: incidentId,
                timestamp: now,
                notificationType: "incident_alert",
                sent: true,
                distance: user.distance,
                categories: categories
              });

              console.log(`Successfully sent notification to user ${user.userId}`);
              return { success: true, userId: user.userId };
              
            } catch (err) {
              console.error(`Error sending notification to ${user.userId}:`, err);
              
              // Log failed notification attempt
              await db.collection("notifications_sent").add({
                userId: user.userId,
                incidentId: incidentId,
                timestamp: now,
                notificationType: "incident_alert",
                sent: false,
                error: err instanceof Error ? err.message : "Unknown error",
                distance: user.distance,
                categories: categories
              });

              return { success: false, userId: user.userId, error: err };
            }
          });

          // Wait for current batch to complete before processing next batch
          await Promise.allSettled(promises);
        }
      }

      console.log("Notification cron job completed successfully");
      
    } catch (error) {
      console.error("Error in notification cron job:", error);
    }
  });