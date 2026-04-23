import Ride from "../models/Ride.js";
import mongoose from "mongoose";
import PassengerLocation from "../models/PassengerLocation.js";
import User from "../models/User.js";
import PickupPoint from "../models/PickupPoint.js";
import Review from "../models/Review.js";
import { logDemandEvent } from "./analytics.controller.js";
import logger from "../utils/logger.js";

// Utility functions for route-based matching
const toRad = (deg) => (deg * Math.PI) / 180;
const haversineDistanceMeters = (a, b) => {
  const R = 6371e3;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
};

const routeContainsPoint = (routePath = [], target, toleranceMeters = 500) => {
  if (!Array.isArray(routePath) || routePath.length === 0) return false;
  return routePath.some((point) => haversineDistanceMeters(point, target) <= toleranceMeters);
};

/* ===============================
   CREATE RIDE (Driver only)
================================ */
export const createRide = async (req, res) => {
  try {
    if (req.user.role !== "driver") {
      return res.status(403).json({ success: false, message: "Only drivers can create rides" });
    }

    const {
      from,
      to,
      date,
      availableSeats,
      price,
      totalFare,
      sourceLat,
      sourceLng,
      destLat,
      destLng,
      pickupPointId,
      isScheduled,
      scheduledTime,
    } = req.body;

    if (!from || !to || !date || !availableSeats || !price) {
      return res.status(400).json({ success: false, message: "Missing required ride fields" });
    }

    if (availableSeats <= 0 || price <= 0) {
      return res.status(400).json({ success: false, message: "Seats and price must be positive" });
    }

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ success: false, message: "Invalid date" });
    }

    const existingRide = await Ride.findOne({
      driver: req.user._id,
      source: from,
      destination: to,
      date: parsedDate,
      status: "OPEN",
    });

    if (existingRide) {
      return res.status(400).json({ success: false, message: "You already have an open ride for this route and date" });
    }

    let pickupPoint = null;
    if (pickupPointId) {
      pickupPoint = await PickupPoint.findById(pickupPointId);
      if (!pickupPoint) {
        return res.status(400).json({ success: false, message: "Invalid pickup point" });
      }
    }

    const sourceLocation = {
      type: "Point",
      coordinates: [
        typeof sourceLng === "number" ? sourceLng : 0,
        typeof sourceLat === "number" ? sourceLat : 0,
      ],
    };
    const destinationLocation = {
      type: "Point",
      coordinates: [
        typeof destLng === "number" ? destLng : 0,
        typeof destLat === "number" ? destLat : 0,
      ],
    };

    const routePath = Array.isArray(req.body.routePath)
      ? req.body.routePath
          .filter((p) => p && typeof p.lat === "number" && typeof p.lng === "number")
          .slice(0, 200)
      : [];

    const ride = await Ride.create({
      driver: req.user._id,
      source: from,
      destination: to,
      date: parsedDate,
      totalSeats: availableSeats,
      availableSeats,
      price,
      totalFare: totalFare || price * availableSeats,
      sourceLocation,
      destinationLocation,
      pickupPoint: pickupPoint?._id || null,
      routePath,
      isScheduled: !!isScheduled,
      scheduledTime: isScheduled && scheduledTime ? new Date(scheduledTime) : null,
    });

    return res.status(201).json({ success: true, message: "Ride created successfully", ride });
  } catch (error) {
    logger.error("Create ride error", error);
    return res.status(500).json({ success: false, message: error.message || "Server error while creating ride" });
  }
};



/* ===============================
   JOIN RIDE (Passenger)
================================ */

