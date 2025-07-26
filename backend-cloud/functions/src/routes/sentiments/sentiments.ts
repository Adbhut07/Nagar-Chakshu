import express from "express";
import admin from "../../utils/firebase";

const router = express.Router();
const db = admin.firestore();

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

// Haversine formula to calculate distance in meters
const haversineDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371e3; // meters
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lng2 - lng1);
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

router.get("/", verifyToken, async (req: express.Request, res: express.Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radius = parseFloat(req.query.radius as string); 
    const limit = parseInt(req.query.limit as string) || 200; 

    if (isNaN(lat) || isNaN(lng) || isNaN(radius)) {
      return res.status(400).json({ error: "Invalid lat, lng or radius" });
    }

    // Validate limit parameter
    if (limit < 1 || limit > 500) {
      return res.status(400).json({ error: "Limit must be between 1 and 500" });
    }

    const snapshot = await db.collection("sentiment_data").get();
    const results: any[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      const coordinates = data.coordinates;
      
      if (coordinates && coordinates.lat && coordinates.lng) {
        const distance = haversineDistance(lat, lng, coordinates.lat, coordinates.lng);
        
        if (distance <= radius) {
          // Exclude resolution_time from the response
          const { resolution_time, ...dataWithoutResolutionTime } = data;
          results.push({
            id: doc.id,
            ...dataWithoutResolutionTime,
            distance,
          });
        }
      }
    });

    // Limit to top results (no sorting, just limit the number of results)
    const limitedResults = results.slice(0, limit);

    // Get sentiment distribution
    const sentimentCounts: { [key: string]: number } = {};
    const categoryCounts: { [key: string]: number } = {};
    
    limitedResults.forEach(item => {
      // Count sentiments
      if (item.sentiment) {
        sentimentCounts[item.sentiment] = (sentimentCounts[item.sentiment] || 0) + 1;
      }
      
      // Count categories
      if (item.categories && Array.isArray(item.categories)) {
        item.categories.forEach((category: string) => {
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });
      }
    });

    res.status(200).json({
      message: "Sentiment incidents retrieved successfully",
      incidents: limitedResults,
      totalFound: results.length,
      returned: limitedResults.length,
      sentimentDistribution: sentimentCounts,
      categoryDistribution: categoryCounts
    });

  } catch (error) {
    console.error("Error fetching sentiment incidents:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;