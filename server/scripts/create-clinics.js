const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const db = require('../config/db');

dotenv.config();

async function createClinicsTable() {
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

    // Create clinics table if it doesn't exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS clinics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Clinics table created or already exists');

    // Check if there are existing clinics
    const [existingClinics] = await db.query('SELECT * FROM clinics');
    
    if (existingClinics.length === 0) {
      // Insert sample clinics
      const clinics = [
        { name: 'Cardiology', description: 'Heart and cardiovascular system' },
        { name: 'Dermatology', description: 'Skin, hair, and nails' },
        { name: 'Orthopedics', description: 'Bones, joints, ligaments, tendons, and muscles' },
        { name: 'Neurology', description: 'Brain, spinal cord, and nerves' },
        { name: 'Pediatrics', description: 'Medical care for infants, children, and adolescents' },
        { name: 'Obstetrics & Gynecology', description: 'Women\'s health' },
        { name: 'Ophthalmology', description: 'Eye and vision care' },
        { name: 'ENT', description: 'Ear, nose, and throat disorders' }
      ];

      for (const clinic of clinics) {
        await db.query('INSERT INTO clinics (name, description) VALUES (?, ?)', 
          [clinic.name, clinic.description]);
        console.log(`Added clinic: ${clinic.name}`);
      }
    } else {
      console.log(`${existingClinics.length} clinics already exist in the database`);
    }

    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    // Close the connection
    db.end();
    console.log('Database connection closed');
  }
}

// Execute the setup
createClinicsTable(); 