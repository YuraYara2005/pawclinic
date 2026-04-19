const express = require('express');
const router = express.Router();
const {
  getAllPets,
  getPetById,
  createPet,
  updatePet,
  deletePet
} = require('../controllers/petsController');
const { protect } = require('../middleware/authMiddleware');
const { petValidation } = require('../middleware/validationMiddleware');

/**
 * @route   GET /api/pets
 * @desc    Get all pets
 * @access  Private
 */
router.get('/', protect, getAllPets);

/**
 * @route   GET /api/pets/:id
 * @desc    Get single pet by ID
 * @access  Private
 */
router.get('/:id', protect, getPetById);

/**
 * @route   POST /api/pets
 * @desc    Create new pet
 * @access  Private
 */
router.post('/', protect, petValidation, createPet);

/**
 * @route   PUT /api/pets/:id
 * @desc    Update pet
 * @access  Private
 */
router.put('/:id', protect, petValidation, updatePet);

/**
 * @route   DELETE /api/pets/:id
 * @desc    Delete pet
 * @access  Private
 */
router.delete('/:id', protect, deletePet);

module.exports = router;
