import express from "express";
import cors from "cors";

const app = express();

/* ===============================
   Middlewares
================================ */

// Enable CORS for all origins
app.use(cors());

// Parse JSON request body
app.use(express.json());

// Parse URL-encoded data
app.use(express.urlencoded({ extended: true }));

/* ===============================
   Base Route (Health Check)
================================ */

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "RideSaathi API is running 🚀",
  });
});

/* ===============================
   Future Routes Placeholder
================================ */
// app.use("/api/auth", authRoutes);
// app.use("/api/rides", rideRoutes);

/* ===============================
   404 Handler
================================ */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

export default app;
