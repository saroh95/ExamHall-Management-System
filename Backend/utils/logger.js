const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logToFile = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...meta,
  };

  const logFile = path.join(logsDir, `${level}.log`);
  const logString = `${JSON.stringify(logEntry)}\n`;

  fs.appendFileSync(logFile, logString);
};

const logger = {
  info: (message, meta = {}) => {
    console.log(`[INFO] ${message}`, meta);
    logToFile('info', message, meta);
  },

  error: (message, meta = {}) => {
    console.error(`[ERROR] ${message}`, meta);
    logToFile('error', message, meta);
  },

  warn: (message, meta = {}) => {
    console.warn(`[WARN] ${message}`, meta);
    logToFile('warn', message, meta);
  },

  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, meta);
      logToFile('debug', message, meta);
    }
  },
};

module.exports = logger;
