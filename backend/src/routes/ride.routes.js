import express from "express";
import {
  createRide,
  joinRide,
  leaveRide,
  searchRides,
  getMyDriverRides,
  getMyPassengerRides,
  cancelRide
} from "../controllers/ride.controller.js";

import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Create ride (driver)
router.post("/", protect, createRide);

// Search rides (public)
router.get("/search", searchRides);

// Join ride (passenger)
router.post("/:rideId/join", protect, joinRide);

// Leave ride (passenger)
router.post("/:rideId/leave", protect, leaveRide);

// Get my rides as driver
router.get("/my-rides/driver", protect, getMyDriverRides);

// Get my rides as passenger
router.get("/my-rides/passenger", protect, getMyPassengerRides);

// Cancel ride (driver)
router.post("/:rideId/cancel", protect, cancelRide);

export default router;
