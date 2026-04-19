const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const asyncHandler = require('../middleware/asyncHandler');
const { pool } = require('../config/db');

/**
 * Generate JWT Token
 * @param {number} id - User ID
 * @returns {string} JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '1d'
  });
};
/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  console.log(`\n🕵️ DEBUG: Trying to log in with Email: "${email}", Password: "${password}"`);

  // Check if user exists
  const [rows] = await pool.query(
    'SELECT id, email, password_hash, role, name, phone FROM users WHERE email = ?',
    [email]
  );

  if (rows.length === 0) {
    console.log("❌ DEBUG: Failed at Step 1 - No user found in the database with that email.");
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }

  const user = rows[0];
  console.log(`✅ DEBUG: Found user in DB! Hash is: ${user.password_hash}`);

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    console.log("❌ DEBUG: Failed at Step 2 - The password typed does not match the database hash.");
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }

  console.log("🎉 DEBUG: Login successful!");

  // Generate token
  const token = generateToken(user.id);

  // Remove password_hash from response
  delete user.password_hash;

  res.status(200).json({
    success: true,
    data: {
      token,
      user
    }
  });
});
/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  // User is already attached to req by protect middleware
  // No need to query database again, but we'll fetch fresh data for consistency
  const [rows] = await pool.query(
    'SELECT id, email, role, name, phone FROM users WHERE id = ?',
    [req.user.id]
  );

  if (rows.length === 0) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  res.status(200).json({
    success: true,
    data: rows[0]
  });
});
/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone } = req.body;

  // 1. Check if user already exists
  const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  if (existing.length > 0) {
    const error = new Error('User already exists');
    error.statusCode = 400;
    throw error;
  }

  // 2. Hash the password securely using your own server
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // 3. Save to database
  const [result] = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)`,
    [name, email, hashedPassword, role || 'staff', phone || null]
  );

  // 4. Generate token
  const token = generateToken(result.insertId);

  res.status(201).json({
    success: true,
    data: {
      token,
      user: {
        id: result.insertId,
        name,
        email,
        role: role || 'staff'
      }
    }
  });
});

module.exports = {
  login,
  getMe,
  register
};