export const joinRide = async (req, res) => {
  try {
    const { rideId } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const updatedRide = await Ride.findOneAndUpdate(
      {
        _id: rideId,
        status: "OPEN",
        availableSeats: { $gt: 0 },
        driver: { $ne: userId },
        passengers: { $ne: userId },
      },
      {
        $addToSet: { passengers: userId },
        $inc: { availableSeats: -1 },
      },
      { new: true }
    );

    if (!updatedRide) {
      return res.status(400).json({ message: "Cannot join ride (ride full, cancelled, already joined, or invalid)" });
    }

    if (updatedRide.availableSeats === 0) {
      updatedRide.status = "FULL";
      await updatedRide.save();
    }

    const io = req.app.get("io");
    if (io) {
      io.to(rideId).emit("ride:updated", {
        rideId: updatedRide._id.toString(),
        availableSeats: updatedRide.availableSeats,
        status: updatedRide.status,
      });
    }

    try {
      const rideObj = await Ride.findById(rideId);
      const lat = rideObj?.driverLocation?.lat ?? null;
      const lng = rideObj?.driverLocation?.lng ?? null;
      logDemandEvent({ type: "join", ride: rideId, user: req.user.id, source: rideObj?.source || null, lat, lng }).catch(() => {});
    } catch (e) {
      // Non-critical logging error
    }

    res.status(200).json({
      message: "Ride joined successfully",
      ride: {
        ...updatedRide.toObject(),
        passengers: updatedRide.passengers.map((p) => p.toString()),
      },
    });
  } catch (error) {
    logger.error("Join ride error", error);
    res.status(500).json({ message: "Server error" });
  }
};



/* ========================================
   SEARCH RIDES (Public) - CASE INSENSITIVE
======================================== */
export const searchRides = async (req, res) => {
  try {
    const {
      from,
      to,
      fromLat,
      fromLng,
      toLat,
      toLng,
      radiusKm = 5,
      fromPickupPointId,
      toPickupPointId,
    } = req.query;

    const query = {
      status: "OPEN",
      availableSeats: { $gt: 0 },
    };

    if (fromPickupPointId || toPickupPointId) {
      if (fromPickupPointId) {
        const point = await PickupPoint.findById(fromPickupPointId);
        if (!point) return res.status(400).json({ message: "Invalid from pickup point" });
        query.sourceLocation = {
          $nearSphere: {
            $geometry: point.location,
            $maxDistance: Number(radiusKm) * 1000,
          },
        };
      }
      if (toPickupPointId) {
        const point = await PickupPoint.findById(toPickupPointId);
        if (!point) return res.status(400).json({ message: "Invalid to pickup point" });
        query.destinationLocation = {
          $nearSphere: {
            $geometry: point.location,
            $maxDistance: Number(radiusKm) * 1000,
          },
        };
      }
    } else if (fromLat && fromLng && toLat && toLng) {
      query.sourceLocation = {
        $nearSphere: {
          $geometry: { type: "Point", coordinates: [Number(fromLng), Number(fromLat)] },
          $maxDistance: Number(radiusKm) * 1000,
        },
      };
      query.destinationLocation = {
        $nearSphere: {
          $geometry: { type: "Point", coordinates: [Number(toLng), Number(toLat)] },
          $maxDistance: Number(radiusKm) * 1000,
        },
      };
    } else if (from && to) {
      const escapeRegex = (str = "") => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.source = { $regex: `^${escapeRegex(from.trim())}$`, $options: "i" };
      query.destination = { $regex: `^${escapeRegex(to.trim())}$`, $options: "i" };
    } else {
      return res.status(400).json({ message: "Provide from/to text or coordinates" });
    }

    const ridesFromDb = await Ride.find(query).sort({ date: 1 });

    const pickupLatNum = Number(req.query.pickupLat);
    const pickupLngNum = Number(req.query.pickupLng);
    const hasPickup = !Number.isNaN(pickupLatNum) && !Number.isNaN(pickupLngNum);

    const filteredRides = ridesFromDb.filter((ride) => {
      if (!hasPickup) return true;
      const target = { lat: pickupLatNum, lng: pickupLngNum };
      if (routeContainsPoint(ride.routePath, target, 500)) return true;
      if (ride.sourceLocation?.coordinates?.length === 2) {
        const [lng, lat] = ride.sourceLocation.coordinates;
        if (haversineDistanceMeters({ lat, lng }, target) <= 1000) return true;
      }
      return false;
    });

    logDemandEvent({ type: "search", user: req.user?.id || null, source: from || null, destination: to || null }).catch(() => {});

    const formattedRides = filteredRides.map((ride) => ({
      ...ride.toObject(),
      from: ride.source,
      to: ride.destination,
      passengers: ride.passengers.map((p) => p.toString()),
      farePerPassenger: ride.farePerPassenger,
    }));

    return res.status(200).json({ rides: formattedRides, message: "Rides found" });
  } catch (error) {
    logger.error("Search rides error", error);
    return res.status(500).json({ message: "Server error while searching rides" });
  }
};



