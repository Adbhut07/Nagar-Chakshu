import express from "express";
import admin from "firebase-admin";
import geohash from "ngeohash";

const router = express.Router();
const db = admin.firestore();

router.post("/", async (req, res) => {
  try {
    const { 
      uid,
      name,
      email,
      profilePhotoUrl,
      location,
      radius_km = 2,
      categories = [],
      notifications,
      preferences
    } = req.body;

    // Basic validation
    if (!uid || !name || !email || !location || !notifications?.fcmToken) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (typeof location.lat !== "number" || typeof location.lng !== "number") {
      return res.status(400).json({ error: "Invalid location coordinates" });
    }

    const geohashCode = geohash.encode(location.lat, location.lng);

    const userData = {
      uid,
      name,
      email,
      profilePhotoUrl: profilePhotoUrl || "",
      location: {
        lat: location.lat,
        lng: location.lng,
        geohash: geohashCode,
      },
      radius_km,
      categories,
      notifications: {
        enabled: notifications.enabled ?? true,
        quietHours: notifications.quietHours || null,
        fcmToken: notifications.fcmToken,
      },
      preferences: {
        useCurrentLocation: preferences?.useCurrentLocation ?? true,
        manualLocality: preferences?.manualLocality || null,
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastActiveAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("users").doc(uid).set(userData, { merge: true });

    res.status(200).json({ message: "User registered/updated successfully" });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
