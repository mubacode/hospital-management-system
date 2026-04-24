const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Doctor username and new password to set
const doctorUsername = process.argv[2];
const newPassword = process.argv[3];

if (!doctorUsername || !newPassword) {
  console.error('Please provide both username and new password as arguments:');
  console.error('node change-doctor-password.js <username> <new_password>');
  process.exit(1);
}

async function changeDoctorPassword() {
  let connection;

  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'asdas',
      database: process.env.DB_NAME || 'hospital_management'
    });

    console.log('Connected to MySQL server');
    
    // Find the doctor user by username
    const [users] = await connection.query(
      'SELECT u.* FROM users u WHERE u.username = ? AND u.role = "doctor"',
      [doctorUsername]
    );
    
    if (users.length === 0) {
      console.error(`No doctor found with username: ${doctorUsername}`);
      process.exit(1);
    }
    
    const user = users[0];
    console.log(`Found doctor with ID: ${user.id}`);
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update the password
    await connection.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, user.id]
    );
    
    console.log(`Password updated successfully for doctor: ${doctorUsername}`);
    console.log('New password:', newPassword);
    
    // Get doctor details
    const [doctors] = await connection.query(
      'SELECT d.* FROM doctors d WHERE d.user_id = ?',
      [user.id]
    );
    
    if (doctors.length > 0) {
      const doctor = doctors[0];
      console.log('Doctor name:', `${doctor.first_name} ${doctor.last_name}`);
      console.log('Specialization:', doctor.specialization);
    }
    
  } catch (error) {
    console.error('Error changing doctor password:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
    process.exit(0);
  }
}

// Run the function
changeDoctorPassword(); 