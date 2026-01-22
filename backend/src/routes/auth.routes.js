import express from "express";
import {
  registerUser,
  loginUser,
  getMe,
  requestOtp,
  verifyOtp,
} from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

// OTP endpoints
router.post("/request-otp", requestOtp);
router.post("/verify-otp", verifyOtp);

router.get("/me", protect, getMe);

export default router;
