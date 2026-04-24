const bcrypt = require('bcrypt');
const db = require('../config/db');

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, username, email, role, created_at FROM users'
    );

    // Get additional information for each user based on their role
    for (let user of users) {
      if (user.role === 'doctor') {
        const [doctors] = await db.query(
          'SELECT first_name, last_name, specialization, qualification, phone FROM doctors WHERE user_id = ?',
          [user.id]
        );
        if (doctors.length > 0) {
          Object.assign(user, doctors[0]);
        }
      } else if (user.role === 'patient') {
        const [patients] = await db.query(
          'SELECT first_name, last_name, phone FROM patients WHERE user_id = ?',
          [user.id]
        );
        if (patients.length > 0) {
          Object.assign(user, patients[0]);
        }
      }
    }

    res.json(users);
  } catch (error) {
    console.error('Error getting all users:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a specific user by ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const [users] = await db.query(
      'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];

    // Get role-specific data
    if (user.role === 'doctor') {
      const [doctors] = await db.query(
        'SELECT first_name, last_name, specialization, qualification, phone FROM doctors WHERE user_id = ?',
        [id]
      );
      if (doctors.length > 0) {
        Object.assign(user, doctors[0]);
      }
    } else if (user.role === 'patient') {
      const [patients] = await db.query(
        'SELECT first_name, last_name, phone FROM patients WHERE user_id = ?',
        [id]
      );
      if (patients.length > 0) {
        Object.assign(user, patients[0]);
      }
    }

    res.json(user);
  } catch (error) {
    console.error('Error getting user by ID:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a user
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, password, role, first_name, last_name, phone, specialization, qualification } = req.body;

    // Check if user exists
    const [existingUsers] = await db.query(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const existingUser = existingUsers[0];

    // Start a transaction
    await db.query('START TRANSACTION');

    // Update user table
    const userUpdates = [];
    const userParams = [];

    if (username) {
      userUpdates.push('username = ?');
      userParams.push(username);
    }

    if (email) {
      userUpdates.push('email = ?');
      userParams.push(email);
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      userUpdates.push('password = ?');
      userParams.push(hashedPassword);
    }

    if (role) {
      userUpdates.push('role = ?');
      userParams.push(role);
    }

    // Only update user table if there are changes
    if (userUpdates.length > 0) {
      userParams.push(id);
      await db.query(
        `UPDATE users SET ${userUpdates.join(', ')} WHERE id = ?`,
        userParams
      );
    }

    // Update role-specific tables
    if (role === 'doctor' || existingUser.role === 'doctor') {
      if (first_name || last_name || specialization || qualification || phone) {
        // Check if doctor record exists
        const [doctors] = await db.query(
          'SELECT * FROM doctors WHERE user_id = ?',
          [id]
        );

        if (doctors.length > 0) {
          // Update existing doctor record
          const doctorUpdates = [];
          const doctorParams = [];

          if (first_name) {
            doctorUpdates.push('first_name = ?');
            doctorParams.push(first_name);
          }

          if (last_name) {
            doctorUpdates.push('last_name = ?');
            doctorParams.push(last_name);
          }

          if (specialization) {
            doctorUpdates.push('specialization = ?');
            doctorParams.push(specialization);
          }

          if (qualification) {
            doctorUpdates.push('qualification = ?');
            doctorParams.push(qualification);
          }

          if (phone) {
            doctorUpdates.push('phone = ?');
            doctorParams.push(phone);
          }

          if (doctorUpdates.length > 0) {
            doctorParams.push(id);
            await db.query(
              `UPDATE doctors SET ${doctorUpdates.join(', ')} WHERE user_id = ?`,
              doctorParams
            );
          }
        } else if (role === 'doctor') {
          // Create new doctor record
          await db.query(
            'INSERT INTO doctors (user_id, first_name, last_name, specialization, qualification, phone) VALUES (?, ?, ?, ?, ?, ?)',
            [id, first_name || '', last_name || '', specialization || '', qualification || '', phone || '']
          );
        }
      }
    } else if (role === 'patient' || existingUser.role === 'patient') {
      if (first_name || last_name || phone) {
        // Check if patient record exists
        const [patients] = await db.query(
          'SELECT * FROM patients WHERE user_id = ?',
          [id]
        );

        if (patients.length > 0) {
          // Update existing patient record
          const patientUpdates = [];
          const patientParams = [];

          if (first_name) {
            patientUpdates.push('first_name = ?');
            patientParams.push(first_name);
          }

          if (last_name) {
            patientUpdates.push('last_name = ?');
            patientParams.push(last_name);
          }

          if (phone) {
            patientUpdates.push('phone = ?');
            patientParams.push(phone);
          }

          if (patientUpdates.length > 0) {
            patientParams.push(id);
            await db.query(
              `UPDATE patients SET ${patientUpdates.join(', ')} WHERE user_id = ?`,
              patientParams
            );
          }
        } else if (role === 'patient') {
          // Create new patient record
          await db.query(
            'INSERT INTO patients (user_id, first_name, last_name, phone) VALUES (?, ?, ?, ?)',
            [id, first_name || '', last_name || '', phone || '']
          );
        }
      }
    }

    // Commit transaction
    await db.query('COMMIT');

    res.json({ message: 'User updated successfully', id });
  } catch (error) {
    // Rollback on error
    await db.query('ROLLBACK');
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const [users] = await db.query(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete user (related records will be deleted via ON DELETE CASCADE)
    await db.query('DELETE FROM users WHERE id = ?', [id]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get system stats for Dashboard
exports.getStats = async (req, res) => {
  try {
    const [userCountRows] = await db.query('SELECT COUNT(*) as count FROM users');
    const [doctorCountRows] = await db.query('SELECT COUNT(*) as count FROM doctors');
    const [patientCountRows] = await db.query('SELECT COUNT(*) as count FROM patients');
    const [clinicCountRows] = await db.query('SELECT COUNT(*) as count FROM clinics');

    res.json({
      totalUsers: Number(userCountRows[0].count),
      doctorsCount: Number(doctorCountRows[0].count),
      patientsCount: Number(patientCountRows[0].count),
      clinicsCount: Number(clinicCountRows[0].count)
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Server error while loading statistics.' });
  }
};