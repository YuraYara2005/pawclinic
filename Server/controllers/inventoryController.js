const asyncHandler = require('../middleware/asyncHandler');
const { pool } = require('../config/db');

/**
 * @desc    Get all inventory items
 * @route   GET /api/inventory
 * @access  Private
 */
const getAllInventory = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT 
      id, 
      name, 
      category, 
      quantity, 
      unit, 
      unit_price, 
      low_stock_threshold, 
      supplier, 
      description, 
      expiry_date 
    FROM inventory 
    ORDER BY name ASC`
  );

  res.status(200).json({
    success: true,
    data: rows
  });
});

/**
 * @desc    Get single inventory item by ID
 * @route   GET /api/inventory/:id
 * @access  Private
 */
const getInventoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [rows] = await pool.query(
    `SELECT 
      id, 
      name, 
      category, 
      quantity, 
      unit, 
      unit_price, 
      low_stock_threshold, 
      supplier, 
      description, 
      expiry_date 
    FROM inventory 
    WHERE id = ?`,
    [id]
  );

  if (rows.length === 0) {
    const error = new Error('Inventory item not found');
    error.statusCode = 404;
    throw error;
  }

  res.status(200).json({
    success: true,
    data: rows[0]
  });
});

/**
 * @desc    Create new inventory item
 * @route   POST /api/inventory
 * @access  Private (Admin only)
 */
const createInventory = asyncHandler(async (req, res) => {
  const {
    name,
    category,
    quantity,
    unit,
    unit_price,
    low_stock_threshold,
    supplier,
    description,
    expiry_date
  } = req.body;

  const [result] = await pool.query(
    `INSERT INTO inventory 
    (name, category, quantity, unit, unit_price, low_stock_threshold, supplier, description, expiry_date) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name,
      category,
      quantity,
      unit,
      unit_price,
      low_stock_threshold,
      supplier || null,
      description || null,
      expiry_date || null
    ]
  );

  // Fetch the created item
  const [rows] = await pool.query(
    `SELECT 
      id, 
      name, 
      category, 
      quantity, 
      unit, 
      unit_price, 
      low_stock_threshold, 
      supplier, 
      description, 
      expiry_date 
    FROM inventory 
    WHERE id = ?`,
    [result.insertId]
  );

  res.status(201).json({
    success: true,
    data: rows[0]
  });
});

/**
 * @desc    Update inventory item
 * @route   PUT /api/inventory/:id
 * @access  Private (Admin only)
 */
const updateInventory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    name,
    category,
    quantity,
    unit,
    unit_price,
    low_stock_threshold,
    supplier,
    description,
    expiry_date
  } = req.body;

  // Check if item exists
  const [existing] = await pool.query('SELECT id FROM inventory WHERE id = ?', [id]);

  if (existing.length === 0) {
    const error = new Error('Inventory item not found');
    error.statusCode = 404;
    throw error;
  }

  // Update item
  await pool.query(
    `UPDATE inventory 
    SET 
      name = ?, 
      category = ?, 
      quantity = ?, 
      unit = ?, 
      unit_price = ?, 
      low_stock_threshold = ?, 
      supplier = ?, 
      description = ?, 
      expiry_date = ? 
    WHERE id = ?`,
    [
      name,
      category,
      quantity,
      unit,
      unit_price,
      low_stock_threshold,
      supplier || null,
      description || null,
      expiry_date || null,
      id
    ]
  );

  // Fetch updated item
  const [rows] = await pool.query(
    `SELECT 
      id, 
      name, 
      category, 
      quantity, 
      unit, 
      unit_price, 
      low_stock_threshold, 
      supplier, 
      description, 
      expiry_date 
    FROM inventory 
    WHERE id = ?`,
    [id]
  );

  res.status(200).json({
    success: true,
    data: rows[0]
  });
});

/**
 * @desc    Delete inventory item
 * @route   DELETE /api/inventory/:id
 * @access  Private (Admin only)
 */
const deleteInventory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if item exists
  const [existing] = await pool.query('SELECT id FROM inventory WHERE id = ?', [id]);

  if (existing.length === 0) {
    const error = new Error('Inventory item not found');
    error.statusCode = 404;
    throw error;
  }

  // Delete item
  await pool.query('DELETE FROM inventory WHERE id = ?', [id]);

  res.status(200).json({
    success: true,
    data: {}
  });
});

module.exports = {
  getAllInventory,
  getInventoryById,
  createInventory,
  updateInventory,
  deleteInventory
};
