const db = require('../config/db');

async function updateNotificationsTable() {
  try {
    console.log('Connected to MySQL server');

    // Check if type column exists in notifications table
    const [typeColumn] = await db.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'notifications' 
      AND COLUMN_NAME = 'type'
    `);

    // Add type column if it doesn't exist
    if (typeColumn.length === 0) {
      await db.query(`
        ALTER TABLE notifications 
        ADD COLUMN type VARCHAR(50) NOT NULL DEFAULT 'general'
      `);
      console.log('Added type column to notifications table');
    } else {
      console.log('type column already exists in notifications table');
    }

    // Check if related_id column exists in notifications table
    const [relatedIdColumn] = await db.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'notifications' 
      AND COLUMN_NAME = 'related_id'
    `);

    // Add related_id column if it doesn't exist
    if (relatedIdColumn.length === 0) {
      await db.query(`
        ALTER TABLE notifications 
        ADD COLUMN related_id INT NULL
      `);
      console.log('Added related_id column to notifications table');
    } else {
      console.log('related_id column already exists in notifications table');
    }

    // Also check if user_id allows NULL values
    const [userIdColumn] = await db.query(`
      SELECT IS_NULLABLE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'notifications' 
      AND COLUMN_NAME = 'user_id'
    `);

    // Modify user_id to allow NULL values
    if (userIdColumn.length > 0 && userIdColumn[0].IS_NULLABLE === 'NO') {
      await db.query(`
        ALTER TABLE notifications 
        MODIFY COLUMN user_id INT NULL
      `);
      console.log('Modified user_id column to allow NULL values');
    }

    console.log('Successfully updated notifications table');
  } catch (error) {
    console.error('Error updating notifications table:', error);
  } finally {
    // Close the connection
    db.end();
    console.log('Database connection closed');
  }
}

// Execute the function
updateNotificationsTable(); 