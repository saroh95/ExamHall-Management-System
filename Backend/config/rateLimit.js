const rateLimit = require('express-rate-limit');

const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 100) => {
  return rateLimit({
    windowMs, // 15 minutes by default
    max, // limit each IP to 100 requests per windowMs by default
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Different rate limiters for different endpoints
const authLimiter = createRateLimiter(15 * 60 * 1000, 5); // 5 requests per 15 minutes for auth
const apiLimiter = createRateLimiter(15 * 60 * 1000, 1000); // 1000 requests per 15 minutes for general API (dev mode)
const uploadLimiter = createRateLimiter(60 * 60 * 1000, 10); // 10 uploads per hour

module.exports = {
  authLimiter,
  apiLimiter,
  uploadLimiter,
  createRateLimiter,
};
