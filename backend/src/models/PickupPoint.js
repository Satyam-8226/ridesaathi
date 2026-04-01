import mongoose from "mongoose";

const pickupPointSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    city: { type: String, required: true },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
  },
  { timestamps: true }
);

pickupPointSchema.index({ location: "2dsphere" });

export default mongoose.model("PickupPoint", pickupPointSchema);
