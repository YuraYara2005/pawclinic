const express = require('express');
const router = express.Router();
const {
  getAllInventory,
  getInventoryById,
  createInventory,
  updateInventory,
  deleteInventory
} = require('../controllers/inventoryController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { inventoryValidation } = require('../middleware/validationMiddleware');

/**
 * @route   GET /api/inventory
 * @desc    Get all inventory items
 * @access  Private
 */
router.get('/', protect, getAllInventory);

/**
 * @route   GET /api/inventory/:id
 * @desc    Get single inventory item by ID
 * @access  Private
 */
router.get('/:id', protect, getInventoryById);

/**
 * @route   POST /api/inventory
 * @desc    Create new inventory item
 * @access  Private (Admin only)
 */
router.post('/', protect, authorize('admin'), inventoryValidation, createInventory);

/**
 * @route   PUT /api/inventory/:id
 * @desc    Update inventory item
 * @access  Private (Admin only)
 */
router.put('/:id', protect, authorize('admin'), inventoryValidation, updateInventory);

/**
 * @route   DELETE /api/inventory/:id
 * @desc    Delete inventory item
 * @access  Private (Admin only)
 */
router.delete('/:id', protect, authorize('admin'), deleteInventory);

module.exports = router;
