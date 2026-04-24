const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

async function createDoctorUsers() {
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
    
    // Sample doctors data
    const doctors = [
      {
        username: 'jsmith',
        email: 'john.smith@example.com',
        password: 'doctor123',
        role: 'doctor',
        first_name: 'John',
        last_name: 'Smith',
        specialization: 'General Medicine',
        qualification: 'MD',
        phone: '555-123-4000',
        clinic_id: 1
      },
      {
        username: 'eclark',
        email: 'emily.clark@example.com',
        password: 'doctor123',
        role: 'doctor',
        first_name: 'Emily',
        last_name: 'Clark',
        specialization: 'Family Medicine',
        qualification: 'MD, PhD',
        phone: '555-123-4001',
        clinic_id: 1
      },
      {
        username: 'mwilson',
        email: 'michael.wilson@example.com',
        password: 'doctor123',
        role: 'doctor',
        first_name: 'Michael',
        last_name: 'Wilson',
        specialization: 'Cardiology',
        qualification: 'MD',
        phone: '555-123-4002',
        clinic_id: 1
      }
    ];

    // Process each doctor
    for (const doctor of doctors) {
      // Check if doctor already exists
      const [existingUsers] = await connection.query(
        'SELECT * FROM users WHERE username = ? OR email = ?',
        [doctor.username, doctor.email]
      );
      
      if (existingUsers.length > 0) {
        console.log(`Doctor ${doctor.first_name} ${doctor.last_name} already exists!`);
        continue;
      }
      
      // Start transaction
      await connection.query('START TRANSACTION');

      // Create user
      const [userResult] = await connection.query(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        [doctor.username, doctor.email, doctor.password, doctor.role]
      );
      
      const userId = userResult.insertId;
      
      // Create doctor record
      await connection.query(
        'INSERT INTO doctors (user_id, first_name, last_name, specialization, qualification, phone, clinic_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, doctor.first_name, doctor.last_name, doctor.specialization, doctor.qualification, doctor.phone, doctor.clinic_id]
      );
      
      // Commit transaction
      await connection.query('COMMIT');
      
      console.log(`Doctor ${doctor.first_name} ${doctor.last_name} created with user ID: ${userId}`);
    }

    console.log('Doctor creation completed');

  } catch (error) {
    // Rollback transaction on error
    if (connection) {
      await connection.query('ROLLBACK');
    }
    console.error('Error creating doctors:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
    process.exit(0);
  }
}

// Run the function
createDoctorUsers(); 