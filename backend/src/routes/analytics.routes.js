import express from "express";
import { getDemandHeat, getHotspots } from "../controllers/analytics.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Only drivers should access heatmap
router.get("/demand", protect, getDemandHeat);
router.get("/hotspots", protect, getHotspots);

export default router;