/* ===============================
   LEAVE RIDE (Passenger)
================================ */

export const leaveRide = async (req, res) => {
  try {
    const { rideId } = req.params;
    const userId = req.user.id;

    const ride = await Ride.findById(rideId);

    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    if (ride.driver.toString() === userId) {
      return res.status(400).json({ message: "Driver cannot leave own ride" });
    }

    const isPassenger = ride.passengers.some(
      (p) => p.toString() === userId
    );

    if (!isPassenger) {
      return res.status(400).json({ message: "You have not joined this ride" });
    }

    const updatedRide = await Ride.findByIdAndUpdate(
      rideId,
      {
        $pull: { passengers: userId },
        $inc: { availableSeats: 1 },
      },
      { new: true }
    );

    if (!updatedRide) {
      return res.status(400).json({ message: "Ride update failed" });
    }

    if (updatedRide.status === "FULL") {
      updatedRide.status = "OPEN";
      await updatedRide.save();
    }

    const io = req.app.get("io");
    if (io) {
      io.to(rideId).emit("ride:updated", {
        rideId: updatedRide._id.toString(),
        availableSeats: updatedRide.availableSeats,
        status: updatedRide.status,
      });
    }

    res.status(200).json({
      message: "Ride left successfully",
      ride: {
        ...updatedRide.toObject(),
        passengers: updatedRide.passengers.map((p) => p.toString()),
      },
    });
  } catch (error) {
    logger.error("Leave ride error", error);
    res.status(500).json({ message: "Server error" });
  }
};



