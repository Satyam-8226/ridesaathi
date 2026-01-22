import mongoose from "mongoose";

const passengerLocationSchema = new mongoose.Schema(
  {
    ride: { type: mongoose.Schema.Types.ObjectId, ref: "Ride", required: true, index: true },
    passenger: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    updatedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// TTL: remove location docs if not updated for 7 days (adjust as needed)
passengerLocationSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 });

export default mongoose.model("PassengerLocation", passengerLocationSchema);
