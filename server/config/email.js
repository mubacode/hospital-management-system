const nodemailer = require('nodemailer');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

console.log('Email Config - SMTP User:', SMTP_USER);
console.log('Email Config - SMTP Pass length:', SMTP_PASS ? SMTP_PASS.length : 0);

// Create a transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // use SSL
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
  },
  debug: true,
  logger: true
});

// Verify connection configuration
transporter.verify(function (error, success) {
  if (error) {
    console.log('Email service error:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

// Email template functions
const getVerificationEmailTemplate = (verificationCode) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #333;">Email Verification</h2>
      <p>Thank you for registering with our Hospital Management System. Please use the following verification code to complete your registration:</p>
      <div style="background-color: #f5f5f5; padding: 12px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
        ${verificationCode}
      </div>
      <p>This code will expire in 10 minutes.</p>
      <p>If you did not request this verification, please ignore this email.</p>
      <p>Best regards,<br>Hospital Management Team</p>
    </div>
  `;
};

const getInvitationTemplate = (name, role, setupLink) => {
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #eee; border-radius: 16px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="background-color: #0d6efd; color: white; width: 50px; height: 50px; line-height: 50px; border-radius: 12px; display: inline-block; font-size: 24px; font-weight: bold;">CP</div>
        <h2 style="color: #0d6efd; margin-top: 15px;">Hospital Portal Invitation</h2>
      </div>
      <p style="font-size: 16px; color: #333;">Hello ${name},</p>
      <p style="font-size: 16px; color: #555; line-height: 1.6;">You have been invited to join the <strong>CarePlus Hospital Management System</strong> as a <strong>${role.charAt(0).toUpperCase() + role.slice(1)}</strong>.</p>
      <p style="font-size: 16px; color: #555; line-height: 1.6;">To finalize your professional profile and set up your secure access password, please click the button below:</p>
      <div style="text-align: center; margin: 35px 0;">
        <a href="${setupLink}" style="background-color: #0d6efd; color: white; padding: 14px 30px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(13, 110, 253, 0.2);">Set Up My Account</a>
      </div>
      <p style="font-size: 14px; color: #888; text-align: center;">This invitation link will expire in 48 hours for your security.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
      <p style="font-size: 13px; color: #aaa; text-align: center; line-height: 1.5;">
        If you did not expect this invitation, please contact the hospital IT department.<br>
        &copy; 2026 CarePlus Health Network
      </p>
    </div>
  `;
};

const getAppointmentPendingEmailTemplate = (patientName, date, time, clinic) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #333;">Appointment Request Received</h2>
      <p>Dear ${patientName},</p>
      <p>We have received your appointment request with the following details:</p>
      <ul>
        <li><strong>Date:</strong> ${date}</li>
        <li><strong>Time:</strong> ${time}</li>
        <li><strong>Clinic:</strong> ${clinic}</li>
      </ul>
      <p>Your appointment is currently <strong>pending assignment</strong> to a doctor. Our receptionist will review your request and assign an appropriate doctor soon.</p>
      <p>You will receive a confirmation email once your appointment is approved and assigned.</p>
      <p>Thank you for choosing our services.</p>
      <p>Best regards,<br>Hospital Management Team</p>
    </div>
  `;
};

const getAppointmentConfirmationEmailTemplate = (patientName, doctorName, date, time, clinic, isReschedule = false) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #333;">${isReschedule ? 'Appointment Rescheduled' : 'Appointment Confirmation'}</h2>
      <p>Dear ${patientName},</p>
      <p>${isReschedule
      ? 'Your appointment has been rescheduled. The new details are:'
      : 'Your appointment has been confirmed with the following details:'}</p>
      <ul>
        <li><strong>Doctor:</strong> ${doctorName}</li>
        <li><strong>Date:</strong> ${date}</li>
        <li><strong>Time:</strong> ${time}</li>
        <li><strong>Clinic:</strong> ${clinic}</li>
      </ul>
      <p>Please arrive 15 minutes before your appointment time.</p>
      <p>If you need to cancel or reschedule, please contact us at least 24 hours in advance.</p>
      <p>Best regards,<br>Hospital Management System</p>
    </div>
  `;
};

const getDoctorNewAppointmentEmailTemplate = (doctorName, patientName, date, time) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #333;">New Appointment Scheduled</h2>
      <p>Dear Dr. ${doctorName},</p>
      <p>A new appointment has been scheduled for you:</p>
      <ul>
        <li><strong>Patient:</strong> ${patientName}</li>
        <li><strong>Date:</strong> ${date}</li>
        <li><strong>Time:</strong> ${time}</li>
      </ul>
      <p>Please check your dashboard for more details.</p>
      <p>Best regards,<br>Hospital Management Team</p>
    </div>
  `;
};

const getReceptionistNewAppointmentEmailTemplate = (patientName, date, time, clinic) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #333;">New Appointment Requires Assignment</h2>
      <p>Dear Receptionist,</p>
      <p>A new appointment request needs doctor assignment:</p>
      <ul>
        <li><strong>Patient:</strong> ${patientName}</li>
        <li><strong>Date:</strong> ${date}</li>
        <li><strong>Time:</strong> ${time}</li>
        <li><strong>Clinic:</strong> ${clinic}</li>
      </ul>
      <p>Please log in to the system and assign an appropriate doctor for this appointment.</p>
      <p>Best regards,<br>Hospital Management System</p>
    </div>
  `;
};

const getAppointmentCancellationEmailTemplate = (patientName, date, time, clinic, reason) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #333;">Appointment Cancelled</h2>
      <p>Dear ${patientName},</p>
      <p>Your appointment has been cancelled:</p>
      <ul>
        <li><strong>Date:</strong> ${date}</li>
        <li><strong>Time:</strong> ${time}</li>
        <li><strong>Clinic:</strong> ${clinic}</li>
        <li><strong>Reason:</strong> ${reason}</li>
      </ul>
      <p>If you would like to schedule a new appointment, please contact our reception or use the online booking system.</p>
      <p>Best regards,<br>Hospital Management System</p>
    </div>
  `;
};

// Email sending functions
const sendVerificationEmail = async (email, verificationCode) => {
  const mailOptions = {
    from: SMTP_USER,
    to: email,
    subject: 'Email Verification - Hospital Management System',
    html: getVerificationEmailTemplate(verificationCode)
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
};

const sendInvitationEmail = async (email, name, role, setupLink) => {
  const mailOptions = {
    from: SMTP_USER,
    to: email,
    subject: `Portal Invitation: Join CarePlus as ${role}`,
    html: getInvitationTemplate(name, role, setupLink)
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Invitation email sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending invitation email:', error);
    return false;
  }
};

const sendAppointmentPendingEmail = async (patientEmail, patientName, date, time, clinic) => {
  console.log(`Preparing to send pending email to: ${patientEmail} for patient: ${patientName}`);

  if (!patientEmail) {
    console.error('Cannot send email: patientEmail is empty or undefined');
    return false;
  }

  const mailOptions = {
    from: SMTP_USER,
    to: patientEmail,
    subject: 'Appointment Request Received - Hospital Management System',
    html: getAppointmentPendingEmailTemplate(patientName, date, time, clinic)
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Appointment pending email sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending appointment pending email:', error);
    return false;
  }
};

const sendAppointmentConfirmationEmail = async (patientEmail, patientName, doctorName, date, time, clinic, isReschedule = false) => {
  if (!patientEmail) return false;

  const mailOptions = {
    from: SMTP_USER,
    to: patientEmail,
    subject: isReschedule ? 'Appointment Rescheduled - Hospital Management System' : 'Appointment Confirmed - Hospital Management System',
    html: getAppointmentConfirmationEmailTemplate(patientName || "Patient", doctorName, date, time, clinic, isReschedule)
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Appointment confirmation email sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending appointment confirmation email:', error);
    return false;
  }
};

const sendDoctorNewAppointmentEmail = async (doctorEmail, doctorName, patientName, date, time) => {
  if (!doctorEmail) return false;

  const mailOptions = {
    from: SMTP_USER,
    to: doctorEmail,
    subject: 'New Appointment Scheduled - Hospital Management System',
    html: getDoctorNewAppointmentEmailTemplate(doctorName || "Doctor", patientName, date, time)
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Doctor new appointment email sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending doctor new appointment email:', error);
    return false;
  }
};

const sendReceptionistNewAppointmentEmail = async (receptionistEmail, patientName, date, time, clinic) => {
  const mailOptions = {
    from: SMTP_USER,
    to: receptionistEmail,
    subject: 'New Appointment Requires Assignment - Hospital Management System',
    html: getReceptionistNewAppointmentEmailTemplate(patientName, date, time, clinic)
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Receptionist new appointment email sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending receptionist new appointment email:', error);
    return false;
  }
};

const sendAppointmentCancellationEmail = async (patientEmail, patientName, date, time, clinic, reason) => {
  const mailOptions = {
    from: SMTP_USER,
    to: patientEmail,
    subject: 'Appointment Cancelled - Hospital Management System',
    html: getAppointmentCancellationEmailTemplate(patientName, date, time, clinic, reason)
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Cancellation email sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending cancellation email:', error);
    return false;
  }
};

module.exports = {
  sendVerificationEmail,
  sendInvitationEmail,
  sendAppointmentPendingEmail,
  sendAppointmentConfirmationEmail,
  sendDoctorNewAppointmentEmail,
  sendReceptionistNewAppointmentEmail,
  sendAppointmentCancellationEmail
};