const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Environment validation
const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_EXPIRE',
  'JWT_REFRESH_SECRET',
  'JWT_REFRESH_EXPIRE',
  'EMAIL_HOST',
  'EMAIL_PORT',
  'EMAIL_USER',
  'EMAIL_PASS',
];

// Set default values for development if .env is not available
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}
// Render and other platforms set PORT automatically, use it if available
if (!process.env.PORT) {
  process.env.PORT = '5000';
}
if (!process.env.MONGODB_URI) {
  process.env.MONGODB_URI = 'mongodb://localhost:27017/exam-hall-management';
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'your-super-secret-jwt-key-at-least-32-characters-long-for-development';
}
if (!process.env.JWT_EXPIRE) {
  process.env.JWT_EXPIRE = '15m';
}
if (!process.env.JWT_REFRESH_SECRET) {
  process.env.JWT_REFRESH_SECRET = 'your-super-secret-refresh-key-at-least-32-characters-long-for-dev';
}
if (!process.env.JWT_REFRESH_EXPIRE) {
  process.env.JWT_REFRESH_EXPIRE = '7d';
}
if (!process.env.EMAIL_HOST) {
  process.env.EMAIL_HOST = 'smtp.gmail.com';
}
if (!process.env.EMAIL_PORT) {
  process.env.EMAIL_PORT = '587';
}
if (!process.env.EMAIL_USER) {
  process.env.EMAIL_USER = 'your-email@gmail.com';
}
if (!process.env.EMAIL_PASS) {
  process.env.EMAIL_PASS = 'your-app-password';
}

// Default: do NOT use in-memory DB unless explicitly enabled
if (!process.env.USE_IN_MEMORY_DB) {
  process.env.USE_IN_MEMORY_DB = 'false';
}

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('\nPlease check your .env file and ensure all required variables are set.');
  process.exit(1);
}

// Environment configuration
const environment = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  MONGODB_URI: process.env.MONGODB_URI,

  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRE: process.env.JWT_EXPIRE || '15m',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
  JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || '7d',

  // Email Configuration
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: parseInt(process.env.EMAIL_PORT, 10) || 587,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  EMAIL_SECURE: process.env.EMAIL_SECURE === 'true',

  // Application Configuration
  INSTITUTE_NAME: process.env.INSTITUTE_NAME || 'Exam Hall Management System',
  APP_URL: process.env.APP_URL || 'http://localhost:3000',

  // File Upload Configuration
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024, // 5MB
  UPLOAD_PATH: process.env.UPLOAD_PATH || 'uploads',

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,

  // CORS Configuration
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',

  // Database Configuration
  DB_CONNECTION_TIMEOUT: parseInt(process.env.DB_CONNECTION_TIMEOUT, 10) || 30000,
  DB_SOCKET_TIMEOUT: parseInt(process.env.DB_SOCKET_TIMEOUT, 10) || 45000,

  // Logging Configuration
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  // Security Configuration
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,

  // Validation
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
};

// Validate email configuration
if (!environment.EMAIL_HOST || !environment.EMAIL_USER || !environment.EMAIL_PASS) {
  console.warn('⚠️  Email configuration is incomplete. Email features will be disabled.');
  environment.emailEnabled = false;
} else {
  environment.emailEnabled = true;
}

// Validate MongoDB URI
if (!environment.MONGODB_URI) {
  console.error('❌ MONGODB_URI is required');
  process.exit(1);
}

// Validate JWT secret (more lenient for development)
if (!environment.JWT_SECRET || environment.JWT_SECRET.length < 32) {
  if (environment.isDevelopment) {
    console.warn('⚠️  JWT_SECRET is too short for production, but continuing with development');
  } else {
    console.error('❌ JWT_SECRET must be at least 32 characters long');
    process.exit(1);
  }
}

console.log('✅ Environment configuration validated successfully');
console.log(`🌍 Environment: ${environment.NODE_ENV}`);
console.log(`🚀 Server will run on port: ${environment.PORT}`);
console.log(`📧 Email enabled: ${environment.emailEnabled}`);

module.exports = environment;
