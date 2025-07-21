import express from "express";
import admin from "../../utils/firebase";

const router = express.Router(); 
const db = admin.firestore();

router.get("/", async (req, res) => {
  try {
    const snapshot = await db.collection("social_media_posts").get();
    const posts = snapshot.docs.map((doc) => doc.data());

    res.status(200).json({ data: posts });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

export default router;
