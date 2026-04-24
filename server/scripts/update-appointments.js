const db = require('../config/db');

async function updateAppointments() {
  try {
    console.log('Connected to MySQL server');

    // Check if doctor_id allows NULL values
    const [doctorIdColumn] = await db.query(`
      SELECT IS_NULLABLE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'appointments' 
      AND COLUMN_NAME = 'doctor_id'
    `);

    // Modify doctor_id to allow NULL values
    if (doctorIdColumn.length > 0 && doctorIdColumn[0].IS_NULLABLE === 'NO') {
      await db.query(`
        ALTER TABLE appointments 
        MODIFY COLUMN doctor_id INT NULL
      `);
      console.log('Modified doctor_id column to allow NULL values');
    }

    // Check if clinic_id column exists in appointments table
    const [columns] = await db.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'appointments' 
      AND COLUMN_NAME = 'clinic_id'
    `);

    // Add clinic_id column if it doesn't exist
    if (columns.length === 0) {
      await db.query(`ALTER TABLE appointments ADD COLUMN clinic_id INT`);
      console.log('Added clinic_id column to appointments table');

      // Add foreign key constraint
      try {
        await db.query(`
          ALTER TABLE appointments 
          ADD CONSTRAINT fk_appointment_clinic 
          FOREIGN KEY (clinic_id) REFERENCES clinics(id)
        `);
        console.log('Added foreign key constraint to clinic_id');
      } catch (fkError) {
        console.warn('Warning: Could not add foreign key constraint:', fkError.message);
      }
    } else {
      console.log('clinic_id column already exists in appointments table');
    }

    // Add notes column if it doesn't exist
    const [notesColumn] = await db.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'appointments' 
      AND COLUMN_NAME = 'notes'
    `);

    if (notesColumn.length === 0) {
      await db.query(`ALTER TABLE appointments ADD COLUMN notes TEXT`);
      console.log('Added notes column to appointments table');
    }

    // Update existing appointments with clinic_id based on doctor's clinic
    const [appointments] = await db.query(`
      SELECT a.id, a.doctor_id, d.clinic_id
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      WHERE a.clinic_id IS NULL
    `);

    for (const appointment of appointments) {
      if (appointment.clinic_id) {
        await db.query(
          'UPDATE appointments SET clinic_id = ? WHERE id = ?',
          [appointment.clinic_id, appointment.id]
        );
        console.log(`Updated appointment ${appointment.id} with clinic_id ${appointment.clinic_id}`);
      }
    }

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
updateAppointments(); 