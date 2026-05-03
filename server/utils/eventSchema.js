/**
 * Standardized Event Schema
 * 
 * Ensures consistent event format across:
 * - Socket.io events
 * - Worker logs
 * - API responses
 */

/**
 * Build a standardized event payload.
 * @param {string} event - Event name (e.g., 'chatbot_response', 'email_sent')
 * @param {string|number} userId - Target user ID
 * @param {object} data - Event-specific data
 * @param {string} [requestId] - Original request ID for traceability
 * @returns {object} Standardized event object
 */
function buildEvent(event, userId, data = {}, requestId = null) {
  return {
    event,
    userId: String(userId),
    data,
    requestId: requestId || null,
    timestamp: new Date().toISOString()
  };
}

/**
 * Standard socket event names — single source of truth.
 */
const EVENTS = {
  CHATBOT_RESPONSE: 'chatbot_response',
  CHATBOT_ERROR: 'chatbot_error',
  EMAIL_SENT: 'email_sent',
  EMAIL_FAILED: 'email_failed',
  APPOINTMENT_UPDATE: 'appointment_update'
};

module.exports = { buildEvent, EVENTS };
