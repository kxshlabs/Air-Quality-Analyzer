/**
 * AQI routes — mounted at /api/aqi
 *
 * GET /api/aqi            — all cities sorted by aqi desc
 * GET /api/aqi/fresh      — Live/Recent cities only
 * GET /api/aqi/rankings   — ranked list + summary stats
 * GET /api/aqi/:city      — single city by name (case-insensitive)
 *
 * /fresh and /rankings MUST be declared before /:city
 * to prevent Express treating them as city params.
 */

const { Router } = require("express");
const AqiSnapshot = require("../models/AqiSnapshot");

const router = Router();

/**
 * GET /api/aqi
 * Returns all cities sorted by aqi descending.
 * One document per city — no aggregation needed.
 */
router.get("/", async (_req, res, next) => {
  try {
    const snapshots = await AqiSnapshot
      .find({}, { __v: 0, _id: 0 })
      .sort({ aqi: -1 })
      .lean();

    res.json({ count: snapshots.length, data: snapshots });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/aqi/fresh
 * Returns only cities with freshness "Live" or "Recent".
 */
router.get("/fresh", async (_req, res, next) => {
  try {
    const snapshots = await AqiSnapshot
      .find(
        { freshness: { $in: ["Live", "Recent"] } },
        { __v: 0, _id: 0 }
      )
      .sort({ aqi: -1 })
      .lean();

    res.json({ count: snapshots.length, data: snapshots });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/aqi/rankings
 * Returns all cities ranked by aqi with summary statistics.
 */
router.get("/rankings", async (_req, res, next) => {
  try {
    const cities = await AqiSnapshot
      .find({}, { __v: 0, _id: 0 })
      .sort({ aqi: -1 })
      .lean();

    const rankings = cities.map((city, i) => ({ ...city, rank: i + 1 }));

    const aqiValues = cities
      .map((c) => c.aqi)
      .filter((v) => v !== null && v !== undefined);

    const average_aqi =
      aqiValues.length > 0
        ? Math.round((aqiValues.reduce((a, b) => a + b, 0) / aqiValues.length) * 10) / 10
        : null;

    res.json({
      total: rankings.length,
      most_polluted: rankings[0]?.city ?? null,
      cleanest: rankings[rankings.length - 1]?.city ?? null,
      average_aqi,
      rankings,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/aqi/:city
 * Returns a single city snapshot by name (case-insensitive).
 */
router.get("/:city", async (req, res, next) => {
  try {
    const cityRegex = new RegExp(`^${req.params.city}$`, "i");
    const snapshot = await AqiSnapshot
      .findOne({ city: cityRegex }, { __v: 0, _id: 0 })
      .lean();

    if (!snapshot) {
      return res.status(404).json({ error: "City not found" });
    }

    res.json(snapshot);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
