/**
 * Central Express error handler middleware.
 * Must be the last middleware registered in app.js.
 */

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || "Internal server error",
  });
}

module.exports = errorHandler;
