const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

// Define log formats
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, stack, requestId, userId, event, ...meta }) => {
    let output = `[${timestamp}] ${level}: ${message}`;
    if (event) output += ` [event:${event}]`;
    if (requestId) output += ` [req:${requestId}]`;
    if (userId) output += ` [user:${userId}]`;
    if (Object.keys(meta).length) output += `\n${JSON.stringify(meta, null, 2)}`;
    if (stack) output += `\n${stack}`;
    return output;
  })
);

const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Define transports
const transports = [];

if (isTest) {
  // Minimal logging for tests
  transports.push(new winston.transports.Console({ silent: true }));
} else {
  // Console logging (colored in dev, basic in prod)
  transports.push(new winston.transports.Console({
    level: isProduction ? 'info' : 'debug',
    format: isProduction ? fileFormat : consoleFormat
  }));

  // File logging (daily rotation)
  transports.push(
    new DailyRotateFile({
      level: 'error',
      dirname: logDir,
      filename: 'error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: fileFormat
    })
  );

  transports.push(
    new DailyRotateFile({
      dirname: logDir,
      filename: 'combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: fileFormat
    })
  );
}

const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  transports,
  exitOnError: false
});

// Stream for morgan
logger.stream = {
  write: (message) => {
    try {
      const data = JSON.parse(message.trim());
      const msg = `${data.method} ${data.url} ${data.status} - ${data.response_time}ms`;
      logger.info(msg, { event: 'http_request', ...data });
    } catch (e) {
      logger.info(message.trim());
    }
  }
};

module.exports = logger;
