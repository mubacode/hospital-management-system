const { Worker } = require('bullmq');
const OpenAI = require('openai');
const valkeyClient = require('../config/valkey');
const db = require('../config/db');
const logger = require('../config/logger');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: OPENROUTER_API_KEY,
});

// Import tools and system instruction (we will move them to a shared file later, or redefine them here for now)
const { tools, systemInstruction } = require('../utils/chatbotTools');

// Re-implement tool executor inside the worker, or use a shared one.
// Since the user asked to move AI processing and tool execution here, I'll put executeTool here.
async function executeTool(name, args, userId) {
  try {
    switch(name) {
      case 'get_clinics': {
        const [clinics] = await db.query('SELECT id, name FROM clinics');
        return { clinics };
      }
      case 'get_doctors': {
        const [doctors] = await db.query('SELECT id, first_name, last_name, specialization FROM doctors WHERE clinic_id = ?', [args.clinicId]);
        return { doctors };
      }
      case 'check_availability': {
        const [booked] = await db.query(
          `SELECT TIME_FORMAT(appointment_time,'%H:%i') as t FROM appointments 
           WHERE doctor_id = ? AND appointment_date = ? AND status NOT IN ('cancelled')`,
          [args.doctorId, args.date]
        );
        const bookedTimes = booked.map(r => r.t);
        const allSlots = [];
        for (let h = 9; h < 17; h++) {
          allSlots.push(`${String(h).padStart(2,'0')}:00`);
          allSlots.push(`${String(h).padStart(2,'0')}:30`);
        }
        return { 
          availableSlots: allSlots.filter(t => !bookedTimes.includes(t)) 
        };
      }
      case 'book_appointment': {
        const [patients] = await db.query('SELECT id FROM patients WHERE user_id = ?', [userId]);
        if (patients.length === 0) return { status: 'error', message: 'Patient profile not found.' };
        
        const conn = await db.getConnection();
        try {
          await conn.beginTransaction();

          const [conflict] = await conn.query(
            "SELECT id FROM appointments WHERE doctor_id = ? AND appointment_date = ? AND TIME_FORMAT(appointment_time,'%H:%i') = ? AND status NOT IN ('cancelled') FOR UPDATE",
            [args.doctorId, args.date, args.time]
          );

          if (conflict.length > 0) {
            await conn.rollback();
            conn.release();
            return { status: 'error', message: 'Slot taken, try another time.' };
          }

          await conn.query(
            'INSERT INTO appointments (patient_id, doctor_id, clinic_id, appointment_date, appointment_time, reason, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [patients[0].id, args.doctorId, args.clinicId, args.date, args.time, 'Chatbot AI Booking', 'pending']
          );

          await conn.commit();
          conn.release();
          return { status: 'success', message: 'Appointment booked.' };
        } catch (txErr) {
          await conn.rollback().catch(() => {});
          conn.release();
          throw txErr;
        }
      }
      case 'get_my_appointments': {
        const [patients] = await db.query('SELECT id FROM patients WHERE user_id = ?', [userId]);
        if (patients.length === 0) return { appointments: [] };
        const [appointments] = await db.query(
          `SELECT a.appointment_date, a.appointment_time, a.status, d.first_name, d.last_name 
           FROM appointments a JOIN doctors d ON a.doctor_id = d.id 
           WHERE a.patient_id = ? ORDER BY a.appointment_date DESC`,
          [patients[0].id]
        );
        return { appointments };
      }
      case 'cancel_appointment': {
        const [patients] = await db.query('SELECT id FROM patients WHERE user_id = ?', [userId]);
        if (patients.length === 0) return { status: 'error', message: 'Patient not found' };
        
        const [appointment] = await db.query(
          'SELECT id FROM appointments WHERE patient_id = ? AND doctor_id = ? AND appointment_date = ? AND status NOT IN ("cancelled")',
          [patients[0].id, args.doctorId, args.date]
        );
        if (appointment.length === 0) return { status: 'error', message: 'Appointment not found' };

        await db.query('UPDATE appointments SET status = "cancelled" WHERE id = ?', [appointment[0].id]);
        return { status: 'success', message: 'Appointment cancelled.' };
      }
      default:
        return { error: `Tool ${name} not recognized` };
    }
  } catch (error) {
    logger.error('Tool execution error', { error: error.message, tool: name });
    return { error: 'Internal system error while executing tool' };
  }
}

const chatbotWorker = valkeyClient ? new Worker('chatbot-queue', async (job) => {
  const { userId, requestId } = job.data;
  
  logger.info('Processing chatbot job', {
    event: 'job_started',
    jobId: job.id,
    queue: 'chatbot-queue',
    userId,
    requestId
  });

  // Reconstruct conversation from chat_messages
  const [messageRows] = await db.query(
    'SELECT role, content FROM chat_messages WHERE user_id = ? ORDER BY created_at ASC',
    [String(userId)]
  );

  let activeChat = [
    { role: 'system', content: systemInstruction }
  ];

  messageRows.forEach(row => {
    activeChat.push({ role: row.role, content: row.content });
  });

  let isMakingToolCalls = true;
  let finalContent = "";

  while (isMakingToolCalls) {
    const requestPayload = {
      model: 'openai/gpt-oss-120b:free', 
      messages: activeChat,
      tools: tools,
    };

    const response = await openai.chat.completions.create(requestPayload);
    const responseMessage = response.choices[0].message;
    
    const messageToStore = {
      role: responseMessage.role,
      content: responseMessage.content || ""
    };
    
    if (responseMessage.reasoning_details) {
      messageToStore.reasoning_details = responseMessage.reasoning_details;
    }
    
    if (responseMessage.tool_calls) {
      messageToStore.tool_calls = responseMessage.tool_calls;
    }
    
    activeChat.push(messageToStore);

    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      for (const call of responseMessage.tool_calls) {
        let args = {};
        try {
          args = JSON.parse(call.function.arguments);
        } catch (e) {}
        
        const toolResult = await executeTool(call.function.name, args, userId);
        
        activeChat.push({
          tool_call_id: call.id,
          role: 'tool',
          name: call.function.name,
          content: JSON.stringify(toolResult)
        });
      }
    } else {
      isMakingToolCalls = false;
      finalContent = responseMessage.content;
    }
  }
  
  // Persist the final AI response
  await db.query(
    'INSERT INTO chat_messages (user_id, role, content) VALUES (?, ?, ?)',
    [String(userId), 'assistant', finalContent]
  );
  
  logger.info('Chatbot job completed successfully', {
    event: 'job_completed',
    jobId: job.id,
    queue: 'chatbot-queue',
    userId,
    requestId
  });

  return { success: true };
}, { connection: redisClient }) : null;

if (chatbotWorker) {
  chatbotWorker.on('error', err => {
    logger.error('Chatbot Worker Error', { error: err.message });
  });
}

module.exports = chatbotWorker;
