const db = require('../config/db');

async function modifyAppointmentsDoctorId() {
  try {
    console.log('Connected to MySQL server');

    // Modify doctor_id to allow NULL values
    await db.query(`
      ALTER TABLE appointments 
      MODIFY COLUMN doctor_id INT NULL
    `);
    console.log('Modified doctor_id column to allow NULL values');

    console.log('Successfully updated appointments table');
  } catch (error) {
    console.error('Error updating appointments table:', error);
  } finally {
    // Close the connection
    db.end();
    console.log('Database connection closed');
  }
}

// Execute the function
modifyAppointmentsDoctorId(); 