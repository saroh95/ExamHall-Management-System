const cors = require('cors');

const corsOptions = {
  origin (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Build allowed origins list
    const allowedOrigins = [];
    
    if (process.env.NODE_ENV === 'production') {
      // Production: Use environment variables
      if (process.env.CORS_ORIGIN) {
        allowedOrigins.push(process.env.CORS_ORIGIN);
      }
      if (process.env.FRONTEND_URL && process.env.FRONTEND_URL !== process.env.CORS_ORIGIN) {
        allowedOrigins.push(process.env.FRONTEND_URL);
      }
      // Support multiple origins if comma-separated
      if (process.env.CORS_ORIGIN && process.env.CORS_ORIGIN.includes(',')) {
        allowedOrigins.push(...process.env.CORS_ORIGIN.split(',').map(url => url.trim()));
      }
    } else {
      // Development: Allow localhost origins
      allowedOrigins.push(
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174'
      );
    }

    // Check if origin is allowed
    if (allowedOrigins.length > 0 && allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // In development, be more permissive
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    // Log CORS rejection for debugging
    console.warn(`CORS blocked origin: ${origin}. Allowed origins: ${allowedOrigins.join(', ')}`);
    const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
    return callback(new Error(msg), false);
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  preflightContinue: false,
};

module.exports = cors(corsOptions);
