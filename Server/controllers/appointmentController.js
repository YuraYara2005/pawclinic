const asyncHandler = require('../middleware/asyncHandler');
const { pool } = require('../config/db');

/**
 * @desc    Get all appointments
 * @route   GET /api/appointments
 * @access  Private
 */
const getAllAppointments = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT 
      a.id,
      a.pet_id,
      a.owner_id,
      a.date,
      a.time,
      a.reason,
      a.status,
      a.notes,
      p.name as pet_name,
      p.species,
      o.name as owner_name,
      o.phone as owner_phone
    FROM appointments a
    LEFT JOIN pets p ON a.pet_id = p.id
    LEFT JOIN owners o ON a.owner_id = o.id
    ORDER BY a.date DESC, a.time DESC`
  );

  res.status(200).json({
    success: true,
    data: rows
  });
});

/**
 * @desc    Get single appointment by ID
 * @route   GET /api/appointments/:id
 * @access  Private
 */
const getAppointmentById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [rows] = await pool.query(
    `SELECT 
      a.id,
      a.pet_id,
      a.owner_id,
      a.date,
      a.time,
      a.reason,
      a.status,
      a.notes,
      p.name as pet_name,
      p.species,
      p.breed,
      o.name as owner_name,
      o.email as owner_email,
      o.phone as owner_phone
    FROM appointments a
    LEFT JOIN pets p ON a.pet_id = p.id
    LEFT JOIN owners o ON a.owner_id = o.id
    WHERE a.id = ?`,
    [id]
  );

  if (rows.length === 0) {
    const error = new Error('Appointment not found');
    error.statusCode = 404;
    throw error;
  }

  res.status(200).json({
    success: true,
    data: rows[0]
  });
});

/**
 * @desc    Create new appointment
 * @route   POST /api/appointments
 * @access  Private
 */
const createAppointment = asyncHandler(async (req, res) => {
  const { pet_id, owner_id, date, time, reason, status, notes } = req.body;

  // Verify pet exists
  const [petRows] = await pool.query('SELECT id FROM pets WHERE id = ?', [pet_id]);
  if (petRows.length === 0) {
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

  // Verify pet belongs to owner
  const [petOwnerRows] = await pool.query(
    'SELECT id FROM pets WHERE id = ? AND owner_id = ?',
    [pet_id, owner_id]
  );
  if (petOwnerRows.length === 0) {
    const error = new Error('Pet does not belong to specified owner');
    error.statusCode = 400;
    throw error;
  }

  const [result] = await pool.query(
    `INSERT INTO appointments 
    (pet_id, owner_id, date, time, reason, status, notes) 
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      pet_id,
      owner_id,
      date,
      time,
      reason,
      status || 'scheduled',
      notes || null
    ]
  );

  // Fetch the created appointment with joins
  const [rows] = await pool.query(
    `SELECT 
      a.id,
      a.pet_id,
      a.owner_id,
      a.date,
      a.time,
      a.reason,
      a.status,
      a.notes,
      p.name as pet_name,
      p.species,
      o.name as owner_name,
      o.phone as owner_phone
    FROM appointments a
    LEFT JOIN pets p ON a.pet_id = p.id
    LEFT JOIN owners o ON a.owner_id = o.id
    WHERE a.id = ?`,
    [result.insertId]
  );

  const newAppointment = rows[0];

  // 🚀 Fire off the email asynchronously (don't use 'await' here so the user doesn't have to wait for the email to send before the UI updates)
  if (newAppointment.owner_email) {
    sendAppointmentConfirmation(
      newAppointment.owner_email,
      newAppointment.owner_name,
      newAppointment.pet_name,
      newAppointment.date,
      newAppointment.time
    );
  }

  res.status(201).json({
    success: true,
    data: rows[0]
  });
});

/**
 * @desc    Update appointment
 * @route   PUT /api/appointments/:id
 * @access  Private
 */
const updateAppointment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { pet_id, owner_id, date, time, reason, status, notes } = req.body;

  // Check if appointment exists
  const [existing] = await pool.query('SELECT id FROM appointments WHERE id = ?', [id]);

  if (existing.length === 0) {
    const error = new Error('Appointment not found');
    error.statusCode = 404;
    throw error;
  }

  // Verify pet exists
  const [petRows] = await pool.query('SELECT id FROM pets WHERE id = ?', [pet_id]);
  if (petRows.length === 0) {
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

  // Verify pet belongs to owner
  const [petOwnerRows] = await pool.query(
    'SELECT id FROM pets WHERE id = ? AND owner_id = ?',
    [pet_id, owner_id]
  );
  if (petOwnerRows.length === 0) {
    const error = new Error('Pet does not belong to specified owner');
    error.statusCode = 400;
    throw error;
  }

  // Update appointment
  await pool.query(
    `UPDATE appointments 
    SET 
      pet_id = ?, 
      owner_id = ?, 
      date = ?, 
      time = ?, 
      reason = ?, 
      status = ?, 
      notes = ? 
    WHERE id = ?`,
    [pet_id, owner_id, date, time, reason, status || 'scheduled', notes || null, id]
  );

  // Fetch updated appointment with joins
  const [rows] = await pool.query(
    `SELECT 
      a.id,
      a.pet_id,
      a.owner_id,
      a.date,
      a.time,
      a.reason,
      a.status,
      a.notes,
      p.name as pet_name,
      p.species,
      o.name as owner_name,
      o.phone as owner_phone
    FROM appointments a
    LEFT JOIN pets p ON a.pet_id = p.id
    LEFT JOIN owners o ON a.owner_id = o.id
    WHERE a.id = ?`,
    [id]
  );

  res.status(200).json({
    success: true,
    data: rows[0]
  });
});

/**
 * @desc    Delete appointment
 * @route   DELETE /api/appointments/:id
 * @access  Private
 */
const deleteAppointment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if appointment exists
  const [existing] = await pool.query('SELECT id FROM appointments WHERE id = ?', [id]);

  if (existing.length === 0) {
    const error = new Error('Appointment not found');
    error.statusCode = 404;
    throw error;
  }

  // Delete appointment
  await pool.query('DELETE FROM appointments WHERE id = ?', [id]);

  res.status(200).json({
    success: true,
    data: {}
  });
});

module.exports = {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment
};
