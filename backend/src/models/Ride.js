import mongoose from "mongoose";

const rideSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    source: {
      type: String,
      required: true,
    },

    destination: {
      type: String,
      required: true,
    },

    sourceLocation: {
      // GeoJSON Point for source
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },

    destinationLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },

    date: {
      type: Date,
      required: true,
    },

    isScheduled: {
      type: Boolean,
      default: false,
    },

    scheduledTime: {
      type: Date,
      default: null,
    },

    totalSeats: {
      type: Number,
      required: true,
    },

    availableSeats: {
      type: Number,
      required: true,
    },

    totalFare: {
      type: Number,
      required: false,
      default: null,
    },

    status: {
      type: String,
      enum: ["OPEN", "FULL", "CANCELLED"],
      default: "OPEN",
    },

    price: {
      type: Number,
      required: true,
    },

    // NEW: live GPS info from driver
    driverLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },

    driverLocationUpdatedAt: {
      type: Date,
      default: null,
    },

    passengers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    pickupPoint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PickupPoint",
      default: null,
    },
    routePath: {
      type: [
        {
          lat: { type: Number, required: true },
          lng: { type: Number, required: true },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

rideSchema.index({ sourceLocation: "2dsphere" });
rideSchema.index({ destinationLocation: "2dsphere" });

rideSchema.virtual("farePerPassenger").get(function () {
  if (this.totalFare == null || this.totalSeats <= 0) return null;
  return Number((this.totalFare / this.totalSeats).toFixed(2));
});

export default mongoose.model("Ride", rideSchema);
