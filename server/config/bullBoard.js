/**
 * Bull-Board Dashboard Configuration
 * 
 * Provides a visual monitoring UI for BullMQ queues.
 * Mounted at /admin/queues with admin-only backend auth.
 */
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');
const logger = require('./logger');

/**
 * Setup Bull-Board and return the Express middleware.
 * @returns {express.Router|null} The Bull-Board router or null if queues are unavailable
 */
function setupBullBoard() {
  try {
    // Lazy-load queues to avoid circular dependency issues
    const { chatbotQueue, emailQueue } = require('../queues');

    if (!chatbotQueue && !emailQueue) {
      logger.warn('Bull-Board: No queues available to monitor');
      return null;
    }

    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/admin/queues');

    const queues = [];
    if (chatbotQueue) queues.push(new BullMQAdapter(chatbotQueue));
    if (emailQueue) queues.push(new BullMQAdapter(emailQueue));

    createBullBoard({
      queues,
      serverAdapter
    });

    logger.info('Bull-Board initialized', { 
      queues: queues.length,
      path: '/admin/queues'
    });

    return serverAdapter.getRouter();
  } catch (err) {
    logger.error('Failed to initialize Bull-Board', { error: err.message });
    return null;
  }
}

module.exports = { setupBullBoard };
