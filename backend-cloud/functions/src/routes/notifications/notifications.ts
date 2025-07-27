import { Router } from 'express';
import admin from "../../utils/firebase";
import { Message } from "firebase-admin/messaging";
import geohash from "ngeohash";

const router = Router();
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

// Core service function to process all pending notifications
async function processAllPendingNotifications(): Promise<{
  incidentsProcessed: number;
  totalUsersProcessed: number;
  totalNotificationsSent: number;
  processingDetails: any[];
  debugInfo: any;
}> {
  try {
    console.log("🔄 Starting automated incident notification service...");
    
    const now = Date.now();
    // Look for incidents from the last 24 hours that haven't been processed
    const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);

    console.log(`Current timestamp: ${now}`);
    console.log(`24h ago timestamp: ${twentyFourHoursAgo}`);

    // First, let's check if there are ANY incidents in the collection
    const allIncidentsSnap = await db
  .collection("summarized_data")
  .orderBy("timestamp", "desc")
  .limit(5)
  .get();

    console.log(`📋 Total incidents in collection (last 10): ${allIncidentsSnap.docs.length}`);
    
    if (allIncidentsSnap.docs.length > 0) {
      console.log("📝 Sample incident data:");
      const sampleIncident = allIncidentsSnap.docs[0].data();
      console.log(`   - ID: ${allIncidentsSnap.docs[0].id}`);
      console.log(`   - Timestamp: ${sampleIncident.timestamp} (${new Date(sampleIncident.timestamp).toISOString()})`);
      console.log(`   - Location: ${sampleIncident.location}`);
      console.log(`   - Categories: ${JSON.stringify(sampleIncident.categories)}`);
      console.log(`   - Coordinates: ${JSON.stringify(sampleIncident.coordinates)}`);
    }

    allIncidentsSnap.docs.forEach(doc => {
  const data = doc.data();
  console.log(`- ${data.timestamp} (${new Date(data.timestamp).toISOString()})`);
});
    // Query incidents from the last 24 hours
    const incidentSnap = await db
      .collection("summarized_data")
      .where("timestamp", ">", twentyFourHoursAgo)
      .orderBy("timestamp", "desc")
      .get();

    console.log(`📊 Found ${incidentSnap.docs.length} incidents in last 24 hours`);

    // If no incidents in 24 hours, let's try a wider time range for debugging
    let debugIncidentSnap = null;
    if (incidentSnap.docs.length === 0) {
      console.log("🔍 No incidents in last 24 hours, checking last 7 days...");
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
      debugIncidentSnap = await db
        .collection("summarized_data")
        .where("timestamp", ">", sevenDaysAgo)
        .orderBy("timestamp", "desc")
        .get();
      
      console.log(`📊 Found ${debugIncidentSnap.docs.length} incidents in last 7 days`);
    }

    if (incidentSnap.docs.length === 0) {
      console.log("ℹ️ No incidents found for processing in the last 24 hours.");
      return {
        incidentsProcessed: 0,
        totalUsersProcessed: 0,
        totalNotificationsSent: 0,
        processingDetails: [],
        debugInfo: {
          currentTimestamp: now,
          searchTimestamp: twentyFourHoursAgo,
          totalIncidentsInCollection: allIncidentsSnap.docs.length,
          incidentsInLast24Hours: incidentSnap.docs.length,
          incidentsInLast7Days: debugIncidentSnap ? debugIncidentSnap.docs.length : 0,
          sampleIncident: allIncidentsSnap.docs.length > 0 ? {
            id: allIncidentsSnap.docs[0].id,
            timestamp: allIncidentsSnap.docs[0].data().timestamp,
            location: allIncidentsSnap.docs[0].data().location,
            hasCoordinates: !!(allIncidentsSnap.docs[0].data().coordinates?.lat && allIncidentsSnap.docs[0].data().coordinates?.lng)
          } : null
        }
      };
    }

    let totalNotificationsSent = 0;
    let totalUsersProcessed = 0;
    const processingDetails: any[] = [];
    const websiteUrl = "https://nagar-chakshu.web.app";
    let incidentsSkipped = 0;
    let incidentsWithoutCoordinates = 0;
    let alreadyProcessedCount = 0;

    for (const doc of incidentSnap.docs) {
      const incident = doc.data();
      const incidentId = doc.id;
      
      console.log(`\n🔍 Checking incident ${incidentId}:`);
      console.log(`   - Location: ${incident.location}`);
      console.log(`   - Timestamp: ${incident.timestamp} (${new Date(incident.timestamp).toISOString()})`);
      console.log(`   - Categories: ${JSON.stringify(incident.categories)}`);
      console.log(`   - Coordinates: ${JSON.stringify(incident.coordinates)}`);
      
      // Check if this incident has already been processed for notifications
      const existingNotificationSnap = await db
        .collection("incident_notification_status")
        .where("incidentId", "==", incidentId)
        .where("processed", "==", true)
        .limit(1)
        .get();

      if (!existingNotificationSnap.empty) {
        console.log(`⏭️ Skipping incident ${incidentId} - already processed`);
        alreadyProcessedCount++;
        continue;
      }

      // Extract incident data
      const lat = incident.coordinates?.lat;
      const lng = incident.coordinates?.lng;
      const summary = incident.summary || "New incident reported in your area";
      const description = incident.descriptions?.[0] || summary;
      const location = incident.location || "Unknown location";
      const categories = incident.categories || [];
      const advice = incident.advice;

      if (!lat || !lng) {
        console.log(`⚠️ Skipping incident ${incidentId} - missing coordinates (lat: ${lat}, lng: ${lng})`);
        incidentsWithoutCoordinates++;
        
        // Mark as processed but with error
        await db.collection("incident_notification_status").add({
          incidentId,
          processed: true,
          success: false,
          error: "Missing coordinates",
          timestamp: now,
          usersNotified: 0
        });
        continue;
      }

      console.log(`🔍 Processing incident ${incidentId} at ${location} (${lat}, ${lng})`);
      console.log(`📋 Categories: ${categories.join(', ')}`);

      // Check if there are any users in the system
      const totalUsersSnap = await db.collection("users").limit(10).get();
      console.log(`👥 Total users in system (sample): ${totalUsersSnap.docs.length}`);
      
      if (totalUsersSnap.docs.length > 0) {
        const sampleUser = totalUsersSnap.docs[0].data();
        console.log(`👤 Sample user data:`);
        console.log(`   - Has FCM token: ${!!sampleUser.fcmToken}`);
        console.log(`   - Notifications enabled: ${sampleUser.notifications?.enabled}`);
        console.log(`   - Location: ${JSON.stringify(sampleUser.location)}`);
        console.log(`   - Categories: ${JSON.stringify(sampleUser.categories)}`);
        console.log(`   - Radius: ${sampleUser.radius_km}km`);
      }

      // Use maximum 10km radius for geohash bounds to cover wider area
      const maxRadiusInM = 10000;
      const bounds = getGeohashBounds(lat, lng, maxRadiusInM);
      console.log(`🗺️ Generated ${bounds.length} geohash bounds: ${bounds.slice(0, 3).join(', ')}${bounds.length > 3 ? '...' : ''}`);

      const usersToNotify: any[] = [];
      let incidentUsersProcessed = 0;
      let usersInBounds = 0;
      let usersWithoutFCM = 0;
      let usersNotificationsDisabled = 0;
      let usersInQuietHours = 0;
      let usersNotInterested = 0;
      let usersOutOfRange = 0;
      let usersAlreadyNotified = 0;

      // Query users within geohash bounds
      for (const bound of bounds) {
        const userSnap = await db
          .collection("users")
          .where("location.geohash", ">=", bound)
          .where("location.geohash", "<", bound + '\uf8ff')
          .get();

        usersInBounds += userSnap.docs.length;
        console.log(`   🔍 Found ${userSnap.docs.length} users in geohash bound: ${bound}`);

        for (const userDoc of userSnap.docs) {
          const user = userDoc.data();
          const userId = userDoc.id;
          incidentUsersProcessed++;
          
          // Validate user data
          if (!user.location?.lat || !user.location?.lng || !user.fcmToken) {
            usersWithoutFCM++;
            continue;
          }

          // Check if notifications are enabled
          if (!user.notifications?.enabled) {
            usersNotificationsDisabled++;
            continue;
          }

          // Check quiet hours
          if (isInQuietHours(user.notifications?.quietHours)) {
            usersInQuietHours++;
            continue;
          }

          // Check if user is interested in this type of incident
          if (!shouldNotifyUser(user.categories, categories)) {
            usersNotInterested++;
            continue;
          }

          const distance = calculateDistance(lat, lng, user.location.lat, user.location.lng);

          // Check user's custom radius preference (convert km to meters)
          const userRadiusInM = (user.radius_km || 5) * 1000; // Default 5km if not set

          if (distance <= userRadiusInM) {
            // Check if user already notified for this specific incident
            const existingUserNotification = await db
              .collection("notifications_sent")
              .where("userId", "==", userId)
              .where("incidentId", "==", incidentId)
              .limit(1)
              .get();

            if (existingUserNotification.empty) {
              usersToNotify.push({ 
                ...user, 
                userId,
                distance: Math.round(distance)
              });
            } else {
              usersAlreadyNotified++;
            }
          } else {
            usersOutOfRange++;
          }
        }
      }

      console.log(`📤 User filtering results for incident ${incidentId}:`);
      console.log(`   - Users in geohash bounds: ${usersInBounds}`);
      console.log(`   - Users without FCM/location: ${usersWithoutFCM}`);
      console.log(`   - Users with notifications disabled: ${usersNotificationsDisabled}`);
      console.log(`   - Users in quiet hours: ${usersInQuietHours}`);
      console.log(`   - Users not interested in categories: ${usersNotInterested}`);
      console.log(`   - Users out of range: ${usersOutOfRange}`);
      console.log(`   - Users already notified: ${usersAlreadyNotified}`);
      console.log(`   - Final eligible users: ${usersToNotify.length}`);

      totalUsersProcessed += incidentUsersProcessed;

      let incidentNotificationsSent = 0;

      if (usersToNotify.length > 0) {
        // Prepare notification payload
        const incidentEmoji = getIncidentEmoji(categories);
        const formattedCategories = formatCategories(categories);

        // Send FCM notifications in batches
        const batchSize = 10;

        for (let i = 0; i < usersToNotify.length; i += batchSize) {
          const batch = usersToNotify.slice(i, i + batchSize);
          
          const promises = batch.map(async (user) => {
            const payload = {
              notification: {
                title: `${incidentEmoji} Incident Alert - ${formattedCategories}`,
                body: `${description.substring(0, 120)}${description.length > 120 ? '...' : ''}\n📍 ${location} (${user.distance}m away)`,
                icon: './logo.png',
                badge: './badge.png',
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
                link: websiteUrl,
                url: websiteUrl,
                coordinates: JSON.stringify({ lat, lng })
              },
              fcmOptions: {
                link: websiteUrl,
                analyticsLabel: `incident_${incidentId}`
              }
            };

            try {
              await admin.messaging().sendToDevice(user.fcmToken, payload);
              incidentNotificationsSent++;

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
                url: websiteUrl,
                source: "automated_service"
              });

              return { success: true, userId: user.userId };
              
            } catch (err: any) {
              console.error(`❌ Error sending notification to ${user.userId}:`, err);
              
              // Handle invalid FCM tokens
              if (err.code === 'messaging/invalid-registration-token' || 
                  err.code === 'messaging/registration-token-not-registered') {
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
                location: location,
                source: "automated_service"
              });

              return { success: false, userId: user.userId, error: err };
            }
          });

          // Wait for current batch to complete
          await Promise.allSettled(promises);
          
          // Small delay between batches
          if (i + batchSize < usersToNotify.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      // Mark incident as processed
      await db.collection("incident_notification_status").add({
        incidentId,
        processed: true,
        success: true,
        timestamp: now,
        usersEligible: usersToNotify.length,
        usersNotified: incidentNotificationsSent,
        totalUsersInArea: incidentUsersProcessed,
        location: location,
        categories: categories
      });

      totalNotificationsSent += incidentNotificationsSent;

      processingDetails.push({
        incidentId,
        location,
        categories,
        usersInArea: incidentUsersProcessed,
        usersEligible: usersToNotify.length,
        notificationsSent: incidentNotificationsSent,
        userFilteringStats: {
          usersInBounds,
          usersWithoutFCM,
          usersNotificationsDisabled,
          usersInQuietHours,
          usersNotInterested,
          usersOutOfRange,
          usersAlreadyNotified
        }
      });

      console.log(`✅ Processed incident ${incidentId}: ${incidentNotificationsSent} notifications sent`);
    }

    console.log(`🎉 Automated notification service completed!`);
    console.log(`📈 Summary: ${incidentSnap.docs.length} incidents processed, ${totalUsersProcessed} users checked, ${totalNotificationsSent} notifications sent`);
    console.log(`📊 Incidents skipped: Already processed: ${alreadyProcessedCount}, Missing coordinates: ${incidentsWithoutCoordinates}`);

    return {
      incidentsProcessed: incidentSnap.docs.length,
      totalUsersProcessed,
      totalNotificationsSent,
      processingDetails,
      debugInfo: {
        currentTimestamp: now,
        searchTimestamp: twentyFourHoursAgo,
        incidentsFound: incidentSnap.docs.length,
        alreadyProcessedCount,
        incidentsWithoutCoordinates,
        totalUsersInSystem: totalUsersProcessed > 0 ? "Found users" : "No users found in geohash bounds"
      }
    };

  } catch (error) {
    console.error("💥 Error in automated notification service:", error);
    
    // Log the error
    await db.collection("service_error_logs").add({
      service: "automated_notifications",
      timestamp: Date.now(),
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : null
    });
    
    throw error;
  }
}

