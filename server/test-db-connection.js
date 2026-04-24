const db = require('./config/db');

async function testConnection() {
  try {
    // Attempt to connect
    console.log('Attempting to connect to MySQL database...');
    
    // Simple query to test connection
    const [result] = await db.query('SELECT 1 + 1 AS solution');
    
    console.log('Database connection successful!');
    console.log('Test query result:', result[0].solution);
    
    // Close the connection
    console.log('Closing connection...');
    await db.end();
    
    console.log('Connection closed successfully.');
  } catch (error) {
    console.error('Error connecting to the database:');
    console.error(error);
  }
}

testConnection(); 