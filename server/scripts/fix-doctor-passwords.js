const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

async function fixDoctorPasswords() {
  let connection;

  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('Connected to MySQL server');
    
    // Get all doctor users
    const [doctorUsers] = await connection.query(
      'SELECT u.* FROM users u JOIN doctors d ON u.id = d.user_id WHERE u.role = "doctor"'
    );
    
    console.log(`Found ${doctorUsers.length} doctor users to update`);
    
    // Update each doctor's password
    for (const user of doctorUsers) {
      // Hash the password "doctor123"
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('doctor123', salt);
      
      // Update the password in the database
      await connection.query(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, user.id]
      );
      
      console.log(`Updated password for doctor: ${user.username} (ID: ${user.id})`);
    }

    console.log('Doctor password update completed');

  } catch (error) {
    console.error('Error updating doctor passwords:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
    process.exit(0);
  }
}

// Run the function
fixDoctorPasswords(); 