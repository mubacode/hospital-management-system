const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const db = require('../config/db');
const logger = require('../config/logger');

async function createChatMessagesTable() {
  try {
    logger.info('Creating chat_messages table...');
    
    await db.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        role ENUM('user', 'assistant') NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Add index on user_id for faster lookups since we will query by user frequently
    try {
      await db.query('CREATE INDEX idx_user_id ON chat_messages(user_id)');
    } catch (indexErr) {
      // Index might already exist, which is fine
      if (indexErr.code !== 'ER_DUP_KEYNAME') {
        logger.warn('Failed to create index on chat_messages:', indexErr.message);
      }
    }
    
    logger.info('Successfully created chat_messages table!');
  } catch (err) {
    logger.error('Error creating chat_messages table', { error: err.message, stack: err.stack });
  } finally {
    process.exit(0);
  }
}

createChatMessagesTable();
