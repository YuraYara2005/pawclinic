const express = require('express');
const router = express.Router();
const {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment
} = require('../controllers/appointmentController');
const { protect } = require('../middleware/authMiddleware');
const { appointmentValidation } = require('../middleware/validationMiddleware');

/**
 * @route   GET /api/appointments
 * @desc    Get all appointments
 * @access  Private
 */
router.get('/', protect, getAllAppointments);

/**
 * @route   GET /api/appointments/:id
 * @desc    Get single appointment by ID
 * @access  Private
 */
router.get('/:id', protect, getAppointmentById);

/**
 * @route   POST /api/appointments
 * @desc    Create new appointment
 * @access  Private
 */
router.post('/', protect, appointmentValidation, createAppointment);

/**
 * @route   PUT /api/appointments/:id
 * @desc    Update appointment
 * @access  Private
 */
router.put('/:id', protect, appointmentValidation, updateAppointment);

/**
 * @route   DELETE /api/appointments/:id
 * @desc    Delete appointment
 * @access  Private
 */
router.delete('/:id', protect, deleteAppointment);

module.exports = router;
