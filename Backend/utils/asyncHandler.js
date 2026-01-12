const ResponseHandler = require('./responseHandler');
const logger = require('./logger');

const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      logger.error('Async handler error:', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        user: req.user?.id,
      });

      next(error);
    });
  };
};

module.exports = asyncHandler;
