import express from "express";
import cors from "cors";
import logger from "./utils/logger.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import securityHeaders from "./middlewares/security.js";
import config from "./config/environment.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import rideRoutes from "./routes/ride.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import pickupRoutes from "./routes/pickup.routes.js";

const app = express();

/* ===============================
   Security & CORS
================================ */

// Security headers
securityHeaders(app);

// CORS configuration
const corsOptions = {
  origin: config.frontendUrl,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400, // 24 hours
};

if (config.isDevelopment) {
  corsOptions.origin = ["http://localhost:5173", "http://localhost:3000", config.frontendUrl];
}

app.use(cors(corsOptions));

/* ===============================
   Middlewares
================================ */

// Parse JSON request body
app.use(express.json());

// Parse URL-encoded data
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (development only)
if (config.isDevelopment) {
  app.use((req, res, next) => {
    logger.debug("Incoming request", {
      method: req.method,
      url: req.url,
      ip: req.ip,
    });
    next();
  });
}

/* ===============================
   Base Route (Health Check)
================================ */

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "🚗 RideSaathi API is running",
    version: "1.0.0",
    environment: config.nodeEnv,
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is healthy",
    timestamp: new Date().toISOString(),
  });
});

/* ===============================
   API Routes
================================ */

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/rides", rideRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/pickup-points", pickupRoutes);

/* ===============================
   Error Handling
================================ */

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);


export default app;
