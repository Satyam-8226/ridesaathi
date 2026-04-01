// Environment configuration
const getConfig = () => {
  const isProduction = process.env.NODE_ENV === "production";
  
  return {
    // Server
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || "development",
    isProduction,
    isDevelopment: !isProduction,

    // Database
    mongoUri: process.env.MONGO_URI,

    // JWT
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",

    // Frontend URL
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",

    // Email
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
      from: process.env.SMTP_FROM || "noreply@ridesaathi.com",
    },

    // SMS (Twilio)
    twilio: {
      sid: process.env.TWILIO_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      from: process.env.TWILIO_FROM,
    },

    // API
    apiPrefix: "/api",
    apiVersion: "v1",

    // Timeouts
    jwtExpiresInSeconds: 7 * 24 * 60 * 60, // 7 days
    mongoConnectTimeout: 10000,
  };
};

export default getConfig();
