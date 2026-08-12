const jwt = require('jsonwebtoken');

/**
 * Middleware to verify JWT authentication token.
 * Attaches decoded payload to req.user if verification succeeds.
 */
function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];

    // 1. Check if Authorization header is present and starts with 'Bearer '
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required"
      });
    }

    // 2. Extract token
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required"
      });
    }

    // 3. Verify JWT_SECRET is present
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT_SECRET environment variable is missing.");
      return res.status(500).json({
        success: false,
        message: "An internal server error occurred during authentication."
      });
    }

    // 4. Verify token
    jwt.verify(token, jwtSecret, (err, decoded) => {
      if (err) {
        // Return generic message for invalid, malformed, or expired token
        return res.status(401).json({
          success: false,
          message: "Invalid or expired authentication token"
        });
      }

      // 5. Attach decoded payload to req.user
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role
      };

      // 6. Proceed to next handler
      return next();
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while authenticating token."
    });
  }
}

module.exports = {
  authenticateToken
};
