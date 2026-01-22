import express from "express";
import {
  createRide,
  joinRide,
  leaveRide,
  searchRides,
  getMyDriverRides,
  getMyPassengerRides,
  cancelRide,
  updateDriverLocation,
  getLiveRide,
  updatePassengerLocation,
  getRidePassengers,
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

// passenger location (REST fallback)
router.post("/:rideId/passenger-location", protect, updatePassengerLocation);

// driver fetches passengers
router.get("/:rideId/passengers", protect, getRidePassengers);

// Driver updates GPS
router.post("/:rideId/location", protect, updateDriverLocation);

// Live ride status + location (passenger/driver)
router.get("/:rideId/live", protect, getLiveRide);

// Get my rides as driver
router.get("/my-rides/driver", protect, getMyDriverRides);

// Get my rides as passenger
router.get("/my-rides/passenger", protect, getMyPassengerRides);

// Cancel ride (driver)
router.post("/:rideId/cancel", protect, cancelRide);

export default router;
