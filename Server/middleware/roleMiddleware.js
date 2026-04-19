/**
 * Role-Based Authorization Middleware
 * Restricts access to routes based on user roles
 * Must be used after protect middleware
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    // Check if user exists (should be set by protect middleware)
    if (!req.user) {
      const error = new Error('Not authorized, user not authenticated');
      error.statusCode = 401;
      return next(error);
    }

    // Check if user's role is in allowed roles
    if (!roles.includes(req.user.role)) {
      const error = new Error(
        `User role '${req.user.role}' is not authorized to access this route`
      );
      error.statusCode = 403;
      return next(error);
    }

    next();
  };
};

module.exports = { authorize };
