const db = require('../config/db');

// Get all doctors
exports.getAllDoctors = async (req, res) => {
  try {
    const [doctors] = await db.query(`
      SELECT d.id, d.first_name, d.last_name, d.specialization, d.qualification, d.phone, 
             u.id as user_id, u.email, u.created_at
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      WHERE u.role = 'doctor'
    `);

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
      // Fixed rating for all doctors (4.5-5.0)
      rating: (4.5 + (doctor.id % 6) * 0.1).toFixed(1)
    }));

    res.json(formattedDoctors);
  } catch (error) {
    console.error('Error getting all doctors:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get doctor by ID
exports.getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;

    const [doctors] = await db.query(`
      SELECT d.id, d.first_name, d.last_name, d.specialization, d.qualification, d.phone, 
             u.id as user_id, u.email, u.created_at
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      WHERE d.id = ? AND u.role = 'doctor'
    `, [id]);

    if (doctors.length === 0) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const doctor = doctors[0];

    // Format the response
    const formattedDoctor = {
      id: doctor.id,
      user_id: doctor.user_id,
      name: `Dr. ${doctor.first_name} ${doctor.last_name}`,
      first_name: doctor.first_name,
      last_name: doctor.last_name,
      specialization: doctor.specialization || 'General Medicine',
      qualification: doctor.qualification || 'MD',
      phone: doctor.phone,
      email: doctor.email,
      // Fixed rating based on doctor ID to ensure consistency
      rating: (4.5 + (doctor.id % 6) * 0.1).toFixed(1)
    };

    res.json(formattedDoctor);
  } catch (error) {
    console.error('Error getting doctor by ID:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get doctors by clinic ID
exports.getDoctorsByClinic = async (req, res) => {
  try {
    const { clinicId } = req.params;

    const [doctors] = await db.query(`
      SELECT d.id, d.first_name, d.last_name, d.specialization, d.qualification, d.phone, 
             u.id as user_id, u.email, u.created_at
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      WHERE d.clinic_id = ? AND u.role = 'doctor'
    `, [clinicId]);

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
      rating: (4.5 + (doctor.id % 6) * 0.1).toFixed(1)
    }));

    res.json(formattedDoctors);
  } catch (error) {
    console.error('Error getting doctors by clinic:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get doctor availability
exports.getDoctorAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    // Check if doctor exists
    const [doctors] = await db.query('SELECT * FROM doctors WHERE id = ?', [id]);
    
    if (doctors.length === 0) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // TODO: In a production system, fetch real availability from a doctor_schedule table
    // For now, use fixed availability slots for all doctors
    const availableTimes = [];
    const startHour = 9; // 9 AM
    const endHour = 17; // 5 PM
    const interval = 30; // 30 minute intervals
    
    // Generate fixed availability slots every 30 minutes
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += interval) {
        // Skip lunch hour (12-1 PM)
        if (hour !== 12) {
          const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
          const amPm = hour < 12 ? 'AM' : 'PM';
          // Store time in user-friendly format: "11:30 AM"
          const displayTime = `${formattedHour}:${minute === 0 ? '00' : minute} ${amPm}`;
          
          // Check for existing appointments at this time
          try {
            const [existingAppointments] = await db.query(`
              SELECT * FROM appointments 
              WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? AND status != 'cancelled'
            `, [id, date, `${hour.toString().padStart(2, '0')}:${minute === 0 ? '00' : minute}:00`]);
            
            // Only add if no existing appointment at this time
            if (existingAppointments.length === 0) {
              availableTimes.push(displayTime);
            }
          } catch (err) {
            console.error('Error checking existing appointments:', err);
            // Add time slot anyway if there's an error checking
            availableTimes.push(displayTime);
          }
        }
      }
    }

    res.json({ 
      doctorId: id,
      date: date,
      availableTimes: availableTimes
    });
  } catch (error) {
    console.error('Error getting doctor availability:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 