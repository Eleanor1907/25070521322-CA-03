// middleware/requireDB.js
// If MongoDB drops while the server is running, answer quickly with 503
// instead of letting the request hang until Mongoose times out.

const { isDBConnected } = require("../config/db");

function requireDB(req, res, next) {
  if (!isDBConnected()) {
    return res.status(503).json({
      success: false,
      message: "The database is not reachable right now. Check that MongoDB is running, then try again.",
    });
  }
  next();
}

module.exports = requireDB;
