const { chatbotQueue } = require('../queues');
const db = require('../config/db');
const logger = require('../config/logger');

exports.processMessage = async (req, res, next) => {
  try {
    const userId = req.user?.id || 'anonymous';
    const { message } = req.body;
    
    if (!message) {
      return res.error('Message is required', 400);
    }

    logger.info('Chatbot request received', {
      event: 'chatbot_request',
      userId,
      requestId: req.requestId,
      chatbot_message_length: message.length
    });

    // 1. Store the user's message immediately
    await db.query(
      'INSERT INTO chat_messages (user_id, role, content) VALUES (?, ?, ?)',
      [String(userId), 'user', message]
    );

    if (!chatbotQueue) {
      return res.error('Chatbot queue is currently unavailable. Please try again later.', 503);
    }

    // 2. Enqueue the job for the background worker
    const job = await chatbotQueue.add('process_message', {
      userId: String(userId),
      requestId: req.requestId
    });

    // 3. Return 202 Accepted
    return res.success({ jobId: job.id }, 202);

  } catch (error) {
    next(error);
  }
};

exports.getJobResult = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const userId = req.user?.id || 'anonymous';

    if (!chatbotQueue) {
      return res.error('Chatbot queue is currently unavailable.', 503);
    }

    const job = await chatbotQueue.getJob(jobId);

    if (!job) {
      return res.error('Job not found', 404);
    }

    const state = await job.getState();

    if (state === 'completed') {
      // Job is done, fetch the latest assistant response from the DB for this user
      // Note: We order by created_at DESC to get the last message.
      const [messages] = await db.query(
        'SELECT content FROM chat_messages WHERE user_id = ? AND role = "assistant" ORDER BY created_at DESC LIMIT 1',
        [String(userId)]
      );

      const finalContent = messages.length > 0 ? messages[0].content : "Sorry, I couldn't generate a response.";

      return res.success({
        status: 'completed',
        text: finalContent
      });
    }

    if (state === 'failed') {
      return res.error('The chatbot failed to process your request. Please try again.', 500);
    }

    // Still processing
    return res.success({
      status: state // 'active', 'waiting', 'delayed'
    });

  } catch (error) {
    next(error);
  }
};