// POST /api/notifications/process-all - Main endpoint to trigger the automated service
router.post('/process-all', async (req, res) => {
  try {
    console.log("🚀 Manual trigger for automated notification service");
    
    const result = await processAllPendingNotifications();
    
    res.status(200).json({
      success: true,
      message: "Automated notification processing completed successfully",
      timestamp: new Date().toISOString(),
      statistics: {
        incidentsProcessed: result.incidentsProcessed,
        totalUsersProcessed: result.totalUsersProcessed,
        totalNotificationsSent: result.totalNotificationsSent,
        averageNotificationsPerIncident: result.incidentsProcessed > 0 
          ? Math.round(result.totalNotificationsSent / result.incidentsProcessed) 
          : 0
      },
      processingDetails: result.processingDetails,
      debugInfo: result.debugInfo
    });

  } catch (error) {
    console.error("❌ Error in automated notification service:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred during processing"
    });
  }
});

// GET /api/notifications/status - Get processing status and statistics
router.get('/status', async (req, res) => {
  try {
    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

    // Get recent incidents
    const incidentsSnap = await db
      .collection("summarized_data")
      .where("timestamp", ">", twentyFourHoursAgo)
      .orderBy("timestamp", "desc")
      .limit(10)
      .get();

    // Get processing status
    const processedIncidentsSnap = await db
      .collection("incident_notification_status")
      .where("timestamp", ">", twentyFourHoursAgo)
      .orderBy("timestamp", "desc")
      .limit(10)
      .get();

    // Get recent notifications
    const recentNotificationsSnap = await db
      .collection("notifications_sent")
      .where("timestamp", ">", twentyFourHoursAgo)
      .where("source", "==", "automated_service")
      .orderBy("timestamp", "desc")
      .limit(5)
      .get();

    const recentIncidents = incidentsSnap.docs.map(doc => ({
      id: doc.id,
      location: doc.data().location,
      categories: doc.data().categories,
      timestamp: doc.data().timestamp,
      coordinates: doc.data().coordinates
    }));

    const processedIncidents = processedIncidentsSnap.docs.map(doc => ({
      incidentId: doc.data().incidentId,
      processed: doc.data().processed,
      success: doc.data().success,
      usersNotified: doc.data().usersNotified,
      timestamp: doc.data().timestamp,
      location: doc.data().location
    }));

    const recentNotifications = recentNotificationsSnap.docs.map(doc => ({
      incidentId: doc.data().incidentId,
      sent: doc.data().sent,
      timestamp: doc.data().timestamp,
      location: doc.data().location
    }));

    // Calculate statistics
    const totalNotificationsSent = await db
      .collection("notifications_sent")
      .where("timestamp", ">", twentyFourHoursAgo)
      .where("source", "==", "automated_service")
      .where("sent", "==", true)
      .count()
      .get();

    const totalProcessedIncidents = processedIncidents.filter(inc => inc.success).length;

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      statistics: {
        recentIncidents: recentIncidents.length,
        processedIncidents: totalProcessedIncidents,
        totalNotificationsSent: totalNotificationsSent.data().count,
        pendingIncidents: recentIncidents.length - totalProcessedIncidents
      },
      recentIncidents,
      processedIncidents,
      recentNotifications,
      serviceInfo: {
        description: "Automated incident notification service",
        lastProcessingTime: processedIncidents.length > 0 ? processedIncidents[0].timestamp : null,
        endpoints: {
          triggerService: "POST /api/notifications/process-all",
          checkStatus: "GET /api/notifications/status",
          serviceHealth: "GET /api/notifications/health"
        }
      }
    });

  } catch (error) {
    console.error("❌ Error getting service status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve service status"
    });
  }
});

