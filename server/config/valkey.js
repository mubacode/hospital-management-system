const Valkey = require('ioredis');
const logger = require('./logger');

// Only attempt to connect if VALKEY_URL is provided
const valkeyUrl = process.env.VALKEY_URL;

let valkeyClient = null;

if (valkeyUrl) {
  valkeyClient = new Valkey(valkeyUrl, {
    maxRetriesPerRequest: null, // BullMQ requires this to be null
    enableReadyCheck: false,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    }
  });

  valkeyClient.on('connect', () => {
    logger.info('Connected to Valkey');
  });

  valkeyClient.on('error', (err) => {
    logger.error('Valkey connection error', { error: err.message });
  });
} else {
  logger.warn('VALKEY_URL not provided. Valkey connection disabled.');
}

module.exports = valkeyClient;
