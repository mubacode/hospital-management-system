const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const db = require('../config/db');
const logger = require('../config/logger');

async function createAuditLogTable() {
  try {
    logger.info('Creating audit_logs table...');

    await db.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id VARCHAR(50),
        details JSON,
        ip_address VARCHAR(45),
        status VARCHAR(20) DEFAULT 'success',
        request_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_audit_user (user_id),
        INDEX idx_audit_action (action),
        INDEX idx_audit_entity (entity_type, entity_id),
        INDEX idx_audit_created (created_at)
      )
    `);

    logger.info('Successfully created audit_logs table!');
  } catch (err) {
    logger.error('Error creating audit_logs table', { error: err.message, stack: err.stack });
  } finally {
    process.exit(0);
  }
}

createAuditLogTable();
