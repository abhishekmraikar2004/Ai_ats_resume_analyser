import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import resumeRoutes from "./routes/resumeRoutes.js";

dotenv.config();

const app = express();

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// TEST ROUTE
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Backend is running",
  });
});

// HEALTH ROUTE
app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "ok",
  });
});

// ROUTES
app.use("/auth", authRoutes);
app.use("/resume", resumeRoutes);

const PORT = process.env.PORT || 10000;

// CONNECT MONGODB + START SERVER
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected successfully");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:");
    console.error(error.message);
    process.exit(1);
  });
