// Security headers middleware
import helmet from "helmet";

export const securityHeaders = (app) => {
  // Use helmet for security headers
  app.use(helmet());
  
  // Additional HSTS for production
  if (process.env.NODE_ENV === "production") {
    app.use(
      helmet.hsts({
        maxAge: 31536000, // 1 year in seconds
        includeSubDomains: true,
        preload: true,
      })
    );
  }

  // Prevent MIME type sniffing
  app.use(helmet.noSniff());
  
  // Prevent clickjacking
  app.use(helmet.frameguard({ action: "deny" }));
  
  // Remove X-Powered-By header
  app.use((req, res, next) => {
    res.removeHeader("X-Powered-By");
    next();
  });
};

export default securityHeaders;
