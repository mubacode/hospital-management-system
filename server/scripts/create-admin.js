const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

async function createAdminUser() {
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

    // Check if admin exists
    const [users] = await connection.query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      ['admin', 'admin@hospital.com']
    );
    
    if (users.length > 0) {
      console.log('Admin user already exists!');
      const user = users[0];
      console.log('Username:', user.username);
      console.log('Email:', user.email);
      console.log('Role:', user.role);
      
      // Update admin password to be sure
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      await connection.query(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, user.id]
      );
      
      console.log('Admin password updated to "admin123"');
    } else {
      // Create admin user
      console.log('Creating new admin user...');
      
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      // Insert admin user
      const [result] = await connection.query(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        ['admin', 'admin@hospital.com', hashedPassword, 'admin']
      );
      
      console.log(`Admin user created with ID: ${result.insertId}`);
      console.log('Username: admin');
      console.log('Email: admin@hospital.com');
      console.log('Password: admin123');
      console.log('Role: admin');
    }

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
    process.exit(0);
  }
}

// Run the function
createAdminUser(); 