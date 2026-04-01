import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/db.js";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import logger from "./utils/logger.js";
import User from "./models/User.js";
import Ride from "./models/Ride.js";
import PassengerLocation from "./models/PassengerLocation.js";

dotenv.config();

const requiredEnvVars = ["MONGO_URI", "JWT_SECRET"];

const startServer = async () => {
  try {
    logger.info("Starting RideSaathi API Server");

    const missingVars = requiredEnvVars.filter((name) => !process.env[name]);
    if (missingVars.length > 0) {
      throw new Error(`Missing environment variables: ${missingVars.join(", ")}`);
    }

    await connectDB();
    logger.info("Database connected successfully");

    const PORT = process.env.PORT || 5000;
    const FRONTEND_ORIGIN = process.env.FRONTEND_URL || "http://localhost:5173";
    const server = http.createServer(app);

    const io = new Server(server, {
      cors: {
        origin: FRONTEND_ORIGIN,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        credentials: true,
      },
      transports: ["websocket", "polling"],
      maxHttpBufferSize: 1e6,
      pingInterval: 25000,
      pingTimeout: 20000,
    });

    app.set("io", io);

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
      } catch (error) {
        logger.error("Socket auth error", error);
        next(new Error("Authentication failed"));
      }
    });

    io.on("connection", (socket) => {
      logger.info("Socket connected", {
        socketId: socket.id,
        userId: socket.user?._id?.toString(),
        role: socket.user?.role,
      });

      socket.on("joinRoom", (rideId) => {
        if (!rideId) return;
        socket.join(rideId);
        logger.debug("User joined room", { socketId: socket.id, rideId });
      });

      socket.on("leaveRoom", (rideId) => {
        if (!rideId) return;
        socket.leave(rideId);
        logger.debug("User left room", { socketId: socket.id, rideId });
      });

      socket.on("driver:location", async (payload) => {
        try {
          const { rideId, lat, lng } = payload || {};
          if (!rideId || typeof lat !== "number" || typeof lng !== "number") return;

          if (socket.user.role !== "driver") {
            logger.warn("Non-driver attempted to send driver location", {
              userId: socket.user.id,
            });
            return;
          }

          const ride = await Ride.findById(rideId);
          if (!ride) {
            logger.warn("Ride not found for location update", { rideId });
            return;
          }

          if (ride.driver.toString() !== socket.user.id) {
            logger.warn("Driver tried to update location for different ride", {
              userId: socket.user.id,
              rideId,
            });
            return;
          }

          ride.driverLocation = { lat, lng };
          ride.driverLocationUpdatedAt = new Date();
          await ride.save();

          const driverPayload = {
            rideId: ride._id.toString(),
            driverId: socket.user._id.toString(),
            driverName: socket.user.name,
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
        } catch (error) {
          logger.error("driver:location error", error);
        }
      });

      socket.on("passenger:location", async (payload) => {
        try {
          const { rideId, lat, lng } = payload || {};
          if (!rideId || typeof lat !== "number" || typeof lng !== "number") return;
          if (socket.user.role !== "passenger") return;

          const ride = await Ride.findById(rideId);
          if (!ride) {
            logger.warn("Ride not found for passenger location update", { rideId });
            return;
          }

          const isPassenger = ride.passengers.some((p) => p.toString() === socket.user.id);
          if (!isPassenger) {
            logger.warn("Passenger not part of ride", { userId: socket.user.id, rideId });
            return;
          }

          const updated = await PassengerLocation.findOneAndUpdate(
            { ride: rideId, passenger: socket.user.id },
            { location: { lat, lng }, updatedAt: new Date() },
            { upsert: true, new: true }
          );

          io.to(rideId).emit("ride:passenger_location", {
            rideId,
            passengerId: socket.user.id,
            name: socket.user.name,
            phone: socket.user.phone,
            location: updated.location,
            updatedAt: updated.updatedAt,
          });
        } catch (error) {
          logger.error("passenger:location error", error);
        }
      });

      socket.on("disconnect", () => {
        logger.debug("Socket disconnected", { socketId: socket.id });
      });

      socket.on("error", (error) => {
        logger.error("Socket error", error, { socketId: socket.id });
      });
    });

    server.listen(PORT, "0.0.0.0", () => {
      logger.info(`✅ RideSaathi API Server running on port ${PORT}`);
    });

    server.on("error", (error) => {
      logger.error("Server error", error);
      process.exit(1);
    });

    process.on("SIGTERM", () => {
      logger.info("SIGTERM received, shutting down gracefully");
      server.close(() => {
        logger.info("Server closed");
        process.exit(0);
      });
    });

    process.on("SIGINT", () => {
      logger.info("SIGINT received, shutting down");
      server.close(() => {
        logger.info("Server closed");
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error("Server startup failed", error);
    process.exit(1);
  }
};

startServer();
