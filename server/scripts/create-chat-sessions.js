const path = require('path');
const dotenv = require('dotenv');

// Load environment variables with explicit path before anything else
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const db = require('../config/db');
const logger = require('../config/logger');

async function createChatSessionsTable() {
  try {
    logger.info('Creating chat_sessions table if it does not exist...');
    
    // We don't want a foreign key constraint to users table if anonymous users can chat.
    // However, the system uses user_id as an integer from req.user.id. 
    // Wait, in chatbotController, anonymous users use string 'anonymous'. 
    // We should make the user_id column a VARCHAR(50) so it can store 'anonymous' or the user ID string.
    
    await db.query(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        user_id VARCHAR(50) PRIMARY KEY,
        history JSON NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    logger.info('Successfully created chat_sessions table!');
  } catch (err) {
    logger.error('Error creating chat_sessions table', { error: err.message, stack: err.stack });
  } finally {
    process.exit(0);
  }
}

createChatSessionsTable();
