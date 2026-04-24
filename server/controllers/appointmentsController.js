const db = require('../config/db');
const emailService = require('../config/email');

// Get all appointments (with filters)
exports.getAppointments = async (req, res) => {
  try {
    const { doctor_id, patient_id, date, status } = req.query;
    let query = `
      SELECT a.*, 
        d.first_name as doctor_first_name, d.last_name as doctor_last_name, d.specialization,
        p.first_name as patient_first_name, p.last_name as patient_last_name,
        c.name as clinic_name
      FROM appointments a
      LEFT JOIN doctors d ON a.doctor_id = d.id
      JOIN patients p ON a.patient_id = p.id
      JOIN clinics c ON a.clinic_id = c.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    
    if (doctor_id) {
      query += ' AND a.doctor_id = ?';
      queryParams.push(doctor_id);
    }
    
    if (patient_id) {
      query += ' AND a.patient_id = ?';
      queryParams.push(patient_id);
    }
    
    if (date) {
      query += ' AND a.appointment_date = ?';
      queryParams.push(date);
    }
    
    if (status) {
      query += ' AND a.status = ?';
      queryParams.push(status);
    }
    
    // Add filter to get appointments for the current user if no other filters are applied
    if (!doctor_id && !patient_id && req.user) {
      if (req.user.role === 'patient') {
        // Get patient ID for the current user
        const [patients] = await db.query('SELECT id FROM patients WHERE user_id = ?', [req.user.id]);
        if (patients.length > 0) {
          query += ' AND a.patient_id = ?';
          queryParams.push(patients[0].id);
        }
      } else if (req.user.role === 'doctor') {
        // Get doctor ID for the current user
        const [doctors] = await db.query('SELECT id FROM doctors WHERE user_id = ?', [req.user.id]);
        if (doctors.length > 0) {
          query += ' AND a.doctor_id = ?';
          queryParams.push(doctors[0].id);
        }
      }
    }
    
    query += ' ORDER BY a.appointment_date, a.appointment_time';
    
    const [appointments] = await db.query(query, queryParams);
    
    res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get appointment by ID
exports.getAppointmentById = async (req, res) => {
  try {
    const [appointments] = await db.query(
      `SELECT a.*, 
        d.first_name as doctor_first_name, d.last_name as doctor_last_name, d.specialization,
        p.first_name as patient_first_name, p.last_name as patient_last_name,
        c.name as clinic_name
      FROM appointments a
      LEFT JOIN doctors d ON a.doctor_id = d.id
      JOIN patients p ON a.patient_id = p.id
      JOIN clinics c ON a.clinic_id = c.id
      WHERE a.id = ?`,
      [req.params.id]
    );
    
    if (appointments.length === 0) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    const appointment = appointments[0];

    // Ownership check
    if (req.user.role === 'patient') {
      const [patientRows] = await db.query('SELECT id FROM patients WHERE user_id = ?', [req.user.id]);
      if (patientRows.length === 0 || patientRows[0].id !== appointment.patient_id) {
        return res.status(403).json({ message: 'Forbidden: You do not own this appointment' });
      }
    } else if (req.user.role === 'doctor') {
      const [doctorRows] = await db.query('SELECT id FROM doctors WHERE user_id = ?', [req.user.id]);
      if (doctorRows.length === 0 || doctorRows[0].id !== appointment.doctor_id) {
        return res.status(403).json({ message: 'Forbidden: You are not the assigned doctor' });
      }
    }
    
    res.json(appointment);
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new appointment
exports.createAppointment = async (req, res) => {
  try {
    const { doctorId, clinicId, date, time, reason, notes, patientUserId } = req.body;
    const isReceptionist = req.user.role === 'receptionist';
    
    // 1. Resolve target User ID (Self or via Receptionist selection)
    const targetUserId = isReceptionist && patientUserId ? patientUserId : req.user.id;

    // 2. Resolve Patient Profile ID (Source of truth for appointments table)
    const [patients] = await db.query('SELECT id, first_name, last_name FROM patients WHERE user_id = ?', [targetUserId]);
    if (patients.length === 0) {
      return res.status(404).json({ message: 'Patient record not found for this user.' });
    }
    const patient = patients[0];

    // 3. Basic Validation
    if (!clinicId || !date || !time || !reason) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0,0,0,0);
    if (selectedDate < today) {
      return res.status(400).json({ message: 'Cannot book appointments for past dates' });
    }

    // 4. Normalize Time
    let formattedTime = time;
    if (time.includes('AM') || time.includes('PM')) {
      const timeParts = time.match(/(\d+):(\d+)\s+(AM|PM)/i);
      if (timeParts) {
        let hours = parseInt(timeParts[1]);
        const minutes = timeParts[2];
        const period = timeParts[3].toUpperCase();
        if (period === 'PM' && hours < 12) hours += 12;
        else if (period === 'AM' && hours === 12) hours = 0;
        formattedTime = `${hours.toString().padStart(2, '0')}:${minutes}:00`;
      }
    }

    // 5. Atomic Conflict Check & Insert
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      if (doctorId) {
        const [conflict] = await conn.query(
          `SELECT id FROM appointments
           WHERE doctor_id = ? AND appointment_date = ?
             AND TIME_FORMAT(appointment_time,'%H:%i') = TIME_FORMAT(?,'%H:%i')
             AND status NOT IN ('cancelled','no-show')`,
          [doctorId, date, formattedTime]
        );

        if (conflict.length > 0) {
          await conn.rollback();
          conn.release();
          return res.status(409).json({ message: 'This time slot is already booked.' });
        }
      }

      const [result] = await conn.query(
        'INSERT INTO appointments (patient_id, doctor_id, clinic_id, appointment_date, appointment_time, reason, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [patient.id, doctorId || null, clinicId, date, formattedTime, reason, notes, doctorId ? 'pending' : 'pending_assignment']
      );

      await conn.commit();
      
      // Cleanup & Return
      conn.release();

      // Trigger Notifications (Non-blocking)
      const [clinicRows] = await db.query('SELECT name FROM clinics WHERE id = ?', [clinicId]);
      const clinicName = clinicRows[0]?.name || 'Hospital';

      if (doctorId) {
        const [doctorRows] = await db.query('SELECT u.email, d.first_name, d.last_name FROM doctors d JOIN users u ON d.user_id = u.id WHERE d.id = ?', [doctorId]);
        if (doctorRows.length > 0) {
          emailService.sendDoctorNewAppointmentEmail(doctorRows[0].email, `Dr. ${doctorRows[0].first_name}`, `${patient.first_name} ${patient.last_name}`, date, time).catch(console.error);
        }
      }

      return res.status(201).json({
        message: doctorId ? 'Appointment created successfully' : 'Appointment request submitted. A doctor will be assigned soon.',
        id: result.insertId
      });

    } catch (txErr) {
      await conn.rollback().catch(() => {});
      conn.release();
      throw txErr;
    }
  } catch (error) {
    console.error('Error creating appointment:', error);
    return res.status(500).json({ message: 'Error creating appointment', error: error.message });
  }
};

// Update appointment status
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, doctorId, date, time } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    // Add "confirmed" and "pending_assignment" to valid statuses
    const validStatuses = ['scheduled', 'completed', 'cancelled', 'no-show', 'pending', 'confirmed', 'pending_assignment', 'in-progress'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    // Get appointment details
    const [appointments] = await db.query(`
      SELECT a.*, 
        c.name as clinic_name,
        p.user_id as patient_user_id,
        d.user_id as doctor_user_id,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name
      FROM appointments a
      LEFT JOIN clinics c ON a.clinic_id = c.id
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN doctors d ON a.doctor_id = d.id
      WHERE a.id = ?
    `, [id]);
    
    if (appointments.length === 0) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    const appointment = appointments[0];
    
    // Ownership Check for Status Update
    
    // Build the query based on what fields need to be updated
    let query = 'UPDATE appointments SET status = ?, notes = ?';
    const queryParams = [status, notes || appointment.notes];
    
    // If doctorId is provided, update the doctor
    if (doctorId) {
      query += ', doctor_id = ?';
      queryParams.push(doctorId);
      
      // Get the doctor details
      const [doctors] = await db.query(`
        SELECT d.*, u.email 
        FROM doctors d 
        JOIN users u ON d.user_id = u.id 
        WHERE d.id = ?
      `, [doctorId]);
      
      if (doctors.length === 0) {
        return res.status(404).json({ message: 'Doctor not found' });
      }
      
      const doctor = doctors[0];
      
      // Create notification for the doctor
      try {
        await db.query(
          'INSERT INTO notifications (user_id, message, type, related_id) VALUES (?, ?, ?, ?)',
          [doctor.user_id, 'You have been assigned a new appointment', 'appointment_assigned', id]
        );
        console.log('Notification created for doctor:', doctor.user_id);
      } catch (notifError) {
        console.error('Error creating notification:', notifError);
        // Continue anyway, notification is not critical
      }
      
      // Get patient email
      const [patientUsers] = await db.query(
        'SELECT u.email FROM users u WHERE u.id = ?', 
        [appointment.patient_user_id]
      );
      
      if (patientUsers.length === 0) {
        console.error('Patient user not found:', appointment.patient_user_id);
      } else {
        const patientEmail = patientUsers[0].email;
        
        // Send confirmation email to patient
        try {
          console.log('Sending appointment confirmed email to patient:', patientEmail);
          await emailService.sendAppointmentConfirmationEmail(
            patientEmail,
            `${appointment.patient_first_name} ${appointment.patient_last_name}`,
            `Dr. ${doctor.first_name} ${doctor.last_name}`,
            appointment.appointment_date,
            appointment.appointment_time,
            appointment.clinic_name
          );
        } catch (emailError) {
          console.error('Error sending patient confirmation email:', emailError);
          // Continue anyway, email is not critical
        }
        
        // Send email to the doctor
        try {
          console.log('Sending new appointment email to doctor:', doctor.email);
          await emailService.sendDoctorNewAppointmentEmail(
            doctor.email,
            `${doctor.first_name} ${doctor.last_name}`,
            `${appointment.patient_first_name} ${appointment.patient_last_name}`,
            appointment.appointment_date,
            appointment.appointment_time
          );
        } catch (emailError) {
          console.error('Error sending doctor email:', emailError);
          // Continue anyway, email is not critical
        }
      }
    }
    
    // If date is provided (for rescheduling), update the date
    if (date) {
      query += ', appointment_date = ?';
      queryParams.push(date);
      
      // If both date and time are provided, it's a reschedule
      if (date && appointment.doctor_id) {
        // Get the doctor details
        const [doctors] = await db.query(`
          SELECT d.*, u.email 
          FROM doctors d 
          JOIN users u ON d.user_id = u.id 
          WHERE d.id = ?
        `, [appointment.doctor_id]);
        
        if (doctors.length > 0) {
          const doctor = doctors[0];
          
          // Create notification for the doctor about reschedule
          try {
            await db.query(
              'INSERT INTO notifications (user_id, message, type, related_id) VALUES (?, ?, ?, ?)',
              [doctor.user_id, 'An appointment has been rescheduled', 'appointment_rescheduled', id]
            );
            console.log('Reschedule notification created for doctor:', doctor.user_id);
          } catch (notifError) {
            console.error('Error creating reschedule notification:', notifError);
            // Continue anyway, notification is not critical
          }
          
          // Get patient email
          const [patientUsers] = await db.query(
            'SELECT u.email FROM users u WHERE u.id = ?', 
            [appointment.patient_user_id]
          );
          
          if (patientUsers.length > 0) {
            const patientEmail = patientUsers[0].email;
            
            // Send reschedule email to patient
            try {
              console.log('Sending appointment rescheduled email to patient:', patientEmail);
              await emailService.sendAppointmentConfirmationEmail(
                patientEmail,
                `${appointment.patient_first_name} ${appointment.patient_last_name}`,
                `Dr. ${doctor.first_name} ${doctor.last_name}`,
                date, // New date
                time, // New time
                appointment.clinic_name,
                true // Indicate this is a reschedule
              );
            } catch (emailError) {
              console.error('Error sending patient reschedule email:', emailError);
              // Continue anyway, email is not critical
            }
          }
        }
      }
    }
    
    // If time is provided (for rescheduling), update the time
    if (time) {
      query += ', appointment_time = ?';
      queryParams.push(time);
    }
    
    query += ' WHERE id = ?';
    queryParams.push(id);
    
    const [updateResult] = await db.query(query, queryParams);
    console.log('Appointment update result:', {
      appointmentId: id, 
      affectedRows: updateResult.affectedRows,
      changedRows: updateResult.changedRows
    });
    
    console.log('Appointment updated:', id, 'Status:', status);
    
    // If status changed but doctor wasn't changed
    if (appointment.status !== status && !doctorId) {
      // Handle specific status changes if needed
      if (status === 'cancelled') {
        console.log('Appointment cancelled:', id);
        
        // If the appointment has a doctor, notify them
        if (appointment.doctor_id) {
          // Get the doctor details
          const [doctors] = await db.query(`
            SELECT d.*, u.email 
            FROM doctors d 
            JOIN users u ON d.user_id = u.id 
            WHERE d.id = ?
          `, [appointment.doctor_id]);
          
          if (doctors.length > 0) {
            const doctor = doctors[0];
            
            // Create notification for the doctor about cancellation
            try {
              await db.query(
                'INSERT INTO notifications (user_id, message, type, related_id) VALUES (?, ?, ?, ?)',
                [doctor.user_id, 'An appointment has been cancelled', 'appointment_cancelled', id]
              );
              console.log('Cancellation notification created for doctor:', doctor.user_id);
            } catch (notifError) {
              console.error('Error creating cancellation notification:', notifError);
              // Continue anyway, notification is not critical
            }
          }
        }
        
        // Get patient email
        const [patientUsers] = await db.query(
          'SELECT u.email FROM users u WHERE u.id = ?', 
          [appointment.patient_user_id]
        );
        
        if (patientUsers.length > 0) {
          const patientEmail = patientUsers[0].email;
          
          // Send cancellation email to patient
          try {
            console.log('Sending appointment cancelled email to patient:', patientEmail);
            await emailService.sendAppointmentCancellationEmail(
              patientEmail,
              `${appointment.patient_first_name} ${appointment.patient_last_name}`,
              appointment.appointment_date,
              appointment.appointment_time,
              appointment.clinic_name,
              notes || 'No reason provided'
            );
          } catch (emailError) {
            console.error('Error sending patient cancellation email:', emailError);
            // Continue anyway, email is not critical
          }
        }
      } else if (status === 'completed') {
        console.log('Appointment completed:', id);
      }
    }
    
    res.json({ 
      message: 'Appointment status updated successfully',
      appointment: {
        id,
        status,
        doctor_id: doctorId || appointment.doctor_id
      }
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete appointment
exports.deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [appointments] = await db.query('SELECT * FROM appointments WHERE id = ?', [id]);
    if (appointments.length === 0) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    await db.query('DELETE FROM appointments WHERE id = ?', [id]);
    
    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get analytics for admin dashboard
exports.getAnalytics = async (req, res) => {
  try {
    // Status breakdown
    const [statusRows] = await db.query(
      'SELECT status, COUNT(*) as count FROM appointments GROUP BY status'
    );

    // Per-doctor breakdown (top 10)
    const [perDoctor] = await db.query(
      `SELECT CONCAT(d.first_name, ' ', d.last_name) as doctor,
              c.name as clinic,
              COUNT(a.id) as total,
              SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) as completed,
              SUM(CASE WHEN a.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
              SUM(CASE WHEN a.status IN ('scheduled','confirmed','pending','pending_assignment') THEN 1 ELSE 0 END) as upcoming
       FROM appointments a
       LEFT JOIN doctors d ON a.doctor_id = d.id
       LEFT JOIN clinics c ON a.clinic_id = c.id
       GROUP BY a.doctor_id, d.id
       ORDER BY total DESC
       LIMIT 10`
    );

    // Daily trend: last 14 days
    const [daily] = await db.query(
      `SELECT DATE_FORMAT(appointment_date,'%Y-%m-%d') as date, COUNT(*) as total
       FROM appointments
       WHERE appointment_date >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
       GROUP BY appointment_date
       ORDER BY appointment_date ASC`
    );

    const statusMap = {};
    statusRows.forEach(r => { 
      statusMap[r.status] = Number(r.count); 
    });
    
    const totalAll = statusRows.reduce((s, r) => s + Number(r.count), 0);

    // Map perDoctor values to Number
    const formattedPerDoctor = perDoctor.map(d => ({
      ...d,
      total: Number(d.total),
      completed: Number(d.completed),
      cancelled: Number(d.cancelled),
      upcoming: Number(d.upcoming)
    }));

    res.json({
      total: Number(totalAll),
      scheduled: (statusMap['scheduled'] || 0) + (statusMap['confirmed'] || 0),
      completed: statusMap['completed'] || 0,
      cancelled: statusMap['cancelled'] || 0,
      pending: (statusMap['pending'] || 0) + (statusMap['pending_assignment'] || 0),
      perDoctor: formattedPerDoctor,
      daily: daily.map(d => ({ ...d, total: Number(d.total) })),
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
 