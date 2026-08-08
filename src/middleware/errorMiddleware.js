/**
 * Centralized error-handling middleware.
 * Formats errors consistently as JSON and prevents leakage of internal systems details.
 */
function errorMiddleware(err, req, res, next) {
  // Log the full error server-side for diagnostics
  console.error("Global Error Caught:", err);

  const statusCode = err.statusCode || 500;
  
  // If it's a known error with a status code, return its custom message.
  // Otherwise, default to generic "Internal server error" for unexpected errors.
  const message = err.statusCode ? err.message : "Internal server error";

  return res.status(statusCode).json({
    success: false,
    message
  });
}

module.exports = errorMiddleware;
