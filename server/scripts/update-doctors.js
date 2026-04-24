const db = require('../config/db');

async function updateDoctors() {
  try {
    console.log('Connected to MySQL server');

    // Check if clinic_id column exists in doctors table
    const [columns] = await db.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'doctors' 
      AND COLUMN_NAME = 'clinic_id'
    `);

    // Add clinic_id column if it doesn't exist
    if (columns.length === 0) {
      await db.query(`ALTER TABLE doctors ADD COLUMN clinic_id INT`);
      console.log('Added clinic_id column to doctors table');

      // Add foreign key constraint
      try {
        await db.query(`
          ALTER TABLE doctors 
          ADD CONSTRAINT fk_doctor_clinic 
          FOREIGN KEY (clinic_id) REFERENCES clinics(id)
        `);
        console.log('Added foreign key constraint to clinic_id');
      } catch (fkError) {
        console.warn('Warning: Could not add foreign key constraint:', fkError.message);
      }
    } else {
      console.log('clinic_id column already exists in doctors table');
    }

    // Get all clinics
    const [clinics] = await db.query('SELECT id, name FROM clinics');
    if (clinics.length === 0) {
      console.log('No clinics found. Please run create-clinics.js first.');
      return;
    }

    // Get all doctors
    const [doctors] = await db.query('SELECT id, first_name, last_name, specialization FROM doctors');
    
    // Assign clinics to doctors based on their specialization
    for (const doctor of doctors) {
      let clinicId = null;
      
      // Match specialization to clinic (simplified mapping)
      const specialization = doctor.specialization ? doctor.specialization.toLowerCase() : '';
      
      if (specialization.includes('cardio')) {
        clinicId = clinics.find(c => c.name === 'Cardiology')?.id;
      } else if (specialization.includes('dermat')) {
        clinicId = clinics.find(c => c.name === 'Dermatology')?.id;
      } else if (specialization.includes('ortho')) {
        clinicId = clinics.find(c => c.name === 'Orthopedics')?.id;
      } else if (specialization.includes('neuro')) {
        clinicId = clinics.find(c => c.name === 'Neurology')?.id;
      } else if (specialization.includes('pediatr')) {
        clinicId = clinics.find(c => c.name === 'Pediatrics')?.id;
      } else if (specialization.includes('gyne') || specialization.includes('obstet')) {
        clinicId = clinics.find(c => c.name === 'Obstetrics & Gynecology')?.id;
      } else if (specialization.includes('ophthalm') || specialization.includes('eye')) {
        clinicId = clinics.find(c => c.name === 'Ophthalmology')?.id;
      } else if (specialization.includes('ent') || specialization.includes('ear') || specialization.includes('nose') || specialization.includes('throat')) {
        clinicId = clinics.find(c => c.name === 'ENT')?.id;
      } else {
        // Assign to random clinic if no match
        clinicId = clinics[Math.floor(Math.random() * clinics.length)].id;
      }

      // Update doctor with clinic_id
      await db.query('UPDATE doctors SET clinic_id = ? WHERE id = ?', [clinicId, doctor.id]);
      
      const clinicName = clinics.find(c => c.id === clinicId)?.name;
      console.log(`Assigned Dr. ${doctor.first_name} ${doctor.last_name} to clinic: ${clinicName}`);
    }

    console.log('Successfully updated doctors with clinic assignments');
  } catch (error) {
    console.error('Error updating doctors:', error);
  } finally {
    // Close the connection
    db.end();
    console.log('Database connection closed');
  }
}

// Execute the function
updateDoctors(); 