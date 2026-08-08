/**
 * Handler for unmatched endpoints (404 Not Found).
 */
function notFoundMiddleware(req, res, next) {
  return res.status(404).json({
    success: false,
    message: "Route not found"
  });
}

module.exports = notFoundMiddleware;
