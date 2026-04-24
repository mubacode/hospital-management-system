const db = require('../config/db');

async function updateAppointmentsStatus() {
  try {
    console.log('Connected to MySQL server');

    // Get the current definition of the status column
    const [columns] = await db.query(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'appointments' 
      AND COLUMN_NAME = 'status'
    `);

    if (columns.length === 0) {
      console.log('Status column not found in appointments table');
      return;
    }

    const currentColumnType = columns[0].COLUMN_TYPE;
    console.log('Current status column type:', currentColumnType);

    // Extract the current ENUM values
    const match = currentColumnType.match(/^enum\((.*)\)$/i);
    if (match && match[1]) {
      const currentValues = match[1].split(',').map(v => v.trim());
      let modified = false;
      
      // Add 'pending_assignment' to the ENUM values if not present
      if (!currentColumnType.includes('pending_assignment')) {
        currentValues.push("'pending_assignment'");
        modified = true;
        console.log('Adding pending_assignment to status values');
      }
      
      // Add 'pending' to the ENUM values if not present
      if (!currentColumnType.includes("'pending'")) {
        currentValues.push("'pending'");
        modified = true;
        console.log('Adding pending to status values');
      }
      
      if (modified) {
        // Create new ENUM definition
        const newEnumDef = `ENUM(${currentValues.join(',')})`;
        
        // Alter the column
        await db.query(`
          ALTER TABLE appointments 
          MODIFY COLUMN status ${newEnumDef} NOT NULL
        `);
        
        console.log('Updated status column with new values');
      } else {
        console.log('No changes needed, all required status values already exist');
      }
    } else {
      console.log('Could not parse current ENUM values');
    }

    console.log('Successfully updated appointments status column');
  } catch (error) {
    console.error('Error updating appointments status column:', error);
  } finally {
    // Close the connection
    db.end();
    console.log('Database connection closed');
  }
}

// Execute the function
updateAppointmentsStatus(); 