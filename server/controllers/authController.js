// controllers/authController.js
// Register, log in, and return the current user.

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const httpError = require("../utils/httpError");

// Create a signed token that proves who the user is
function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Quick checks with friendly messages (the schema validates again on save)
  const errors = {};
  if (!name || !String(name).trim()) errors.name = "Name is required.";
  if (!email || !String(email).trim()) errors.email = "Email is required.";
  if (!password) errors.password = "Password is required.";
  else if (String(password).length < 6) errors.password = "Password must be at least 6 characters.";
  if (Object.keys(errors).length) throw httpError(400, "Please fix the highlighted fields.", errors);

  // Anyone who registers is a member. Admins are created by the seed script.
  const user = await User.create({ name, email, password, role: "member" });

  res.status(201).json({
    success: true,
    message: "Account created. Welcome to Pine!",
    token: signToken(user),
    user,
  });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw httpError(400, "Enter your email and password.", {
      ...(email ? {} : { email: "Email is required." }),
      ...(password ? {} : { password: "Password is required." }),
    });
  }

  // password has select:false in the schema, so ask for it explicitly here
  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select("+password");

  // Same message for "no such email" and "wrong password" so attackers can't tell which
  if (!user || !(await user.comparePassword(String(password)))) {
    throw httpError(401, "Email or password is incorrect.");
  }

  res.json({
    success: true,
    message: `Welcome back, ${user.name.split(" ")[0]}!`,
    token: signToken(user),
    user,
  });
});

// GET /api/auth/me  (protected)
const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = { register, login, me };
