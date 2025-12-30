import Ride from "../models/Ride.js";

/* ===============================
   CREATE RIDE (Driver only)
================================ */
export const createRide = async (req, res) => {
  try {
    // 1️⃣ Role-based access control
    if (req.user.role !== "driver") {
      return res.status(403).json({
        success: false,
        message: "Only drivers can create rides",
      });
    }

    // 2️⃣ Extract & validate input
    const { from, to, date, availableSeats, price } = req.body;

    if (!from || !to || !date || !availableSeats || !price) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (availableSeats <= 0 || price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Seats and price must be positive values",
      });
    }

    // 3️⃣ CHECK DUPLICATE FIRST ✅
    const existingRide = await Ride.findOne({
      driver: req.user._id,
      source: from,
      destination: to,
      date: new Date(date),
      status: "OPEN",
    });

    if (existingRide) {
      return res.status(400).json({
        success: false,
        message: "You already have an open ride for this route and date",
      });
    }

    // 4️⃣ CREATE ride only if safe ✅
    const ride = await Ride.create({
      driver: req.user._id,
      source: from,
      destination: to,
      date: new Date(date),
      totalSeats: availableSeats,
      availableSeats,
      price,
    });

    // 5️⃣ Success response
    return res.status(201).json({
      success: true,
      message: "Ride created successfully",
      ride,
    });
  } catch (error) {
    console.error("Create ride error:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message || "Server error while creating ride",
    });
  }
};



/* ===============================
   JOIN RIDE (Passenger)
================================ */

import mongoose from "mongoose";

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
        $addToSet: { passengers: userId }, // ✅ FIX
        $inc: { availableSeats: -1 },
      },
      { new: true }
    );

    if (!updatedRide) {
      return res.status(400).json({
        message:
          "Cannot join ride (ride full, cancelled, already joined, or invalid)",
      });
    }

    // Auto mark FULL
    if (updatedRide.availableSeats === 0) {
      updatedRide.status = "FULL";
      await updatedRide.save();
    }

    res.status(200).json({
      message: "Ride joined successfully",
      ride: {
        ...updatedRide.toObject(),
        passengers: updatedRide.passengers.map((p) => p.toString()),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};



/* ===============================
   SEARCH RIDES (Public)
================================ */
export const searchRides = async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        message: "From and To locations are required",
      });
    }

    const rides = await Ride.find({
      source: from,
      destination: to,
      status: "OPEN",
      availableSeats: { $gt: 0 },
    }).sort({ date: 1 });

    // 🔹 Normalize response
    const formattedRides = rides.map((ride) => ({
      ...ride.toObject(),
      from: ride.source,
      to: ride.destination,
      passengers: ride.passengers.map((p) => p.toString()),
    }));

    // 🔴 NO RIDES FOUND CASE
    if (formattedRides.length === 0) {
      return res.status(200).json({
        rides: [],
        message: "No rides found for this route",
      });
    }

    // ✅ Rides found
    return res.status(200).json({
      rides: formattedRides,
      message: "Rides found",
    });

  } catch (error) {
    console.error("Search rides error:", error);
    return res.status(500).json({
      message: "Server error while searching rides",
    });
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

    if (updatedRide.status === "FULL") {
      updatedRide.status = "OPEN";
      await updatedRide.save();
    }

    res.status(200).json({
      message: "Ride left successfully",
      ride: {
        ...updatedRide.toObject(),
        passengers: updatedRide.passengers.map((p) => p.toString()),
      },
    });
  } catch (error) {
    console.error(error);
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

    const ride = await Ride.findById(rideId);

    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    // Only driver can cancel
    if (ride.driver.toString() !== userId) {
      return res.status(403).json({ message: "Only driver can cancel this ride" });
    }

    // Already cancelled
    if (ride.status === "CANCELLED") {
      return res.status(400).json({ message: "Ride already cancelled" });
    }

    const updatedRide = await Ride.findByIdAndUpdate(
      rideId,
      { status: "CANCELLED" },
      { new: true }
    );

    res.status(200).json({
      message: "Ride cancelled successfully",
      ride: updatedRide
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
