import express from "express";
import { getPickupPoints, createPickupPoint } from "../controllers/pickup.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", protect, getPickupPoints);
router.post("/", protect, createPickupPoint);

export default router;
