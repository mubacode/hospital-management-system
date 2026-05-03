import { chatbotService } from './api';
import { getSocket } from './socketService';

/**
 * AI Service for Chatbot
 * 
 * Uses WebSocket for real-time response delivery with polling as fallback.
 * DB remains the source of truth — even if socket delivery fails,
 * the client can always fetch via the polling API.
 */
export const processChatMessage = async (session, message, label = null) => {
  try {
    const payload = label !== null ? label : message;
    const response = await chatbotService.sendMessage(payload, null);

    // The backend returns { jobId } for async processing
    const { jobId } = response.data;

    if (!jobId) {
      throw new Error('Failed to start chat job');
    }

    // Attempt WebSocket-first delivery
    const socket = getSocket();
    if (socket && socket.connected) {
      return await waitForSocketResponse(socket, jobId);
    }

    // Fallback: polling
    return await pollForResult(jobId);
  } catch (error) {
    console.error('AI Service Error:', error);
    return {
      text: error.message || 'A technical error occurred connecting to the assistant. Please try again later.'
    };
  }
};

/**
 * Wait for the chatbot response via WebSocket.
 * Falls back to polling if socket doesn't deliver within timeout.
 */
function waitForSocketResponse(socket, jobId) {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      // Socket didn't deliver in time — fall back to polling
      socket.off('chatbot_response', handler);
      console.warn('[AI] Socket timeout, falling back to polling');
      pollForResult(jobId).then(resolve);
    }, 30000); // 30 second timeout

    const handler = (event) => {
      if (event.data && event.data.jobId === jobId) {
        clearTimeout(timeout);
        socket.off('chatbot_response', handler);
        resolve({ text: event.data.text });
      }
    };

    socket.on('chatbot_response', handler);
  });
}

/**
 * Fallback polling mechanism.
 * Polls every 1s, up to 30 attempts.
 */
async function pollForResult(jobId) {
  let attempts = 0;
  const maxAttempts = 30;

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      const resultResponse = await chatbotService.getResult(jobId);
      const { status, text, error } = resultResponse.data;

      if (status === 'completed') {
        return { text };
      }

      if (status === 'failed') {
        throw new Error(error || 'AI processing failed');
      }
    } catch (err) {
      // If it's a network error, keep trying
      if (!err.response) {
        console.warn('[AI] Polling network error, retrying...');
      } else {
        throw err;
      }
    }

    attempts++;
  }

  throw new Error('Response timed out');
}
