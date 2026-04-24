const db = require('../config/db');
const dotenv = require('dotenv');

dotenv.config();

async function createReceptionistTable() {
  try {
    // Create receptionists table if it doesn't exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS receptionists (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    console.log('Receptionists table created or already exists');

    // Check for existing receptionist users that need entries in the receptionists table
    const [receptionistUsers] = await db.query(
      'SELECT id, username, email FROM users WHERE role = "receptionist"'
    );
    
    console.log(`Found ${receptionistUsers.length} receptionist users`);
    
    // For each receptionist user, check if they have a record in the receptionists table
    for (const user of receptionistUsers) {
      const [existingReceptionists] = await db.query(
        'SELECT * FROM receptionists WHERE user_id = ?',
        [user.id]
      );
      
      if (existingReceptionists.length === 0) {
        console.log(`Creating receptionist record for ${user.username} (${user.email})`);
        
        // Extract name parts from username if available
        let firstName = '';
        let lastName = '';
        
        if (user.username && user.username.includes(' ')) {
          const nameParts = user.username.split(' ');
          firstName = nameParts[0] || '';
          lastName = nameParts.slice(1).join(' ') || '';
        } else {
          firstName = user.username || '';
          lastName = '';
        }
        
        // Create receptionist record
        await db.query(
          'INSERT INTO receptionists (user_id, first_name, last_name, phone) VALUES (?, ?, ?, ?)',
          [user.id, firstName, lastName, '']
        );
        
        console.log(`Receptionist record created for user ${user.id}`);
      } else {
        console.log(`Receptionist record already exists for ${user.username} (${user.email})`);
      }
    }
    
    console.log('Process completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error creating receptionist table:', error);
    process.exit(1);
  }
}

// Run the function
createReceptionistTable(); 