/* ===============================
   GET MY RIDES AS DRIVER
================================ */
export const getMyDriverRides = async (req, res) => {
  try {
    if (req.user.role !== "driver") {
      return res.status(403).json({ message: "Access denied" });
    }

    const rides = await Ride.find({ driver: req.user.id })
      .sort({ createdAt: -1 });

    const formattedRides = rides.map(ride => ({
      ...ride.toObject(),
      passengers: ride.passengers.map(p => p.toString()),
    }));

    res.status(200).json(formattedRides);

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ===============================
   GET MY RIDES AS PASSENGER
================================ */
export const getMyPassengerRides = async (req, res) => {
  try {
    if (req.user.role !== "passenger") {
      return res.status(403).json({ message: "Access denied" });
    }

    const rides = await Ride.find({
      passengers: req.user.id
    }).sort({ createdAt: -1 });

    const formattedRides = rides.map(ride => ({
      ...ride.toObject(),
      passengers: ride.passengers.map(p => p.toString()),
    }));

    res.status(200).json(formattedRides);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};


/* ===============================
   CANCEL RIDE (Driver only)
================================ */
export const cancelRide = async (req, res) => {
  try {
    const { rideId } = req.params;
    const userId = req.user.id;

    // 1️⃣ Find ride
    const ride = await Ride.findById(rideId);

    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    // 2️⃣ Only driver can cancel
    if (ride.driver.toString() !== userId) {
      return res.status(403).json({
        message: "Only driver can cancel this ride",
      });
    }

    // 3️⃣ Already cancelled
    if (ride.status === "CANCELLED") {
      return res.status(400).json({
        message: "Ride already cancelled",
      });
    }

    // 4️⃣ Cancel ride + remove passengers
    ride.status = "CANCELLED";
    ride.passengers = [];                 // 🚨 auto-remove passengers
    ride.availableSeats = ride.totalSeats;

    // 5️⃣ Save changes
    await ride.save();

    // 6️⃣ Remove PassengerLocation records for this ride
    await PassengerLocation.deleteMany({ ride: ride._id });

    const io = req.app.get("io");
    if (io) {
      io.to(rideId).emit("ride:cancelled", {
        rideId: ride._id.toString(),
        status: ride.status,
      });
      io.to(rideId).emit("ride:updated", {
        rideId: ride._id.toString(),
        availableSeats: ride.availableSeats,
        status: ride.status,
      });
      io.to(rideId).emit("ride:passenger_locations_cleared", { rideId: ride._id.toString() });
    }

    return res.status(200).json({ success: true, message: "Ride cancelled successfully", ride });

  } catch (error) {
    logger.error("Cancel ride error", error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};


/* ===============================
   DRIVER UPDATES GPS LOCATION (REST fallback)
   POST /api/rides/:rideId/location
================================ */
export const updateDriverLocation = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { lat, lng } = req.body;

    if (typeof lat !== "number" || typeof lng !== "number") {
      return res.status(400).json({ message: "Invalid coordinates" });
    }

    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    if (ride.driver.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only driver can update location" });
    }

    ride.driverLocation = { lat, lng };
    ride.driverLocationUpdatedAt = new Date();
    await ride.save();

    // broadcast via sockets if available
    const io = req.app.get("io");
    if (io) {
      const driverPayload = {
        rideId: ride._id.toString(),
        driverId: req.user.id,
        driverLocation: ride.driverLocation,
        driverLocationUpdatedAt: ride.driverLocationUpdatedAt,
        status: ride.status,
        source: ride.source,
        destination: ride.destination,
        sourceLocation: ride.sourceLocation,
        destinationLocation: ride.destinationLocation,
        routePath: ride.routePath || [],
      };
      io.to(rideId).emit("ride:location", driverPayload);
      io.emit("driverLocationUpdate", driverPayload);
      io.emit("nearbyDrivers", driverPayload);
    }

    return res.status(200).json({
      success: true,
      message: "Location updated",
      driverLocation: ride.driverLocation,
      driverLocationUpdatedAt: ride.driverLocationUpdatedAt,
    });
  } catch (error) {
    logger.error("Update driver location error", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ===============================
   GET LIVE RIDE STATUS + LOCATION (REST)
   GET /api/rides/:rideId/live
================================ */
export const getLiveRide = async (req, res) => {
  try {
    const { rideId } = req.params;
    const ride = await Ride.findById(rideId);

    if (!ride) return res.status(404).json({ message: "Ride not found" });

    // passengers can view only if they joined
    if (req.user.role === "passenger") {
      const joined = ride.passengers.some((p) => p.toString() === req.user.id);
      if (!joined) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    // drivers can view their own rides
    if (req.user.role === "driver" && ride.driver.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    return res.status(200).json({
      success: true,
      ride: {
        _id: ride._id.toString(),
        status: ride.status,
        driverLocation: ride.driverLocation,
        driverLocationUpdatedAt: ride.driverLocationUpdatedAt,
      },
    });
  } catch (error) {
    logger.error("reviewRide error", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ===============================
   PASSENGER UPDATES THEIR LOCATION (REST)
   POST /api/rides/:rideId/passenger-location
================================ */
export const updatePassengerLocation = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { lat, lng } = req.body;
    const userId = req.user.id;

    if (typeof lat !== "number" || typeof lng !== "number") {
      return res.status(400).json({ message: "Invalid coordinates" });
    }

    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    // ensure the user is a passenger on this ride
    const joined = ride.passengers.some((p) => p.toString() === userId);
    if (!joined) {
      return res.status(403).json({ message: "You have not joined this ride" });
    }

    const updated = await PassengerLocation.findOneAndUpdate(
      { ride: rideId, passenger: userId },
      { location: { lat, lng }, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    // broadcast to ride room
    const io = req.app.get("io");
    if (io) {
      const passenger = await User.findById(userId).select("name phone");
      io.to(rideId).emit("ride:passenger_location", {
        rideId: rideId,
        passengerId: userId,
        name: passenger?.name || null,
        phone: passenger?.phone || null,
        location: updated.location,
        updatedAt: updated.updatedAt,
      });
    }

    return res.status(200).json({ success: true, message: "Location updated" });
  } catch (error) {
    logger.error("updatePassengerLocation error", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ===============================
   DRIVER GETS PASSENGERS + LOCATIONS
   GET /api/rides/:rideId/passengers
================================ */
export const getRidePassengers = async (req, res) => {
  try {
    const { rideId } = req.params;
    const userId = req.user.id;

    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    // only driver of ride can fetch this
    if (ride.driver.toString() !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    // fetch passenger user details
    const users = await User.find({ _id: { $in: ride.passengers } }).select("name phone");
    const locations = await PassengerLocation.find({ ride: rideId });

    const locMap = {};
    locations.forEach((l) => {
      locMap[l.passenger.toString()] = {
        location: l.location || null,
        updatedAt: l.updatedAt || l.updatedAt,
      };
    });

    const result = users.map((u) => ({
      _id: u._id.toString(),
      name: u.name,
      phone: u.phone,
      lastLocation: locMap[u._id.toString()] || null,
    }));

    return res.status(200).json({ success: true, passengers: result });
  } catch (error) {
    logger.error("getRidePassengers error", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const completeRide = async (req, res) => {
  try {
    const { rideId } = req.params;
    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });
    if (ride.driver.toString() !== req.user.id) return res.status(403).json({ message: "Only driver can complete ride" });
    if (ride.status !== "OPEN" && ride.status !== "FULL") return res.status(400).json({ message: "Ride not in progress" });
    ride.status = "CANCELLED";
    await ride.save();
    const io = req.app.get("io");
    if (io) {
      io.to(rideId).emit("ride:completed", { rideId, status: ride.status });
      io.to(rideId).emit("ride:updated", { rideId, availableSeats: ride.availableSeats, status: ride.status });
    }
    return res.status(200).json({ success: true, message: "Ride marked complete" });
  } catch (error) {
    logger.error("completeRide error", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const reviewRide = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { targetUserId, rating, comment } = req.body;

    if (!targetUserId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Invalid review data" });
    }

    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    const reviewerId = req.user.id;
    let allowed = false;
    if (req.user.role === "driver" && ride.driver.toString() === reviewerId && ride.passengers.some((p) => p.toString() === targetUserId)) {
      allowed = true;
    }
    if (req.user.role === "passenger" && ride.passengers.some((p) => p.toString() === reviewerId) && ride.driver.toString() === targetUserId) {
      allowed = true;
    }
    if (!allowed) return res.status(403).json({ message: "Not allowed to review this user" });

    const existing = await Review.findOne({ ride: rideId, reviewer: reviewerId, targetUser: targetUserId });
    if (existing) return res.status(400).json({ message: "You have already reviewed this user for this ride" });

    const newReview = await Review.create({ ride: rideId, reviewer: reviewerId, targetUser: targetUserId, rating, comment: comment || "" });

    const user = await User.findById(targetUserId);
    if (user) {
      user.numReviews = (user.numReviews || 0) + 1;
      user.rating = Number(((user.rating * (user.numReviews - 1) + rating) / user.numReviews).toFixed(2));
      await user.save();
    }

    res.status(201).json({ success: true, review: newReview });
  } catch (error) {
    logger.error("reviewRide error", error);
    return res.status(500).json({ message: "Server error" });
  }
};
