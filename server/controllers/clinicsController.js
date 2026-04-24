const db = require('../config/db');

// Get all clinics
exports.getAllClinics = async (req, res) => {
  try {
    const [clinics] = await db.query(`
      SELECT id, name, description, status, created_at
      FROM clinics
      WHERE status = 'active'
      ORDER BY name ASC
    `);

    res.json(clinics);
  } catch (error) {
    console.error('Error getting all clinics:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get clinic by ID
exports.getClinicById = async (req, res) => {
  try {
    const { id } = req.params;

    const [clinics] = await db.query(`
      SELECT id, name, description, status, created_at
      FROM clinics
      WHERE id = ? AND status = 'active'
    `, [id]);

    if (clinics.length === 0) {
      return res.status(404).json({ message: 'Clinic not found' });
    }

    res.json(clinics[0]);
  } catch (error) {
    console.error('Error getting clinic by ID:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get doctors by clinic ID
exports.getDoctorsByClinicId = async (req, res) => {
  try {
    const { id } = req.params;

    // First check if clinic exists
    const [clinics] = await db.query(`
      SELECT id FROM clinics WHERE id = ? AND status = 'active'
    `, [id]);

    if (clinics.length === 0) {
      return res.status(404).json({ message: 'Clinic not found' });
    }

    // Get doctors in this clinic
    const [doctors] = await db.query(`
      SELECT d.id, d.first_name, d.last_name, d.specialization, d.qualification, d.phone, 
             d.clinic_id, c.name as clinic_name,
             u.id as user_id, u.email, u.created_at
      FROM doctors d
      JOIN clinics c ON d.clinic_id = c.id
      JOIN users u ON d.user_id = u.id
      WHERE d.clinic_id = ? AND u.role = 'doctor'
    `, [id]);

    // Format the response
    const formattedDoctors = doctors.map(doctor => ({
      id: doctor.id,
      user_id: doctor.user_id,
      name: `Dr. ${doctor.first_name} ${doctor.last_name}`,
      first_name: doctor.first_name,
      last_name: doctor.last_name,
      specialization: doctor.specialization || 'General Medicine',
      qualification: doctor.qualification || 'MD',
      phone: doctor.phone,
      email: doctor.email,
      clinic_id: doctor.clinic_id,
      clinic_name: doctor.clinic_name,
      // Fixed rating for all doctors (4.5-5.0)
      rating: (4.5 + (doctor.id % 6) * 0.1).toFixed(1)
    }));

    res.json(formattedDoctors);
  } catch (error) {
    console.error('Error getting doctors by clinic ID:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new clinic
exports.createClinic = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Clinic name is required' });

    const [result] = await db.query(
      'INSERT INTO clinics (name, description, status) VALUES (?, ?, ?)',
      [name, description || '', 'active']
    );

    res.status(201).json({ message: 'Department created successfully', id: result.insertId });
  } catch (error) {
    console.error('Error creating clinic:', error);
    res.status(500).json({ message: 'Server error while creating department.' });
  }
};

// Update a clinic
exports.updateClinic = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;

    const [existing] = await db.query('SELECT id FROM clinics WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ message: 'Department not found' });

    const updates = [];
    const params = [];
    
    if (name) { updates.push('name = ?'); params.push(name); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (status) { updates.push('status = ?'); params.push(status); }

    if (updates.length > 0) {
      params.push(id);
      await db.query(`UPDATE clinics SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    res.json({ message: 'Department updated successfully' });
  } catch (error) {
    console.error('Error updating clinic:', error);
    res.status(500).json({ message: 'Server error while updating department.' });
  }
};

// Delete a clinic
exports.deleteClinic = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [existing] = await db.query('SELECT id FROM clinics WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ message: 'Department not found' });

    // Saftey check: Are there doctors assigned?
    const [doctors] = await db.query('SELECT id FROM doctors WHERE clinic_id = ?', [id]);
    if (doctors.length > 0) {
      return res.status(400).json({ 
        message: `Deletion blocked: There are ${doctors.length} doctors currently assigned to this department. Please reassign them first.`
      });
    }

    // Since it's clear, perform the deletion
    await db.query('DELETE FROM clinics WHERE id = ?', [id]);
    
    res.json({ message: 'Department successfully deleted' });
  } catch (error) {
    console.error('Error deleting clinic:', error);
    res.status(500).json({ message: 'Server error while deleting department.' });
  }
};