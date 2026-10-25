// utils/httpError.js
// Creates an Error that carries an HTTP status code.
// Usage: throw httpError(404, "Member not found");

function httpError(statusCode, message, errors) {
  const err = new Error(message);
  err.statusCode = statusCode;
  if (errors) err.errors = errors;
  return err;
}

module.exports = httpError;
