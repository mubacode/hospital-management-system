const bcrypt = require('bcrypt');
const db = require('../config/db');
const dotenv = require('dotenv');

dotenv.config();

async function checkAdminUser() {
  try {
    // Check if admin exists
    const [users] = await db.query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      ['admin', 'admin@hospital.com']
    );
    
    if (users.length === 0) {
      console.log('Admin user does not exist!');
      
      // Create admin user
      console.log('Creating admin user...');
      
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      // Insert admin user
      const [result] = await db.query(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        ['admin', 'admin@hospital.com', hashedPassword, 'admin']
      );
      
      console.log(`Admin user created with ID: ${result.insertId}`);
    } else {
      const user = users[0];
      console.log('Admin user exists with ID:', user.id);
      console.log('Username:', user.username);
      console.log('Email:', user.email);
      console.log('Role:', user.role);
      
      // Test if the password 'admin123' is correct
      const isPasswordValid = await bcrypt.compare('admin123', user.password);
      console.log('Is password "admin123" valid?', isPasswordValid);
      
      if (!isPasswordValid) {
        console.log('Updating admin password to "admin123"...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);
        
        await db.query(
          'UPDATE users SET password = ? WHERE id = ?',
          [hashedPassword, user.id]
        );
        
        console.log('Admin password updated successfully');
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking admin user:', error);
    process.exit(1);
  }
}

// Run the function
checkAdminUser(); 