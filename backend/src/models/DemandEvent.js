import mongoose from "mongoose";

const demandEventSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["search", "join"], required: true },
    // optional link to ride / user
    ride: { type: mongoose.Schema.Types.ObjectId, ref: "Ride", default: null },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    // original query strings for reference
    source: { type: String, default: null },
    destination: { type: String, default: null },
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
  },
  { timestamps: true }
);

// index for efficient time-based queries
demandEventSchema.index({ createdAt: 1 });

export default mongoose.model("DemandEvent", demandEventSchema);
