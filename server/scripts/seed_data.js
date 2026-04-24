const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'hospital_management'
};

async function seed() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database.');

    const salt = await bcrypt.genSalt(10);
    const users = [
      { username: 'admin', email: 'admin@careplus.com', password: 'admin123', role: 'admin', first: 'System', last: 'Admin' },
      { username: 'doctor', email: 'doctor@careplus.com', password: 'doctor123', role: 'doctor', first: 'John', last: 'Doe', spec: 'Cardiology' },
      { username: 'patient', email: 'patient@careplus.com', password: 'patient123', role: 'patient', first: 'Jane', last: 'Smith' },
      { username: 'reception', email: 'reception@careplus.com', password: 'reception123', role: 'receptionist', first: 'Alice', last: 'Reception' }
    ];

    for (const u of users) {
      console.log(`Seeding user: ${u.username}...`);
      
      // Check if user exists
      const [existing] = await connection.execute('SELECT id FROM users WHERE username = ?', [u.username]);
      if (existing.length > 0) {
        console.log(`User ${u.username} already exists. Skipping.`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(u.password, salt);
      
      // Insert User
      const [userResult] = await connection.execute(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        [u.username, u.email, hashedPassword, u.role]
      );
      
      const userId = userResult.insertId;

      // Insert Role-specific data
      if (u.role === 'doctor') {
        await connection.execute(
          'INSERT INTO doctors (user_id, first_name, last_name, specialization, qualification, phone) VALUES (?, ?, ?, ?, ?, ?)',
          [userId, u.first, u.last, u.spec || 'General', 'MD', '555-0101']
        );
      } else if (u.role === 'patient') {
        await connection.execute(
          'INSERT INTO patients (user_id, first_name, last_name, phone) VALUES (?, ?, ?, ?)',
          [userId, u.first, u.last, '555-0102']
        );
      } else if (u.role === 'receptionist') {
        await connection.execute(
          'INSERT INTO receptionists (user_id, first_name, last_name, phone) VALUES (?, ?, ?, ?)',
          [userId, u.first, u.last, '555-0103']
        );
      }
      
      console.log(`Successfully seeded ${u.username}`);
    }

    console.log('Seeding completed successfully.');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    if (connection) await connection.end();
  }
}

seed();
