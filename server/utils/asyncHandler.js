// utils/asyncHandler.js
// Wraps an async controller so any thrown error goes to errorHandler
// (Express 4 does not catch rejected promises by itself).

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
