// config/db.js
// Opens the connection to MongoDB using Mongoose.
// The connection string comes from the MONGODB_URI variable in server/.env

const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error("MONGODB_URI is missing. Copy server/.env.example to server/.env and fill it in.");
    process.exit(1);
  }

  // Log connection changes so problems are easy to spot in the terminal
  mongoose.connection.on("connected", () => {
    console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  });
  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected. Requests that need the database will return 503 until it reconnects.");
  });
  mongoose.connection.on("error", (err) => {
    console.error("MongoDB error:", err.message);
  });

  try {
    // serverSelectionTimeoutMS: give up after 5 s instead of hanging if MongoDB is not running
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  } catch (err) {
    console.error("\nCould not connect to MongoDB.");
    console.error("Reason:", err.message);
    console.error("Check that MongoDB is running and that MONGODB_URI in server/.env is correct.\n");
    process.exit(1);
  }
}

// Small helper used by the health route and the "database ready" middleware
function isDBConnected() {
  return mongoose.connection.readyState === 1; // 1 = connected
}

module.exports = { connectDB, isDBConnected };
