const db = require('../config/db');

async function addSampleData() {
  try {
    console.log('Adding sample notifications and messages...');
    
    // Add sample notifications for admin (user_id = 2)
    await db.query(`
      INSERT INTO notifications (user_id, message, is_read) VALUES 
      (2, 'Welcome! Welcome to the Hospital Management System.', 0),
      (2, 'New appointment request received', 0),
      (2, 'System maintenance will be performed this weekend', 1),
      (2, 'New doctor registration created', 0),
      (2, 'Patient records updated', 1)
    `);
    
    console.log('✅ Sample notifications added successfully');
    
    // Add sample messages for admin (user_id = 2)
    await db.query(`
      INSERT INTO messages (sender_id, recipient_id, subject, content, is_read) VALUES 
      (NULL, 2, 'Welcome Message', 'Welcome to the Hospital Management System! Please contact us if you have any questions.', 0),
      (NULL, 2, 'System Update', 'There will be a scheduled system maintenance this weekend. Please complete your important tasks in advance.', 0),
      (NULL, 2, 'New Features', 'New features have been added to our system. Notifications and messages are now displayed in real-time.', 1),
      (1, 2, 'Help Request', 'Hello admin, how can I update a patient record?', 0),
      (1, 2, 'Thank You Message', 'Thank you for your help!', 1)
    `);
    
    console.log('✅ Sample messages added successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('Error adding sample data:', error);
    process.exit(1);
  }
}

// Run the function
addSampleData(); 