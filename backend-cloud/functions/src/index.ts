import * as functions from "firebase-functions";
import express from "express";
import cors from "cors";
import { onRequest } from "firebase-functions/v2/https";

import admin from "./utils/firebase"; 

// Import routes
import twitterFeedRoute from "./routes/twitterFeed/twitterFeed";
import submitReportRoute from "./routes/userReports/submitReport";
import authRoute from "./routes/auth/auth";

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Authentication & Reports API'
  });
});

app.use("/api/twitter-feed", twitterFeedRoute);
app.use("/api/reports", submitReportRoute); 
app.use("/api", authRoute);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Handle 404 for all unmatched routes - this should be the last middleware
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    path: req.originalUrl,
    method: req.method
  });
});

export const api = functions.https.onRequest(app);
