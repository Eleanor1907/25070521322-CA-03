// server.js
// Entry point of the Pine backend.
// Start it with:  npm run dev   (auto-restarts on save)   or   npm start

// ---------- Startup log ----------
// Everything the server prints is also saved to server/flexi-server.log,
// so problems can be read even after the terminal window is closed.
const fs = require("fs");
const path = require("path");
const LOG_FILE = path.join(__dirname, "flexi-server.log");
try {
  fs.writeFileSync(LOG_FILE, `--- Pine server starting ${new Date().toString()} (node ${process.version}) ---\n`);
} catch {
  /* logging is optional */
}
for (const method of ["log", "warn", "error"]) {
  const original = console[method].bind(console);
  console[method] = (...args) => {
    original(...args);
    try {
      const text = args.map((a) => (a instanceof Error ? a.stack : typeof a === "string" ? a : JSON.stringify(a))).join(" ");
      fs.appendFileSync(LOG_FILE, text + "\n");
    } catch {
      /* ignore */
    }
  };
}
process.on("uncaughtException", (err) => {
  console.error("Pine server crashed:", err);
  process.exit(1);
});

require("dotenv").config(); // loads server/.env into process.env

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const mongoose = require("mongoose");

const { connectDB } = require("./config/db");
const requireDB = require("./middleware/requireDB");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is missing. Copy server/.env.example to server/.env and set a long random value.");
  process.exit(1);
}

// ---------- Global middleware ----------
app.use(cors({ origin: CLIENT_URL.split(",").map((s) => s.trim()) })); // only our React app may call the API
app.use(express.json({ limit: "100kb" })); // parse JSON request bodies
app.use(morgan("dev")); // log every request in the terminal

// ---------- Health check (works even when MongoDB is down) ----------
app.get("/api/health", (req, res) => {
  const states = ["disconnected", "connected", "connecting", "disconnecting"];
  res.json({
    success: true,
    api: "running",
    database: states[mongoose.connection.readyState] || "unknown",
    time: new Date().toISOString(),
  });
});

// ---------- Feature routes (all need the database) ----------
app.use("/api/auth", requireDB, require("./routes/authRoutes"));
app.use("/api/spaces", requireDB, require("./routes/spaceRoutes"));
app.use("/api/bookings", requireDB, require("./routes/bookingRoutes"));

// ---------- Errors ----------
app.use("/api", notFound);
app.use(errorHandler);

// ---------- Start ----------
connectDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`Pine API running at http://localhost:${PORT}/api`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`Port ${PORT} is already in use. Close the other server or change PORT in server/.env.`);
    } else if (err.code === "EACCES") {
      console.error(
        `Windows won't let Pine use port ${PORT} (it is reserved on this computer).\n` +
          `Set PORT=5050 in server/.env and VITE_API_URL=http://localhost:5050/api in client/.env, then start both again.`
      );
    } else {
      console.error(err);
    }
    process.exit(1);
  });
});

module.exports = app;
