/**
 * Audit Logger Middleware
 * 
 * Fire-and-forget audit logging that NEVER blocks the request flow.
 * Sanitizes sensitive data before persistence.
 */
const db = require('../config/db');
const logger = require('../config/logger');

/**
 * Sensitive field names that must NEVER be stored in audit logs.
 */
const SENSITIVE_FIELDS = [
  'password', 'token', 'secret', 'authorization',
  'creditCard', 'ssn', 'medicalNotes'
];

/**
 * Sanitize details object by removing sensitive fields.
 * @param {object} details - Raw details object
 * @returns {object} Sanitized copy
 */
function sanitize(details) {
  if (!details || typeof details !== 'object') return details;

  const sanitized = { ...details };
  for (const key of Object.keys(sanitized)) {
    if (SENSITIVE_FIELDS.some(f => key.toLowerCase().includes(f.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    }
  }
  return sanitized;
}

/**
 * Log an audit event. Fire-and-forget — never blocks the request.
 * 
 * @param {object} req - Express request object
 * @param {string} action - Action name (e.g., 'LOGIN_SUCCESS', 'APPOINTMENT_CREATED')
 * @param {string} entityType - Entity type (e.g., 'user', 'appointment')
 * @param {string|number|null} entityId - ID of the affected entity
 * @param {object} details - Additional context (will be sanitized)
 * @param {string} status - 'success' or 'failure'
 */
function logAudit(req, action, entityType, entityId = null, details = {}, status = 'success') {
  // Fire-and-forget: use .catch() to prevent unhandled rejections
  const userId = req.user?.id || null;
  const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';
  const requestId = req.requestId || null;

  const sanitizedDetails = sanitize(details);

  db.query(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address, status, request_id) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      action,
      entityType,
      entityId ? String(entityId) : null,
      JSON.stringify(sanitizedDetails),
      ipAddress,
      status,
      requestId
    ]
  ).catch(err => {
    // Log the audit failure but NEVER let it propagate
    logger.error('Audit log write failed', {
      error: err.message,
      action,
      entityType,
      entityId
    });
  });
}

module.exports = { logAudit };
