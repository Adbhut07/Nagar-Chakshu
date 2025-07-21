import * as functions from "firebase-functions";
import admin from "firebase-admin";
import express from "express";
import cors from "cors";

// Initialize Firebase Admin SDK
admin.initializeApp();

const app = express();
app.use(cors({origin: true}));
app.use(express.json());

// Import your custom routes
import twitterFeedRoute from "./routes/twitterFeed/twitterFeed";
import submitReportRoute from "./routes/userReports/submitReport";
import registerUserRoute from "./routes/auth/registerUser";

// Mount the routes
app.use("/api/twitter-feed", twitterFeedRoute);
app.use("/api/reports", submitReportRoute); 
app.use("/api/register", registerUserRoute);


// Add a basic health check endpoint
app.get("/", (req, res) => {
  res.json({ message: "Firebase Functions API is running" });
});

// Export as Firebase Function
export const api = functions.https.onRequest(app);