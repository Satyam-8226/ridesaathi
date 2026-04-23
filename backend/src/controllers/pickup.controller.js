import PickupPoint from "../models/PickupPoint.js";
import logger from "../utils/logger.js";

export const getPickupPoints = async (req, res) => {
  try {
    const points = await PickupPoint.find().sort({ city: 1, name: 1 });
    return res.status(200).json({ success: true, pickupPoints: points });
  } catch (error) {
    logger.error("getPickupPoints error", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const createPickupPoint = async (req, res) => {
  try {
    const { name, city, lat, lng } = req.body;
    if (!name || !city || typeof lat !== "number" || typeof lng !== "number") {
      return res.status(400).json({ success: false, message: "Invalid pickup point payload" });
    }

    const existing = await PickupPoint.findOne({ name, city });
    if (existing) {
      return res.status(400).json({ success: false, message: "Pickup point already exists" });
    }

    const point = await PickupPoint.create({
      name,
      city,
      location: { type: "Point", coordinates: [lng, lat] },
    });
    return res.status(201).json({ success: true, pickupPoint: point });
  } catch (error) {
    logger.error("createPickupPoint error", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
