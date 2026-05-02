import { chatbotService } from './api';

/**
 * AI Service for Gemini LLM Chatbot
 */
/**
 * AI Service for Gemini LLM Chatbot
 * Updated to handle asynchronous background jobs with polling.
 */
export const processChatMessage = async (session, message, label = null) => {
  try {
    const payload = label !== null ? label : message;
    const response = await chatbotService.sendMessage(payload, null);
    
    // The backend now returns { jobId } for async processing
    const { jobId } = response.data;
    
    if (!jobId) {
      throw new Error('Failed to start chat job');
    }

    // Polling logic
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      
      const resultResponse = await chatbotService.getResult(jobId);
      const { status, text, error } = resultResponse.data;

      if (status === 'completed') {
        return { text };
      }

      if (status === 'failed') {
        throw new Error(error || 'AI processing failed');
      }

      attempts++;
    }

    throw new Error('Response timed out');
  } catch (error) {
    console.error('AI Service Error:', error);
    return {
      text: error.message || 'A technical error occurred connecting to the assistant. Please try again later.'
    };
  }
};
