import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/db.js";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "./models/User.js";
import Ride from "./models/Ride.js";
import PassengerLocation from "./models/PassengerLocation.js";

dotenv.config();

const startServer = async () => {
  try {
    await connectDB(); // 🔑 WAIT for DB

    const PORT = process.env.PORT || 5000;

    const server = http.createServer(app);

    const io = new Server(server, {
      cors: {
        origin: true,
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["websocket"],
    });

    // Attach io to express app for controller access
    app.set("io", io);

    // Socket auth middleware (JWT)
    io.use(async (socket, next) => {
      try {
        const token =
          socket.handshake.auth?.token ||
          (socket.handshake.headers?.authorization || "").split(" ")[1];

        if (!token) return next(new Error("Not authorized"));

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");
        if (!user) return next(new Error("User not found"));

        socket.user = user;
        next();
      } catch (err) {
        next(new Error("Auth error"));
      }
    });

    io.on("connection", (socket) => {
      console.log("Socket connected:", socket.id, "user:", socket.user?.email);

      socket.on("joinRoom", (rideId) => {
        if (rideId) socket.join(rideId);
      });

      socket.on("leaveRoom", (rideId) => {
        if (rideId) socket.leave(rideId);
      });

      // Driver sends real-time location
      socket.on("driver:location", async (payload) => {
        try {
          const { rideId, lat, lng } = payload || {};
          if (!rideId || typeof lat !== "number" || typeof lng !== "number") return;

          if (socket.user.role !== "driver") return;
          const ride = await Ride.findById(rideId);
          if (!ride) return;
          if (ride.driver.toString() !== socket.user.id) return;

          ride.driverLocation = { lat, lng };
          ride.driverLocationUpdatedAt = new Date();
          await ride.save();

          io.to(rideId).emit("ride:location", {
            rideId: ride._id.toString(),
            driverLocation: ride.driverLocation,
            driverLocationUpdatedAt: ride.driverLocationUpdatedAt,
            status: ride.status,
          });
        } catch (error) {
          console.error("driver:location error", error);
        }
      });

      // PASSENGER sends real-time location
      socket.on("passenger:location", async (payload) => {
        try {
          const { rideId, lat, lng } = payload || {};
          if (!rideId || typeof lat !== "number" || typeof lng !== "number") return;
          if (socket.user.role !== "passenger") return;

          const ride = await Ride.findById(rideId);
          if (!ride) return;
          // ensure passenger is part of ride
          const isPassenger = ride.passengers.some((p) => p.toString() === socket.user.id);
          if (!isPassenger) return;

          const updated = await PassengerLocation.findOneAndUpdate(
            { ride: rideId, passenger: socket.user.id },
            { location: { lat, lng }, updatedAt: new Date() },
            { upsert: true, new: true }
          );

          // broadcast to ride room (driver + other passengers)
          io.to(rideId).emit("ride:passenger_location", {
            rideId,
            passengerId: socket.user.id,
            name: socket.user.name,
            phone: socket.user.phone,
            location: updated.location,
            updatedAt: updated.updatedAt,
          });
        } catch (err) {
          console.error("passenger:location error", err);
        }
      });

      socket.on("disconnect", () => {
        // console.log("Socket disconnected:", socket.id);
      });
    });

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed ❌", error);
    process.exit(1);
  }
};

startServer();
