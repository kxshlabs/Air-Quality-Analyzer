/**
 * Mongoose model for aqi_snapshots collection.
 * Schema matches the exact document structure written by backend/src/db_writer.py.
 */

const { Schema, model } = require("mongoose");

const AqiSnapshotSchema = new Schema(
  {
    city: { type: String, required: true, unique: true, trim: true },
    date: { type: String, default: null },
    aqi: { type: Number, default: null },
    pm25: { type: Number, default: null },
    pm10: { type: Number, default: null },
    no2: { type: Number, default: null },
    co: { type: Number, default: null },
    so2: { type: Number, default: null },
    o3: { type: Number, default: null },
    temperature: { type: Number, default: null },
    humidity: { type: Number, default: null },
    wind_speed: { type: Number, default: null },
    pressure: { type: Number, default: null },
    dominant_pollutant: { type: String, default: null },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    days_since_update: { type: Number, default: null },
    freshness: {
      type: String,
      enum: ["Live", "Recent", "Aging", "Stale", "Unknown"],
      default: "Unknown",
    },
    data_quality: {
      type: String,
      enum: ["good", "partial", "poor", "Unknown"],
      default: "Unknown",
    },
    is_high_pollution: { type: Boolean, default: false },
    last_written: { type: Date, default: null },
  },
  {
    collection: "aqi_snapshots",
    timestamps: false,
  }
);

module.exports = model("AqiSnapshot", AqiSnapshotSchema);
