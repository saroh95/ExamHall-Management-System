const mongoose = require('mongoose');
let MongoMemoryServer;
try {
  // Lazy require so production installs without dev deps are unaffected
  ({ MongoMemoryServer } = require('mongodb-memory-server'));
} catch (_) {
  MongoMemoryServer = null;
}

const redactMongoUri = (uri) => {
  if (!uri || typeof uri !== 'string') return '<empty>';
  try {
    // Basic redact: hide credentials between '://' and '@'
    const credMatch = uri.match(/:\/\/(.*)@/);
    if (credMatch) {
      return uri.replace(credMatch[1], '***:***');
    }
    return uri;
  } catch (_) {
    return '<redacted>';
  }
};

const connectDB = async () => {
  try {
    console.info('[DB] Attempting connection', {
      useInMemoryDb: process.env.USE_IN_MEMORY_DB,
      nodeEnv: process.env.NODE_ENV,
      mongoUri: redactMongoUri(process.env.MONGODB_URI),
    });

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Connection pool settings (optimized for MongoDB Atlas)
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 10000, // Increased for Atlas network latency
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      // Retry settings for better Atlas reliability
      retryWrites: true,
      w: 'majority',
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('[DB] Primary connection failed', {
      name: error?.name,
      code: error?.code,
      reason: error?.reason?.message || error?.message,
    });
    // Optional fallback for local smoke tests without a running MongoDB
    const allowFallback = process.env.USE_IN_MEMORY_DB === 'true' && process.env.NODE_ENV === 'test';
    if (allowFallback && MongoMemoryServer) {
      try {
        console.warn('Database connection failed, falling back to in-memory MongoDB for smoke test...');
        const mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        const conn = await mongoose.connect(uri, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
        });
        console.log(`In-memory MongoDB Connected: ${conn.connection.host}`);
        return;
      } catch (memErr) {
        console.error('In-memory MongoDB fallback failed:', memErr);
      }
    }
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
