const asyncHandler = require('../middleware/asyncHandler');
const { pool } = require('../config/db');

/**
 * @desc    Get all pets
 * @route   GET /api/pets
 * @access  Private
 */
const getAllPets = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT 
      p.id, 
      p.owner_id, 
      p.name, 
      p.species, 
      p.breed, 
      p.age, 
      p.weight,
      o.name as owner_name,
      o.phone as owner_phone
    FROM pets p
    LEFT JOIN owners o ON p.owner_id = o.id
    ORDER BY p.name ASC`
  );

  res.status(200).json({
    success: true,
    data: rows
  });
});

/**
 * @desc    Get single pet by ID
 * @route   GET /api/pets/:id
 * @access  Private
 */
const getPetById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [rows] = await pool.query(
    `SELECT 
      p.id, 
      p.owner_id, 
      p.name, 
      p.species, 
      p.breed, 
      p.age, 
      p.weight,
      o.name as owner_name,
      o.email as owner_email,
      o.phone as owner_phone,
      o.address as owner_address
    FROM pets p
    LEFT JOIN owners o ON p.owner_id = o.id
    WHERE p.id = ?`,
    [id]
  );

  if (rows.length === 0) {
    const error = new Error('Pet not found');
    error.statusCode = 404;
    throw error;
  }

  res.status(200).json({
    success: true,
    data: rows[0]
  });
});

/**
 * @desc    Create new pet
 * @route   POST /api/pets
 * @access  Private
 */
const createPet = asyncHandler(async (req, res) => {
  const { owner_id, name, species, breed, age, weight } = req.body;

  // Verify owner exists
  const [ownerRows] = await pool.query('SELECT id FROM owners WHERE id = ?', [owner_id]);
  
  if (ownerRows.length === 0) {
    const error = new Error('Owner not found');
    error.statusCode = 404;
    throw error;
  }

  const [result] = await pool.query(
    `INSERT INTO pets 
    (owner_id, name, species, breed, age, weight) 
    VALUES (?, ?, ?, ?, ?, ?)`,
    [owner_id, name, species, breed || null, age || null, weight || null]
  );

  // Fetch the created pet with owner information
  const [rows] = await pool.query(
    `SELECT 
      p.id, 
      p.owner_id, 
      p.name, 
      p.species, 
      p.breed, 
      p.age, 
      p.weight,
      o.name as owner_name,
      o.phone as owner_phone
    FROM pets p
    LEFT JOIN owners o ON p.owner_id = o.id
    WHERE p.id = ?`,
    [result.insertId]
  );

  res.status(201).json({
    success: true,
    data: rows[0]
  });
});

/**
 * @desc    Update pet
 * @route   PUT /api/pets/:id
 * @access  Private
 */
const updatePet = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { owner_id, name, species, breed, age, weight } = req.body;

  // Check if pet exists
  const [existing] = await pool.query('SELECT id FROM pets WHERE id = ?', [id]);

  if (existing.length === 0) {
    const error = new Error('Pet not found');
    error.statusCode = 404;
    throw error;
  }

  // Verify owner exists
  const [ownerRows] = await pool.query('SELECT id FROM owners WHERE id = ?', [owner_id]);
  
  if (ownerRows.length === 0) {
    const error = new Error('Owner not found');
    error.statusCode = 404;
    throw error;
  }

  // Update pet
  await pool.query(
    `UPDATE pets 
    SET 
      owner_id = ?, 
      name = ?, 
      species = ?, 
      breed = ?, 
      age = ?, 
      weight = ? 
    WHERE id = ?`,
    [owner_id, name, species, breed || null, age || null, weight || null, id]
  );

  // Fetch updated pet with owner information
  const [rows] = await pool.query(
    `SELECT 
      p.id, 
      p.owner_id, 
      p.name, 
      p.species, 
      p.breed, 
      p.age, 
      p.weight,
      o.name as owner_name,
      o.phone as owner_phone
    FROM pets p
    LEFT JOIN owners o ON p.owner_id = o.id
    WHERE p.id = ?`,
    [id]
  );

  res.status(200).json({
    success: true,
    data: rows[0]
  });
});

/**
 * @desc    Delete pet
 * @route   DELETE /api/pets/:id
 * @access  Private
 */
const deletePet = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if pet exists
  const [existing] = await pool.query('SELECT id FROM pets WHERE id = ?', [id]);

  if (existing.length === 0) {
    const error = new Error('Pet not found');
    error.statusCode = 404;
    throw error;
  }

  // Delete pet
  await pool.query('DELETE FROM pets WHERE id = ?', [id]);

  res.status(200).json({
    success: true,
    data: {}
  });
});

module.exports = {
  getAllPets,
  getPetById,
  createPet,
  updatePet,
  deletePet
};
