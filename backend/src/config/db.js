import mongoose from "mongoose";
import logger from "../utils/logger.js";

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    
    if (!mongoUri) {
      throw new Error("MONGO_URI environment variable is not set");
    }

    await mongoose.connect(mongoUri, {
      retryWrites: true,
      w: "majority",
      maxPoolSize: 10,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info("✅ MongoDB Atlas Connected");
    
    // Handle connection events
    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected");
    });

    mongoose.connection.on("error", (error) => {
      logger.error("MongoDB connection error", error);
    });

    return mongoose.connection;
  } catch (error) {
    logger.error("MongoDB Atlas Connection Failed", error);
    process.exit(1);
  }
};

export default connectDB;
