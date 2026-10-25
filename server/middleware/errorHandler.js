// middleware/errorHandler.js
// Every error in the app ends up here, so the frontend always receives
// the same JSON shape: { success: false, message, errors? }

const mongoose = require("mongoose");

// 404 for unknown /api routes
function notFound(req, res, next) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Mongoose schema validation failed -> 400 with a message for each field
  if (err instanceof mongoose.Error.ValidationError) {
    const errors = {};
    for (const [field, detail] of Object.entries(err.errors)) {
      errors[field] = detail.message;
    }
    return res.status(400).json({ success: false, message: "Please fix the highlighted fields.", errors });
  }

  // Invalid MongoDB id such as /api/members/123 -> 400
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ success: false, message: `Invalid ${err.path}: ${err.value}` });
  }

  // Unique index violated (for example, the same email twice) -> 409
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return res.status(409).json({
      success: false,
      message: `A record with this ${field} already exists.`,
      errors: { [field]: `This ${field} is already registered.` },
    });
  }

  // Body was not valid JSON
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ success: false, message: "Request body is not valid JSON." });
  }

  // Errors we created on purpose with a status code (see utils/httpError.js)
  const status = err.statusCode || 500;
  if (status >= 500) console.error(err);

  res.status(status).json({
    success: false,
    message: status >= 500 ? "Something went wrong on the server." : err.message,
    ...(err.errors ? { errors: err.errors } : {}),
  });
}

module.exports = { notFound, errorHandler };
