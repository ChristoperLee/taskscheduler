const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Debug environment variables
console.log('=== Environment Check at Startup ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('All env keys:', Object.keys(process.env).filter(key => !key.startsWith('npm_')).join(', '));

const authRoutes = require('./routes/auth');
const schedulerRoutes = require('./routes/schedulers');
const analyticsRoutes = require('./routes/analytics');
const adminRoutes = require('./routes/admin');
const { errorHandler } = require('./middleware/errorHandler');
const { connectDB } = require('./utils/database');
const setupDatabaseOnce = require('./setup-db-once');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());

// CORS configuration - allow multiple origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://christoperlee.github.io',
  'https://taskscheduler-production.up.railway.app'
];

// Add your local network IP for cross-device testing
const localIP = process.env.LOCAL_IP || '192.168.1.100'; // Replace with your Mac's IP
allowedOrigins.push(`http://${localIP}:3000`);
allowedOrigins.push(`http://${localIP}:5001`);

if (process.env.CORS_ORIGIN) {
  allowedOrigins.push(process.env.CORS_ORIGIN);
}

// Simplified CORS for production
if (process.env.NODE_ENV === 'production') {
  // In production, allow all origins temporarily for debugging
  app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  console.log('CORS: Allowing all origins in production');
} else {
  // In development, use specific origins
  app.use(cors({
    origin: function(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log('Blocked by CORS:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
}
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Handle OPTIONS requests explicitly
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(204);
});

// Add root endpoint for Railway
app.get('/', (req, res) => {
  res.json({ 
    message: 'TaskScheduler API',
    status: 'OK',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    cors: 'enabled'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/schedulers', schedulerRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);

// Temporary setup route - REMOVE AFTER SETUP
const setupRoutes = require('./routes/setup');
const adminSetupRoutes = require('./routes/admin-setup');
const schedulerItemsRoutes = require('./routes/scheduler-items');
app.use('/api', setupRoutes);
app.use('/api/admin-setup', adminSetupRoutes);
app.use('/api/scheduler-items', schedulerItemsRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

// Start server
async function startServer() {
  try {
    await connectDB();
    console.log('✅ Database connected successfully');
    
    // Setup database tables if they don't exist
    await setupDatabaseOnce();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app; 