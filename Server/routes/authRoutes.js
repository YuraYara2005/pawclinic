const express = require('express');
const router = express.Router();
// We are importing 'register' here now!
const { login, getMe, register } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { loginValidation } = require('../middleware/validationMiddleware');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and get JWT token
 * @access  Public
 */
router.post('/login', loginValidation, login);

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged in user
 * @access  Private
 */
router.get('/me', protect, getMe);

module.exports = router;