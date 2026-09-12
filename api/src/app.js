/**
 * Express application factory.
 * Wires middleware, routes, and the central error handler.
 * DB connection is handled in server.js, not here.
 */

const express = require("express");
const cors = require("cors");
const AqiSnapshot = require("../models/AqiSnapshot");
const aqiRoutes = require("../routes/aqi");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Routes ---
app.use("/api/aqi", aqiRoutes);

// Health check — queries DB to confirm connectivity and data presence
app.get("/health", async (_req, res) => {
  try {
    const count = await AqiSnapshot.countDocuments({});
    res.json({
      status: "ok",
      database: "connected",
      cities_in_db: count,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.json({
      status: "error",
      database: "disconnected",
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// 404 handler — catches any route not matched above
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Central error handler — must be last
app.use(errorHandler);

module.exports = app;
