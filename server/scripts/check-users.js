const db = require('../config/db');

async function checkUsers() {
  try {
    // Get all users
    const [users] = await db.query(
      'SELECT id, username, email, role, created_at FROM users'
    );
    
    console.log('All users in the database:');
    console.log('-------------------------');
    
    users.forEach(user => {
      console.log(`ID: ${user.id}`);
      console.log(`Username: ${user.username}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      console.log(`Created: ${user.created_at}`);
      console.log('-------------------------');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking users:', error);
    process.exit(1);
  }
}

// Run the function
checkUsers(); 