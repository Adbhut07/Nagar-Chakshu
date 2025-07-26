import * as functions from "firebase-functions";
import express from "express";
import cors from "cors";
import { onRequest } from "firebase-functions/v2/https";
import admin from "./utils/firebase";

// Import routes
import twitterFeedRoute from "./routes/twitterFeed/twitterFeed";
import submitReportRoute from "./routes/userReports/submitReport";
import authRoute from "./routes/auth/auth";
import summaryRoute from "./routes/summary/getIncidents";
import predictionsRoute from "./routes/predictions/predictions";
import processedRoute from "./routes/processed/processed";
import aiSearchRoute from "./ai-search/aiSearch";
import sentimentRoute from "./routes/sentiments/sentiments";

// Import scheduled functions
import { 
  notifyUsersOnNewIncidents, 
  testNotificationScheduler, 
  createTestUser, 
  cleanupTestData 
} from "./scheduler/notificationCron";
// import { 
//   syncFirestoreToVertexAI, 
//   syncOnDocumentChange, 
//   syncOnDocumentDelete, 
//   fullSyncFirestoreToVertexAI 
// } from "./scheduler/scheduledSync";

const app = express();

// Define allowed origins in one place
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'https://localhost:3000',
  'https://192.168.18.159:3000',
  // Add your actual production domains here
  'https://nagar-chakshu.vercel.app',
  'https://nagar-chakshu-adbhut07s-projects.vercel.app',
  // Add your Firebase hosting domain if you're using it
  'https://your-project-id.web.app',
  'https://your-project-id.firebaseapp.com'
];

// Enhanced CORS configuration
const corsOptions = {
  origin: function (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) {
    console.log('Request origin:', origin); // Debug logging
    
    // Allow requests with no origin (like mobile apps, Postman, server-to-server)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-CSRF-Token'
  ],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 200,
  preflightContinue: false
};

// Apply CORS middleware first
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Origin: ${req.headers.origin}`);
  next();
});

// Additional security headers (but don't duplicate CORS headers)
app.use((req, res, next) => {
  if (!res.headersSent) {
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'DENY');
    res.header('X-XSS-Protection', '1; mode=block');
  }
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Authentication & Reports API',
    cors: 'enabled',
    origin: req.headers.origin,
    method: req.method
  });
});

// Routes
app.use("/api/twitter-feed", twitterFeedRoute);
app.use("/api/reports", submitReportRoute);
app.use("/api", authRoute);
app.use("/api/summary", summaryRoute);
app.use("/api/predictions", predictionsRoute);
app.use("/api/processed", processedRoute);
app.use("/api/ai-search", aiSearchRoute);
app.use("/api/sentiments", sentimentRoute);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  
  // Handle CORS errors specifically
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'CORS policy violation',
      message: 'Origin not allowed',
      origin: req.headers.origin
    });
  }
  
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Handle 404 for all unmatched routes
app.use((req, res) => {
  console.log('404 - Route not found:', req.method, req.originalUrl);
  res.status(404).json({
    error: 'Not found',
    path: req.originalUrl,
    method: req.method,
    availableRoutes: [
      '/api/health',
      '/api/twitter-feed/*',
      '/api/reports/*',
      '/api/*'
    ]
  });
});

// Export the function
export const api = functions.https.onRequest(app);

// Export scheduled functions
export { 
  notifyUsersOnNewIncidents, 
  testNotificationScheduler, 
  createTestUser, 
  cleanupTestData 
};

// Export Vertex AI sync functions
// export { 
//   syncFirestoreToVertexAI, 
//   syncOnDocumentChange, 
//   syncOnDocumentDelete, 
//   fullSyncFirestoreToVertexAI 
// };