// GET /api/notifications/debug - Debug endpoint to check data availability
router.get('/debug', async (req, res) => {
  try {
    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    // Check incidents
    const allIncidentsCount = await db.collection("summarized_data").count().get();
    const recentIncidentsSnap = await db
      .collection("summarized_data")
      .orderBy("timestamp", "desc")
      .limit(5)
      .get();

    const incidentsLast24h = await db
      .collection("summarized_data")
      .where("timestamp", ">", twentyFourHoursAgo)
      .count()
      .get();

    const incidentsLast7days = await db
      .collection("summarized_data")
      .where("timestamp", ">", sevenDaysAgo)
      .count()
      .get();

    // Check users
    const allUsersCount = await db.collection("users").count().get();
    const usersWithFCMSnap = await db
      .collection("users")
      .where("fcmToken", "!=", null)
      .limit(5)
      .get();

    const usersWithNotificationsEnabled = await db
      .collection("users")
      .where("notifications.enabled", "==", true)
      .count()
      .get();

    // Check notification status
    const processedIncidentsSnap = await db
      .collection("incident_notification_status")
      .orderBy("timestamp", "desc")
      .limit(5)
      .get();

    // Sample data
    const sampleIncidents = recentIncidentsSnap.docs.map(doc => ({
      id: doc.id,
      timestamp: doc.data().timestamp,
      timestampISO: new Date(doc.data().timestamp).toISOString(),
      location: doc.data().location,
      categories: doc.data().categories,
      hasCoordinates: !!(doc.data().coordinates?.lat && doc.data().coordinates?.lng),
      coordinates: doc.data().coordinates
    }));

    const sampleUsers = usersWithFCMSnap.docs.map(doc => ({
      id: doc.id,
      hasLocation: !!(doc.data().location?.lat && doc.data().location?.lng),
      hasGeohash: !!doc.data().location?.geohash,
      notificationsEnabled: doc.data().notifications?.enabled,
      categories: doc.data().categories,
      radiusKm: doc.data().radius_km,
      location: doc.data().location
    }));

    const processedIncidents = processedIncidentsSnap.docs.map(doc => ({
      incidentId: doc.data().incidentId,
      processed: doc.data().processed,
      success: doc.data().success,
      timestamp: doc.data().timestamp,
      timestampISO: new Date(doc.data().timestamp).toISOString(),
      usersNotified: doc.data().usersNotified
    }));

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      currentTimestamp: now,
      searchTimestamp: twentyFourHoursAgo,
      debugInfo: {
        incidents: {
          total: allIncidentsCount.data().count,
          last24Hours: incidentsLast24h.data().count,
          last7Days: incidentsLast7days.data().count,
          sampleIncidents
        },
        users: {
          total: allUsersCount.data().count,
          withNotificationsEnabled: usersWithNotificationsEnabled.data().count,
          withFCMTokens: usersWithFCMSnap.docs.length,
          sampleUsers
        },
        processing: {
          processedIncidents: processedIncidentsSnap.docs.length,
          sampleProcessedIncidents: processedIncidents
        },
        timeRanges: {
          now: `${now} (${new Date(now).toISOString()})`,
          twentyFourHoursAgo: `${twentyFourHoursAgo} (${new Date(twentyFourHoursAgo).toISOString()})`,
          sevenDaysAgo: `${sevenDaysAgo} (${new Date(sevenDaysAgo).toISOString()})`
        }
      }
    });

  } catch (error) {
    console.error("❌ Error in debug endpoint:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve debug information"
    });
  }
});

// GET /api/notifications/health - Health check endpoint
router.get('/health', async (req, res) => {
  try {
    // Test database connectivity
    const testQuery = await db.collection("users").limit(1).get();
    
    res.status(200).json({
      success: true,
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "automated-notification-service",
      database: "connected",
      version: "1.0.0",
      features: [
        "Automated incident detection",
        "Geohash-based user matching",
        "Batch notification processing",
        "User preference filtering",
        "Quiet hours support",
        "Duplicate prevention"
      ]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: "unhealthy",
      error: "Database connection failed"
    });
  }
});

export default router;