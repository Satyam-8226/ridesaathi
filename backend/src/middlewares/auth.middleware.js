import jwt from "jsonwebtoken";
import User from "../models/User.js";
import logger from "../utils/logger.js";

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "Not authorized, no token" });
    }

    let token = authHeader.split(" ")[1];

    if (!token || token === "null" || token === "undefined") {
      return res
        .status(401)
        .json({ success: false, message: "Not authorized, invalid token" });
    }

    token = token.trim().replace(/^"|"$/g, "");

    const jwtPattern = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
    if (!jwtPattern.test(token)) {
      return res
        .status(401)
        .json({ success: false, message: "Not authorized, token malformed" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User no longer exists" });
    }

    req.user = user;
    next();
  } catch (error) {
    // Handle JWT-specific errors quietly
    if (
      error?.name === "JsonWebTokenError" ||
      error?.name === "TokenExpiredError"
    ) {
      return res
        .status(401)
        .json({ success: false, message: "Not authorized, token invalid or expired" });
    }

    logger.error("Auth middleware error", error);
    return res
      .status(401)
      .json({ success: false, message: "Not authorized, token invalid or expired" });
  }
};
