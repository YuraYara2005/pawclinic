const express = require('express');
const router = express.Router();
const {
  getAllOwners,
  getOwnerById,
  createOwner,
  updateOwner,
  deleteOwner
} = require('../controllers/ownersController');
const { protect } = require('../middleware/authMiddleware');
const { ownerValidation } = require('../middleware/validationMiddleware');

/**
 * @route   GET /api/owners
 * @desc    Get all owners
 * @access  Private
 */
router.get('/', protect, getAllOwners);

/**
 * @route   GET /api/owners/:id
 * @desc    Get single owner by ID
 * @access  Private
 */
router.get('/:id', protect, getOwnerById);

/**
 * @route   POST /api/owners
 * @desc    Create new owner
 * @access  Private
 */
router.post('/', protect, ownerValidation, createOwner);

/**
 * @route   PUT /api/owners/:id
 * @desc    Update owner
 * @access  Private
 */
router.put('/:id', protect, ownerValidation, updateOwner);

/**
 * @route   DELETE /api/owners/:id
 * @desc    Delete owner
 * @access  Private
 */
router.delete('/:id', protect, deleteOwner);

module.exports = router;
