import express from "express";
import admin from "../../utils/firebase";

const router = express.Router();
const db = admin.firestore();

router.post("/", async (req, res) => {
  try {
    const { description, mediaUrl, location, place } = req.body;

    if (!description || !mediaUrl || !location || !place) {
      return res.status(400).json({ error: "All fields are required." });
    }

    if (
      typeof location.latitude !== "number" ||
      typeof location.longitude !== "number"
    ) {
      return res.status(400).json({ error: "Invalid location coordinates." });
    }

    const report = {
      description,
      mediaUrl,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
      },
      place,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection("user_reports").add(report);

    res.status(201).json({ message: "Report submitted", id: docRef.id });
  } catch (error) {
    console.error("Error submitting report:", error);
    res.status(500).json({ error: "Failed to submit report" });
  }
});

export default router;
