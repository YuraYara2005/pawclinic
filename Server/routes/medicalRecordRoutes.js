const express = require('express');
const router = express.Router();
const {
  getAllRecords,
  createRecord,
  updateRecord,
  deleteRecord
} = require('../controllers/medicalRecordController');

// Add your protect middleware here if you are using it!
// const { protect } = require('../middleware/authMiddleware'); 

router.route('/')
  .get(getAllRecords)     // Handles GET /api/medical-records
  .post(createRecord);    // Handles POST /api/medical-records

router.route('/:id')
  .put(updateRecord)      // Handles PUT /api/medical-records/:id
  .delete(deleteRecord);  // Handles DELETE /api/medical-records/:id

module.exports = router;