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

// Initialize Express app
const app = express();

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Set secure HTTP headers
app.use(helmet());

// Enable CORS with configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
  })
);

// Rate limiting to prevent brute force attacks
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes default
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests per window
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
    message: 'PawClinic API is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/owners', ownersRoutes);
app.use('/api/pets', petsRoutes);

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
// SERVER INITIALIZATION
// ============================================

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test database connection
    await testConnection();

    // Start server
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════╗
║   🐾 PawClinic Veterinary Management System   ║
╚═══════════════════════════════════════════════╝

Server running in ${process.env.NODE_ENV || 'development'} mode
Port: ${PORT}
Database: ${process.env.DB_NAME}

Available Routes:
  GET    /health
  POST   /api/auth/login
  GET    /api/auth/me
  GET    /api/inventory
  POST   /api/inventory (admin)
  PUT    /api/inventory/:id (admin)
  DELETE /api/inventory/:id (admin)
  GET    /api/appointments
  POST   /api/appointments
  PUT    /api/appointments/:id
  DELETE /api/appointments/:id
  GET    /api/owners
  POST   /api/owners
  PUT    /api/owners/:id
  DELETE /api/owners/:id
  GET    /api/pets
  POST   /api/pets
  PUT    /api/pets/:id
  DELETE /api/pets/:id

Press CTRL+C to stop
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
  console.error('Shutting down server...');
  process.exit(1);
});
