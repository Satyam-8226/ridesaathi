// Error handling middleware
import logger from "../utils/logger.js";

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === "production";

  logger.error("API Error", err, {
    method: req.method,
    url: req.url,
    ip: req.ip,
    statusCode,
  });

  // Don't expose error details in production
  const message = isProduction && statusCode === 500 ? "Internal server error" : err.message;

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

// 404 handler (should come before error handler)
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
};

// Async error wrapper for route handlers
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
