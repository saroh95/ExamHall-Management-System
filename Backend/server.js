const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

// Import configurations
const environment = require('./config/environment');
const connectDB = require('./config/database');
const corsConfig = require('./config/cors');
const { apiLimiter } = require('./config/rateLimit');

// Import middleware
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Import utilities
const logger = require('./utils/logger');

// Import routes
const apiRoutes = require('./routes');

const app = express();

// CORS configuration - MUST be before any middleware that can reject requests
app.use(corsConfig);

// Handle preflight globally before rate limiting/security
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ['\'self\''],
      styleSrc: ['\'self\'', '\'unsafe-inline\''],
      scriptSrc: ['\'self\''],
      imgSrc: ['\'self\'', 'data:', 'https:'],
    },
  },
  crossOriginEmbedderPolicy: false,
}));
app.use(compression());

// Rate limiting (increase window for file uploads to prevent timeouts during large CSV processing)
app.use('/api/', apiLimiter);

// Increase JSON and urlencoded body size limits for safety in other routes
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Cookie parser middleware
app.use(cookieParser());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (environment.isDevelopment) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}
// app.get('/', (req, res) => {
//   res.status(200).json({
//     message: 'Backend is running successfully 🚀',
//     status: 'OK'
//   });
// });


// Static files
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: environment.NODE_ENV,
  });
});

// Root endpoint (useful for Render "Open in browser" and quick sanity checks)
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Exam Hall Management System backend is running',
    health: '/health',
    apiBase: '/api',
  });
});

// Optional: API base ping
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is reachable',
  });
});

// API routes
app.use('/api', apiRoutes);

// 404 handler
app.use(notFound);

// Error handling middleware (must be last)
app.use(errorHandler);

// Database connection
connectDB();

// Start server
const server = app.listen(environment.PORT, () => {
  logger.info(`🚀 Server running on port ${environment.PORT}`, {
    environment: environment.NODE_ENV,
    port: environment.PORT,
    timestamp: new Date().toISOString(),
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  logger.error('Unhandled Promise Rejection:', {
    error: err.message,
    stack: err.stack,
    promise,
  });
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', {
    error: err.message,
    stack: err.stack,
  });
  server.close(() => {
    process.exit(1);
  });
});

module.exports = app;
