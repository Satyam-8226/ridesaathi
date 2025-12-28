import Ride from "../models/Ride.js";

/* ===============================
   CREATE RIDE (Driver only)
================================ */
export const createRide = async (req, res) => {
  try {
    const { from, to, date, availableSeats, price } = req.body;

    // 1️⃣ Role check
    if (req.user.role !== "driver") {
      return res.status(403).json({
        success: false,
        message: "Only drivers can create rides",
      });
    }

    // 2️⃣ Validate input
    if (!from || !to || !date || !availableSeats || !price) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // 3️⃣ Create ride
    const ride = await Ride.create({
      driver: req.user._id,
      from,
      to,
      date,
      availableSeats,
      price,
    });

    return res.status(201).json({
      success: true,
      message: "Ride created successfully",
      ride,
    });
  } catch (error) {
    console.error("Create ride error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while creating ride",
    });
  }
};
