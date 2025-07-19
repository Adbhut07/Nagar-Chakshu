import {onRequest} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

const db = admin.firestore();

export const submitReport = onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  try {
    const {type, message, location, mediaUrl} = req.body;

    if (!type || !message || !location?.lat || !location?.lng) {
      res.status(400).send({error: "Missing required fields"});
      return;
    }

    const docRef = await db.collection("reports").add({
      type,
      message,
      location,
      mediaUrl: mediaUrl || null,
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).send({success: true, id: docRef.id});
  } catch (err) {
    res.status(500).send({error: "Error submitting report"});
  }
});
