const { Queue, QueueEvents } = require('bullmq');
const valkeyClient = require('../config/valkey');
const logger = require('../config/logger');

let chatbotQueue = null;
let emailQueue = null;

if (valkeyClient) {
  const queueOptions = {
    connection: valkeyClient,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000
      },
      removeOnComplete: {
        age: 3600, // Keep completed jobs for 1 hour
        count: 1000 // Or keep the last 1000 completed jobs
      },
      removeOnFail: {
        age: 24 * 3600 // Keep failed jobs for 24 hours for debugging
      }
    }
  };

  chatbotQueue = new Queue('chatbot-queue', queueOptions);
  emailQueue = new Queue('email-queue', queueOptions);

  // Set up queue events for logging
  const chatbotEvents = new QueueEvents('chatbot-queue', { connection: valkeyClient });
  const emailEvents = new QueueEvents('email-queue', { connection: valkeyClient });

  chatbotEvents.on('completed', ({ jobId }) => {
    logger.info('Chatbot job completed', { event: 'job_completed', jobId, queue: 'chatbot-queue' });
  });

  chatbotEvents.on('failed', ({ jobId, failedReason }) => {
    logger.error('Chatbot job failed', { event: 'job_failed', jobId, queue: 'chatbot-queue', error: failedReason });
  });

  emailEvents.on('completed', ({ jobId }) => {
    logger.info('Email job completed', { event: 'job_completed', jobId, queue: 'email-queue' });
  });

  emailEvents.on('failed', ({ jobId, failedReason }) => {
    logger.error('Email job failed', { event: 'job_failed', jobId, queue: 'email-queue', error: failedReason });
  });

} else {
  logger.warn('Redis is not connected, BullMQ queues will not be initialized.');
}

module.exports = {
  chatbotQueue,
  emailQueue
};
