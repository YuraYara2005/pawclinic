const asyncHandler = require('../middleware/asyncHandler');
const { pool } = require('../config/db');

/**
 * @desc    Get all invoices with owner details
 * @route   GET /api/invoices
 * @access  Private
 */
const getAllInvoices = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT 
      i.id,
      i.owner_id,
      i.invoice_number,
      i.date,
      i.due_date,
      i.items,
      i.total_amount,
      i.status,
      o.name as owner_name,
      o.email as owner_email
    FROM invoices i
    LEFT JOIN owners o ON i.owner_id = o.id
    ORDER BY i.created_at DESC`
  );

  res.status(200).json({
    success: true,
    data: rows
  });
});

/**
 * @desc    Create new invoice
 * @route   POST /api/invoices
 * @access  Private
 */
const createInvoice = asyncHandler(async (req, res) => {
  const { owner_id, date, due_date, items, total_amount, status } = req.body;

  // Verify owner exists
  const [ownerRows] = await pool.query('SELECT id FROM owners WHERE id = ?', [owner_id]);
  if (ownerRows.length === 0) {
    const error = new Error('Owner not found');
    error.statusCode = 404;
    throw error;
  }

  // Generate a professional invoice number (e.g., INV-1713500000)
  const invoice_number = `INV-${Math.floor(Date.now() / 1000)}`;

  const [result] = await pool.query(
    `INSERT INTO invoices 
    (owner_id, invoice_number, date, due_date, items, total_amount, status) 
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      owner_id, 
      invoice_number, 
      date, 
      due_date, 
      items, // The frontend already stringified this!
      total_amount, 
      status || 'pending'
    ]
  );

  res.status(201).json({
    success: true,
    data: { id: result.insertId, invoice_number }
  });
});

/**
 * @desc    Update invoice status (Paid/Pending/Overdue)
 * @route   PUT /api/invoices/:id/status
 * @access  Private
 */
const updateInvoiceStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const [existing] = await pool.query('SELECT id FROM invoices WHERE id = ?', [id]);
  if (existing.length === 0) {
    const error = new Error('Invoice not found');
    error.statusCode = 404;
    throw error;
  }

  await pool.query(
    'UPDATE invoices SET status = ? WHERE id = ?',
    [status, id]
  );

  res.status(200).json({
    success: true,
    message: 'Status updated successfully'
  });
});

module.exports = {
  getAllInvoices,
  createInvoice,
  updateInvoiceStatus
};