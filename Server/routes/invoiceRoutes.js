const express = require('express');
const router = express.Router();
const {
  getAllInvoices,
  createInvoice,
  updateInvoiceStatus
} = require('../controllers/billingController');

// If you have an authentication middleware, import it here:
// const { protect } = require('../middleware/authMiddleware'); 
// and add it to the routes like this: router.route('/').get(protect, getAllInvoices)

router.route('/')
  .get(getAllInvoices)
  .post(createInvoice);

router.route('/:id/status')
  .put(updateInvoiceStatus);

module.exports = router;