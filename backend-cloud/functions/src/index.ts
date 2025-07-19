import * as functions from "firebase-functions";
import admin from "firebase-admin";
import express from "express";
import cors from "cors";

// Initialize Firebase Admin SDK
admin.initializeApp();

const app = express();
app.use(cors({origin: true}));
app.use(express.json());

// Import your custom route
import twitterFeedRoute from "./routes/twitterFeed";

// Mount the route at /api/twitter-feed
app.use("/api/twitter-feed", twitterFeedRoute);

// Export as Firebase Function
export const api = functions.https.onRequest(app);
