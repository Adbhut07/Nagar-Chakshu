import express from "express";
import admin from "../../utils/firebase";

const router = express.Router();
const db = admin.firestore();

// Interface for processed data structure
interface ProcessedData {
  advice: string;
  categories: string[];
  coordinates: {
    lat: number;
    lng: number;
  };
  description: string;
  image_url: string;
  location: string;
  resolution_time?: {
    __time__: string;
  };
  source_city: string;
  source_id: string;
}

interface ProcessedResponse {
  id: string;
  advice: string;
  categories: string[];
  coordinates: {
    lat: number;
    lng: number;
  };
  description: string;
  image_url: string;
  location: string;
  resolution_time: string | null;
  source_city: string;
  source_id: string;
  distance: number;
}

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
    const radius = parseFloat(req.query.radius as string) || 1000; // default 1km radius

    if (isNaN(lat) || isNaN(lng) || isNaN(radius)) {
      return res.status(400).json({ error: "Invalid lat, lng, or radius parameters" });
    }

    // Validate coordinate ranges
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ error: "Invalid coordinate values" });
    }

    const snapshot = await db.collection("processed_data").get();

    if (snapshot.empty) {
      return res.status(200).json({ 
        message: "No processed data available",
        processed_data: [],
        count: 0
      });
    }

    const results: ProcessedResponse[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data() as ProcessedData;
      const coordinates = data.coordinates;

      if (coordinates && 
          typeof coordinates.lat === 'number' && 
          typeof coordinates.lng === 'number') {
        
        const distance = haversineDistance(lat, lng, coordinates.lat, coordinates.lng);
        
        if (distance <= radius) {
          // Convert Firestore timestamp to readable format if exists
          const resolutionTime = data.resolution_time?.__time__ 
            ? new Date(data.resolution_time.__time__).toISOString()
            : null;

          results.push({
            id: doc.id,
            advice: data.advice,
            categories: data.categories,
            coordinates: data.coordinates,
            description: data.description,
            image_url: data.image_url,
            location: data.location,
            resolution_time: resolutionTime,
            source_city: data.source_city,
            source_id: data.source_id,
            distance: Math.round(distance), // Round distance to nearest meter
          });
        }
      }
    });

    // Sort by distance (closest first)
    results.sort((a, b) => a.distance - b.distance);

    res.status(200).json({ 
      message: "Processed data retrieved successfully",
      processed_data: results,
      count: results.length,
      search_radius: radius,
      search_coordinates: { lat, lng }
    });
  } catch (error) {
    console.error("Error fetching processed data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
