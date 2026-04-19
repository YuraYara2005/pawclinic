const asyncHandler = require('../middleware/asyncHandler');
const { pool } = require('../config/db');

/**
 * @desc    Get all owners
 * @route   GET /api/owners
 * @access  Private
 */
const getAllOwners = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT 
      id, 
      name, 
      email, 
      phone, 
      address 
    FROM owners 
    ORDER BY name ASC`
  );

  res.status(200).json({
    success: true,
    data: rows
  });
});

/**
 * @desc    Get single owner by ID
 * @route   GET /api/owners/:id
 * @access  Private
 */
const getOwnerById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [rows] = await pool.query(
    `SELECT 
      id, 
      name, 
      email, 
      phone, 
      address 
    FROM owners 
    WHERE id = ?`,
    [id]
  );

  if (rows.length === 0) {
    const error = new Error('Owner not found');
    error.statusCode = 404;
    throw error;
  }

  res.status(200).json({
    success: true,
    data: rows[0]
  });
});

/**
 * @desc    Create new owner
 * @route   POST /api/owners
 * @access  Private
 */
const createOwner = asyncHandler(async (req, res) => {
  const { name, email, phone, address } = req.body;

  const [result] = await pool.query(
    `INSERT INTO owners 
    (name, email, phone, address) 
    VALUES (?, ?, ?, ?)`,
    [name, email || null, phone, address || null]
  );

  // Fetch the created owner
  const [rows] = await pool.query(
    `SELECT 
      id, 
      name, 
      email, 
      phone, 
      address 
    FROM owners 
    WHERE id = ?`,
    [result.insertId]
  );

  res.status(201).json({
    success: true,
    data: rows[0]
  });
});

/**
 * @desc    Update owner
 * @route   PUT /api/owners/:id
 * @access  Private
 */
const updateOwner = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, address } = req.body;

  // Check if owner exists
  const [existing] = await pool.query('SELECT id FROM owners WHERE id = ?', [id]);

  if (existing.length === 0) {
    const error = new Error('Owner not found');
    error.statusCode = 404;
    throw error;
  }

  // Update owner
  await pool.query(
    `UPDATE owners 
    SET 
      name = ?, 
      email = ?, 
      phone = ?, 
      address = ? 
    WHERE id = ?`,
    [name, email || null, phone, address || null, id]
  );

  // Fetch updated owner
  const [rows] = await pool.query(
    `SELECT 
      id, 
      name, 
      email, 
      phone, 
      address 
    FROM owners 
    WHERE id = ?`,
    [id]
  );

  res.status(200).json({
    success: true,
    data: rows[0]
  });
});

/**
 * @desc    Delete owner
 * @route   DELETE /api/owners/:id
 * @access  Private
 */
const deleteOwner = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if owner exists
  const [existing] = await pool.query('SELECT id FROM owners WHERE id = ?', [id]);

  if (existing.length === 0) {
    const error = new Error('Owner not found');
    error.statusCode = 404;
    throw error;
  }

  // Check if owner has pets
  const [pets] = await pool.query('SELECT id FROM pets WHERE owner_id = ?', [id]);

  if (pets.length > 0) {
    const error = new Error('Cannot delete owner with existing pets. Delete pets first or reassign them.');
    error.statusCode = 400;
    throw error;
  }

  // Delete owner
  await pool.query('DELETE FROM owners WHERE id = ?', [id]);

  res.status(200).json({
    success: true,
    data: {}
  });
});

module.exports = {
  getAllOwners,
  getOwnerById,
  createOwner,
  updateOwner,
  deleteOwner
};
