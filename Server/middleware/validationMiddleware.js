const { body, validationResult } = require('express-validator');

/**
 * Validation Result Handler
 * Checks for validation errors and returns formatted error response
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg).join(', ');
    return res.status(400).json({
      success: false,
      message: errorMessages
    });
  }
  next();
};

/**
 * Login Validation Rules
 */
const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  handleValidationErrors
];

/**
 * Inventory Item Validation Rules
 */
const inventoryValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Item name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Item name must be between 2 and 100 characters'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .isLength({ max: 50 })
    .withMessage('Category must not exceed 50 characters'),
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer')
    .toInt(),
  body('unit')
    .trim()
    .notEmpty()
    .withMessage('Unit is required')
    .isLength({ max: 20 })
    .withMessage('Unit must not exceed 20 characters'),
  body('unit_price')
    .notEmpty()
    .withMessage('Unit price is required')
    .isFloat({ min: 0 })
    .withMessage('Unit price must be a non-negative number')
    .toFloat(),
  body('low_stock_threshold')
    .notEmpty()
    .withMessage('Low stock threshold is required')
    .isInt({ min: 0 })
    .withMessage('Low stock threshold must be a non-negative integer')
    .toInt(),
  body('supplier')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Supplier must not exceed 100 characters'),
  body('description')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('expiry_date')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Expiry date must be a valid date (YYYY-MM-DD)')
    .toDate(),
  handleValidationErrors
];

/**
 * Appointment Validation Rules
 */
const appointmentValidation = [
  body('pet_id')
    .notEmpty()
    .withMessage('Pet ID is required')
    .isInt({ min: 1 })
    .withMessage('Pet ID must be a valid positive integer')
    .toInt(),
  body('owner_id')
    .notEmpty()
    .withMessage('Owner ID is required')
    .isInt({ min: 1 })
    .withMessage('Owner ID must be a valid positive integer')
    .toInt(),
  body('date')
    .notEmpty()
    .withMessage('Appointment date is required')
    .isISO8601()
    .withMessage('Date must be a valid date (YYYY-MM-DD)')
    .toDate(),
  body('time')
    .notEmpty()
    .withMessage('Appointment time is required')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Time must be in HH:MM format (24-hour)'),
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Reason for appointment is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Reason must be between 5 and 200 characters'),
  body('status')
    .optional()
    .trim()
    .isIn(['scheduled', 'completed', 'cancelled', 'no-show'])
    .withMessage('Status must be one of: scheduled, completed, cancelled, no-show'),
  body('notes')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters'),
  handleValidationErrors
];

/**
 * Owner Validation Rules
 */
const ownerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Owner name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Owner name must be between 2 and 100 characters'),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .isLength({ max: 20 })
    .withMessage('Phone number must not exceed 20 characters'),
  body('email')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('address')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address must not exceed 500 characters'),
  handleValidationErrors
];

/**
 * Pet Validation Rules
 */
const petValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Pet name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Pet name must be between 1 and 100 characters'),
  body('owner_id')
    .notEmpty()
    .withMessage('Owner ID is required')
    .isInt({ min: 1 })
    .withMessage('Owner ID must be a valid positive integer')
    .toInt(),
  body('species')
    .trim()
    .notEmpty()
    .withMessage('Species is required')
    .isLength({ max: 50 })
    .withMessage('Species must not exceed 50 characters'),
  body('breed')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Breed must not exceed 100 characters'),
  body('age')
    .optional({ checkFalsy: true })
    .isInt({ min: 0, max: 100 })
    .withMessage('Age must be a valid integer between 0 and 100')
    .toInt(),
  body('weight')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage('Weight must be a non-negative number')
    .toFloat(),
  handleValidationErrors
];

module.exports = {
  loginValidation,
  inventoryValidation,
  appointmentValidation,
  ownerValidation,
  petValidation,
  handleValidationErrors
};
