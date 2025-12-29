import mongoose from "mongoose";

const rideSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    source: {
      type: String,
      required: true
    },

    destination: {
      type: String,
      required: true
    },

    date: {
      type: Date,
      required: true
    },

    totalSeats: {
      type: Number,
      required: true
    },

    status: {
      type: String,
      enum: ["OPEN", "FULL", "CANCELLED"],
      default: "OPEN"
    },

    availableSeats: {
      type: Number,
      required: true
    },

    price: {
      type: Number,
      required: true,
    },


    passengers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model("Ride", rideSchema);
