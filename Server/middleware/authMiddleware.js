const jwt = require('jsonwebtoken');
const asyncHandler = require('./asyncHandler');
const { pool } = require('../config/db');

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request object
 * Protects routes that require authentication
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check if token exists in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Check if token exists
  if (!token) {
    const error = new Error('Not authorized, no token provided');
    error.statusCode = 401;
    throw error;
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database (excluding password_hash)
    const [rows] = await pool.query(
      'SELECT id, email, role, name, phone FROM users WHERE id = ?',
      [decoded.id]
    );

    if (rows.length === 0) {
      const error = new Error('User not found');
      error.statusCode = 401;
      throw error;
    }

    // Attach user to request object
    req.user = rows[0];
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      error.statusCode = 401;
      error.message = 'Not authorized, invalid token';
    }
    if (error.name === 'TokenExpiredError') {
      error.statusCode = 401;
      error.message = 'Not authorized, token expired';
    }
    throw error;
  }
});

module.exports = { protect };
