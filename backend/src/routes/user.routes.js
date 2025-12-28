import express from "express";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Test protected route
router.get("/me", protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Access granted",
    user: req.user,
  });
});

export default router;
