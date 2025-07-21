import express from "express";
import admin from "../../utils/firebase";
import geohash from "ngeohash";

const router = express.Router();
const db = admin.firestore();

// Middleware to verify Firebase token
const verifyToken = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const token = authHeader.substring(7);
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Error verifying token:", error);
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

// POST /register - Register new user
router.post("/register", verifyToken, async (req: express.Request, res: express.Response) => {
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

    // Verify that the token uid matches the request uid
    if (req.user?.uid !== uid) {
      return res.status(403).json({ error: "Forbidden: UID mismatch" });
    }

    // Basic validation
    if (!uid || !name || !email || !location) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (typeof location.lat !== "number" || typeof location.lng !== "number") {
      return res.status(400).json({ error: "Invalid location coordinates" });
    }

    // Check if user already exists
    const existingUser = await db.collection("users").doc(uid).get();
    if (existingUser.exists) {
      return res.status(409).json({ error: "User already registered" });
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
        enabled: notifications?.enabled ?? true,
        quietHours: notifications?.quietHours || null,
      },
      preferences: {
        useCurrentLocation: preferences?.useCurrentLocation ?? true,
        manualLocality: preferences?.manualLocality || null,
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastActiveAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("users").doc(uid).set(userData);

    const responseData: any = { ...userData };
    delete responseData.createdAt;
    delete responseData.lastActiveAt;

    res.status(201).json({ 
      message: "User registered successfully",
      user: responseData
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /user/profile - Get user profile (used to check registration status)
router.get("/user/profile", verifyToken, async (req: express.Request, res: express.Response) => {
  try {
    const uid = req.user?.uid;
    
    if (!uid) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const userDoc = await db.collection("users").doc(uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userDoc.data();
    
    // Update last active timestamp
    await db.collection("users").doc(uid).update({
      lastActiveAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Remove sensitive/internal fields before sending
    const responseData = { ...userData };
    delete responseData.createdAt;
    delete responseData.lastActiveAt;

    res.status(200).json({
      message: "User profile retrieved successfully",
      user: responseData
    });
  } catch (error) {
    console.error("Error getting user profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /user/profile - Update user profile
router.put("/user/profile", verifyToken, async (req: express.Request, res: express.Response) => {
  try {
    const uid = req.user?.uid;
    
    if (!uid) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Check if user exists
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const {
      name,
      profilePhotoUrl,
      location,
      radius_km,
      categories,
      notifications,
      preferences
    } = req.body;

    const updateData: any = {
      lastActiveAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Only update provided fields
    if (name !== undefined) updateData.name = name;
    if (profilePhotoUrl !== undefined) updateData.profilePhotoUrl = profilePhotoUrl;
    if (radius_km !== undefined) updateData.radius_km = radius_km;
    if (categories !== undefined) updateData.categories = categories;
    if (notifications !== undefined) updateData.notifications = notifications;
    if (preferences !== undefined) updateData.preferences = preferences;

    // Handle location update
    if (location && typeof location.lat === "number" && typeof location.lng === "number") {
      const geohashCode = geohash.encode(location.lat, location.lng);
      updateData.location = {
        lat: location.lat,
        lng: location.lng,
        geohash: geohashCode,
      };
    }

    await db.collection("users").doc(uid).update(updateData);

    res.status(200).json({ message: "User profile updated successfully" });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /user/profile - Delete user account
router.delete("/user/profile", verifyToken, async (req: express.Request, res: express.Response) => {
  try {
    const uid = req.user?.uid;
    
    if (!uid) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Check if user exists
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    // Delete user from Firestore
    await db.collection("users").doc(uid).delete();

    // Optionally delete user from Firebase Auth
    try {
      await admin.auth().deleteUser(uid);
    } catch (authError) {
      console.warn("Could not delete user from Firebase Auth:", authError);
      // Continue with the response even if auth deletion fails
    }

    res.status(200).json({ message: "User account deleted successfully" });
  } catch (error) {
    console.error("Error deleting user account:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /user/location - Update user location only
router.post("/user/location", verifyToken, async (req: express.Request, res: express.Response) => {
  try {
    const uid = req.user?.uid;
    
    if (!uid) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const { location } = req.body;

    if (!location || typeof location.lat !== "number" || typeof location.lng !== "number") {
      return res.status(400).json({ error: "Invalid location coordinates" });
    }

    // Check if user exists
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const geohashCode = geohash.encode(location.lat, location.lng);

    await db.collection("users").doc(uid).update({
      location: {
        lat: location.lat,
        lng: location.lng,
        geohash: geohashCode,
      },
      lastActiveAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({ message: "Location updated successfully" });
  } catch (error) {
    console.error("Error updating location:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /user/preferences - Get user preferences
router.get("/user/preferences", verifyToken, async (req: express.Request, res: express.Response) => {
  try {
    const uid = req.user?.uid;
    
    if (!uid) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const userDoc = await db.collection("users").doc(uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userDoc.data();

    res.status(200).json({
      preferences: userData?.preferences || {},
      notifications: userData?.notifications || {},
      categories: userData?.categories || [],
      radius_km: userData?.radius_km || 2
    });
  } catch (error) {
    console.error("Error getting user preferences:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /user/preferences - Update user preferences
router.put("/user/preferences", verifyToken, async (req: express.Request, res: express.Response) => {
  try {
    const uid = req.user?.uid;
    
    if (!uid) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const { preferences, notifications, categories, radius_km } = req.body;

    // Check if user exists
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const updateData: any = {
      lastActiveAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (preferences !== undefined) updateData.preferences = preferences;
    if (notifications !== undefined) updateData.notifications = notifications;
    if (categories !== undefined) updateData.categories = categories;
    if (radius_km !== undefined) updateData.radius_km = radius_km;

    await db.collection("users").doc(uid).update(updateData);

    res.status(200).json({ message: "Preferences updated successfully" });
  } catch (error) {
    console.error("Error updating preferences:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /user/stats - Get user statistics
router.get("/user/stats", verifyToken, async (req: express.Request, res: express.Response) => {
  try {
    const uid = req.user?.uid;
    
    if (!uid) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const userDoc = await db.collection("users").doc(uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userDoc.data();

    // You can add more statistics here as needed
    const stats = {
      registrationDate: userData?.createdAt,
      lastActive: userData?.lastActiveAt,
      categoriesCount: userData?.categories?.length || 0,
      currentRadius: userData?.radius_km || 2,
      locationEnabled: userData?.preferences?.useCurrentLocation || false
    };

    res.status(200).json({
      message: "User statistics retrieved successfully",
      stats
    });
  } catch (error) {
    console.error("Error getting user stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;