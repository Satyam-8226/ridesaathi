import express from "express";
import { createRide } from "../controllers/ride.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Create ride (protected)
router.post("/", protect, createRide);

export default router;
