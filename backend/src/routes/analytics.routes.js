import express from "express";
import { getDemandHeat } from "../controllers/analytics.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Only drivers should access heatmap
router.get("/demand", protect, getDemandHeat);

export default router;
