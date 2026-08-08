/**
 * Middleware to restrict API access based on the authenticated user's role.
 * Assumes that authenticateToken middleware has already executed and populated req.user.
 * 
 * @param {...string} allowedRoles - List of roles permitted to access the resource.
 * @returns {Function} Express middleware function.
 */
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    // 1. Check if user object is present on req (derived from verified JWT)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    // 2. Check if user's role is in the allowed roles list
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to access this resource"
      });
    }

    // 3. Authorized, proceed to the next handler
    return next();
  };
}

module.exports = {
  authorizeRoles
};
