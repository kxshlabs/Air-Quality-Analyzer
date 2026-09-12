/**
 * MongoDB Atlas connection via Mongoose.
 * Reads MONGO_URI from root .env — loaded by the caller.
 */

const mongoose = require("mongoose");

/**
 * Opens a Mongoose connection to MongoDB Atlas.
 * Exits the process on connection failure so the server never starts in a broken state.
 */
async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error("MONGO_URI is not defined in environment variables.");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log("MongoDB Atlas connected.");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
