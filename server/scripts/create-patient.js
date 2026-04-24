const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

async function createPatientUser() {
  let connection;

  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3000,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'Mub$rik9419',
      database: process.env.DB_NAME || 'hospital_management'
    });

    console.log('Connected to MySQL server');
    
    const patient = {
      username: 'patient',
      email: 'patient@example.com',
      password: 'patient123',
      role: 'patient',
      first_name: 'John',
      last_name: 'Doe',
      phone: '555-123-4567'
    };

    // Check if patient user already exists
    const [existingUsers] = await connection.query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [patient.username, patient.email]
    );
    
    if (existingUsers.length > 0) {
      console.log('Patient user already exists!');
      const user = existingUsers[0];
      console.log('Username:', user.username);
      console.log('Email:', user.email);
      console.log('Role:', user.role);
      
      // Update patient password to be sure
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(patient.password, salt);
      
      await connection.query(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, user.id]
      );
      
      console.log('Patient password updated to "patient123"');
    } else {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(patient.password, salt);

      // Start transaction
      await connection.query('START TRANSACTION');

      // Create user
      const [result] = await connection.query(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        [patient.username, patient.email, hashedPassword, patient.role]
      );
      
      const userId = result.insertId;
      
      // Create patient record
      await connection.query(
        'INSERT INTO patients (user_id, first_name, last_name, phone) VALUES (?, ?, ?, ?)',
        [userId, patient.first_name, patient.last_name, patient.phone]
      );
      
      // Commit transaction
      await connection.query('COMMIT');
      
      console.log(`Patient user created with ID: ${userId}`);
      console.log('Username:', patient.username);
      console.log('Email:', patient.email);
      console.log('Password:', patient.password);
      console.log('Role:', patient.role);
      console.log('Name:', `${patient.first_name} ${patient.last_name}`);
    }

  } catch (error) {
    // Rollback transaction on error
    if (connection) {
      await connection.query('ROLLBACK');
    }
    console.error('Error creating patient user:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
    process.exit(0);
  }
}

// Run the function
createPatientUser(); 