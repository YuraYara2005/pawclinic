const asyncHandler = require('../middleware/asyncHandler');
const { pool } = require('../config/db');

// @desc    Get all medical records
// @route   GET /api/medical-records
const getAllRecords = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT * FROM medical_records ORDER BY visit_date DESC`
  );

  res.status(200).json({
    success: true,
    data: rows
  });
});

// @desc    Create a new medical record
// @route   POST /api/medical-records
const createRecord = asyncHandler(async (req, res) => {
  const { pet_id, chief_complaint, diagnosis, treatment, visit_date, notes } = req.body;

  const [result] = await pool.query(
    `INSERT INTO medical_records 
    (pet_id, chief_complaint, diagnosis, treatment, visit_date, notes) 
    VALUES (?, ?, ?, ?, ?, ?)`,
    [pet_id, chief_complaint, diagnosis, treatment, visit_date, notes || null]
  );

  // Fetch the newly created record to send back
  const [rows] = await pool.query(`SELECT * FROM medical_records WHERE id = ?`, [result.insertId]);

  res.status(201).json({
    success: true,
    data: rows[0]
  });
});

// @desc    Update a medical record
// @route   PUT /api/medical-records/:id
const updateRecord = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { pet_id, chief_complaint, diagnosis, treatment, visit_date, notes } = req.body;

  await pool.query(
    `UPDATE medical_records 
    SET pet_id = ?, chief_complaint = ?, diagnosis = ?, treatment = ?, visit_date = ?, notes = ? 
    WHERE id = ?`,
    [pet_id, chief_complaint, diagnosis, treatment, visit_date, notes || null, id]
  );

  res.status(200).json({
    success: true,
    message: "Record updated successfully"
  });
});

// @desc    Delete a medical record
// @route   DELETE /api/medical-records/:id
const deleteRecord = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await pool.query('DELETE FROM medical_records WHERE id = ?', [id]);

  res.status(200).json({
    success: true,
    message: "Record deleted successfully"
  });
});

module.exports = {
  getAllRecords,
  createRecord,
  updateRecord,
  deleteRecord
};