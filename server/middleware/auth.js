// middleware/auth.js
// protect   -> the request must carry a valid login token (JWT)
// adminOnly -> the logged-in user must have role "admin"

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const httpError = require("../utils/httpError");

const protect = asyncHandler(async (req, res, next) => {
  // The React app sends:  Authorization: Bearer <token>
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) throw httpError(401, "Please log in to continue.");

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw httpError(401, "Your session has expired. Please log in again.");
  }

  // Load the user fresh from MongoDB so deleted users or role changes take effect
  const user = await User.findById(payload.id);
  if (!user) throw httpError(401, "This account no longer exists. Please register again.");

  req.user = user; // available to every controller after this middleware
  next();
});

function adminOnly(req, res, next) {
  if (req.user?.role !== "admin") {
    return next(httpError(403, "Only Pine admins can do this."));
  }
  next();
}

module.exports = { protect, adminOnly };
