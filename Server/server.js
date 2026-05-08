require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { testConnection } = require('./config/db');
const errorMiddleware = require('./middleware/errorMiddleware');

// Import routes
const authRoutes = require('./routes/authRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const ownersRoutes = require('./routes/ownersRoutes');
const petsRoutes = require('./routes/petsRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');

// Initialize Express app
const app = express();

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Set secure HTTP headers
app.use(helmet());

// Enable CORS (Updated to allow Vercel frontend)
app.use(cors({
  origin: '*', // Allows all origins for now so your frontend won't get blocked
  credentials: true
}));

// Rate limiting to prevent brute force attacks
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, 
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, 
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to all routes
app.use('/api/', limiter);

// ============================================
// BODY PARSER MIDDLEWARE
// ============================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// ROUTES
// ============================================

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'PawClinic API is running on Vercel Serverless!',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/owners', ownersRoutes);
app.use('/api/pets', petsRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/medical-records', require('./routes/medicalRecordRoutes'));

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// ============================================
// ERROR HANDLING MIDDLEWARE (Must be last)
// ============================================

app.use(errorMiddleware);

// ============================================
// SERVER INITIALIZATION (Adapted for Vercel)
// ============================================

const PORT = process.env.PORT || 5000;

// Only run the continuous listener if we are NOT on Vercel
if (process.env.NODE_ENV !== 'production') {
  const startServer = async () => {
    try {
      await testConnection();
      app.listen(PORT, () => {
        console.log(`🐾 PawClinic Local Server running on port ${PORT}`);
      });
    } catch (error) {
      console.error('Failed to start server:', error.message);
      process.exit(1);
    }
  };
  startServer();
}

// 🚨 CRITICAL FOR VERCEL: Export the app!
module.exports = app;