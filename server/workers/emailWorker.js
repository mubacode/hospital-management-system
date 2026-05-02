const { Worker } = require('bullmq');
const nodemailer = require('nodemailer');
const valkeyClient = require('../config/valkey');
const logger = require('../config/logger');

// Setup Nodemailer transporter
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

let transporter;
if (SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });
}

const emailWorker = valkeyClient ? new Worker('email-queue', async (job) => {
  const { type, payload, requestId } = job.data;
  
  logger.info('Processing email job', {
    event: 'job_started',
    jobId: job.id,
    queue: 'email-queue',
    type,
    requestId
  });

  if (!transporter) {
    throw new Error('Email transporter not configured. Missing SMTP credentials.');
  }

  const mailOptions = {
    from: SMTP_USER,
    to: payload.to,
    subject: payload.subject,
    html: payload.html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info('Email sent successfully', { 
      event: 'email_sent', 
      jobId: job.id, 
      messageId: info.messageId,
      requestId
    });
    return { messageId: info.messageId };
  } catch (error) {
    logger.error('Failed to send email', { 
      event: 'email_failed', 
      jobId: job.id, 
      error: error.message,
      requestId
    });
    throw error; // Let BullMQ handle retries
  }
}, { connection: valkeyClient }) : null;

if (emailWorker) {
  emailWorker.on('error', err => {
    logger.error('Email Worker Error', { error: err.message });
  });
}

module.exports = emailWorker;
