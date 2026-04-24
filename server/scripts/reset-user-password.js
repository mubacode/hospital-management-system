const bcrypt = require('bcrypt');
const db = require('../config/db');
const dotenv = require('dotenv');

dotenv.config();

// Function to reset a user's password
async function resetUserPassword(email, newPassword) {
  try {
    // Check if user exists
    const [users] = await db.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      console.log(`User with email ${email} not found.`);
      process.exit(1);
    }
    
    const user = users[0];
    console.log(`Found user: ${user.username} (${user.email}) with role: ${user.role}`);
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update the password
    await db.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, user.id]
    );
    
    console.log(`Password for ${user.username} (${user.email}) has been reset to "${newPassword}"`);
    console.log(`You can now login with:`);
    console.log(`Username: ${user.username}`);
    console.log(`Password: ${newPassword}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error resetting password:', error);
    process.exit(1);
  }
}

// Get email and new password from command line arguments
const email = process.argv[2];
const newPassword = process.argv[3] || 'password123'; // Default password if not provided

if (!email) {
  console.error('Please provide an email address.');
  console.log('Usage: node reset-user-password.js <email> [newPassword]');
  process.exit(1);
}

// Run the function
resetUserPassword(email, newPassword); 