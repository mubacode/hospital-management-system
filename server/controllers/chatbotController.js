const OpenAI = require('openai');
const db = require('../config/db');

// Initialize OpenRouter Client
const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || 'MISSING_KEY'
});

const systemInstruction = `You are CarePlus Assistant, a helpful AI virtual receptionist for a hospital. 
Your primary job is to help patients book, reschedule, view, and cancel their medical appointments.
You have access to backend functional tools to interact with the database.
Always use markdown to format responses beautifully (bolding text, bullet points).
If a user tries to converse about topics entirely unrelated to healthcare or the hospital, politely redirect them back to the hospital services.
Always respond in the SAME language the user is using (Turkish or English). 
NEVER mention internal tool names, function calls, or technical numbers to the user. Just help them naturally.
CRITICAL RULES FOR BOOKING:
1. When booking, you must collect the Clinic, Doctor, Date (YYYY-MM-DD), and Time.
2. If the user doesn't provide them, call 'get_clinics' to show departments, then 'get_doctors' for a department.
3. You MUST call 'check_availability' to see what times are open before finalizing a booking.
4. After verifying availability, ask the user to confirm. If they say yes, call 'book_appointment'.

CRITICAL RULES FOR RESCHEDULING:
1. Always call 'get_my_appointments' first to see what the user has booked.
2. Ask them which one they want to change, and what the new date/time should be.
3. You MUST call 'check_availability' for the original doctor on the new date.
4. Only call 'reschedule_appointment' if the requested time is explicitly in the available suggestions.`;

const tools = [
  {
    type: 'function',
    function: {
      name: 'get_clinics',
      description: 'Get a list of all hospital clinics/departments. Returns an array of { id, name }.',
      parameters: { type: 'object', properties: {} } 
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_doctors',
      description: 'Get a list of doctors for a specific clinic. Returns { id, first_name, last_name, specialization }.',
      parameters: {
        type: 'object',
        properties: {
          clinicId: { type: 'string', description: 'The ID of the clinic.' }
        },
        required: ['clinicId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'check_availability',
      description: 'Look up available timeslots for a doctor on a specific date (YYYY-MM-DD). Returns an array of times.',
      parameters: {
        type: 'object',
        properties: {
          doctorId: { type: 'string' },
          date: { type: 'string', description: 'YYYY-MM-DD format.' }
        },
        required: ['doctorId', 'date']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'book_appointment',
      description: 'Book a new appointment. Returns success or error message.',
      parameters: {
        type: 'object',
        properties: {
          clinicId: { type: 'string' },
          doctorId: { type: 'string' },
          date: { type: 'string', description: 'YYYY-MM-DD' },
          time: { type: 'string', description: 'HH:MM format' }
        },
        required: ['clinicId', 'doctorId', 'date', 'time']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_my_appointments',
      description: 'Fetch the active user\'s upcoming scheduled appointments.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'cancel_appointment',
      description: 'Cancel a specific appointment by ID.',
      parameters: {
        type: 'object',
        properties: {
          appointmentId: { type: 'string', description: 'The ID of the appointment.' }
        },
        required: ['appointmentId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'reschedule_appointment',
      description: 'Reschedule an appointment to a new date/time. NOTE: check_availability MUST be used before this to ensure the slot is free.',
      parameters: {
        type: 'object',
        properties: {
          appointmentId: { type: 'string' },
          doctorId: { type: 'string', description: 'The doctor ID.' },
          newDate: { type: 'string', description: 'YYYY-MM-DD' },
          newTime: { type: 'string', description: 'HH:MM format' }
        },
        required: ['appointmentId', 'doctorId', 'newDate', 'newTime']
      }
    }
  }
];

// Session store for conversational memory
const activeChats = {};

exports.processMessage = async (req, res) => {
  try {
    const userId = req.user?.id || 'anonymous';
    const { message } = req.body;
    
    console.log(`[Chatbot] Request from User ID: ${userId}, Message: "${message}"`);

    if (!activeChats[userId]) {
      activeChats[userId] = [
        { role: 'system', content: systemInstruction }
      ];
    }
    
    // Add user's message to history
    activeChats[userId].push({ role: 'user', content: message });

    let isMakingToolCalls = true;
    let finalContent = "";

    // Processing loop (auto-handle multiple tool-call roundtrips)
    while (isMakingToolCalls) {
      
      const requestPayload = {
        model: 'openai/gpt-oss-120b:free', 
        messages: activeChats[userId],
        tools: tools,
      };

      console.log(`[Chatbot] Sending request to OpenRouter using model: ${requestPayload.model}`);
      const response = await openai.chat.completions.create(requestPayload);
      const responseMessage = response.choices[0].message;
      
      // Safety: Preserve ONLY the keys open router explicitly allows in history
      const messageToStore = {
        role: responseMessage.role,
        content: responseMessage.content || ""
      };
      
      // Preserve tracking keys requested by user
      if (responseMessage.reasoning_details) {
        messageToStore.reasoning_details = responseMessage.reasoning_details;
      }
      
      if (responseMessage.tool_calls) {
        messageToStore.tool_calls = responseMessage.tool_calls;
      }
      
      // Add assistant response/tool request to history
      activeChats[userId].push(messageToStore);

      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        // Execute tools
        for (const call of responseMessage.tool_calls) {
          console.log(`[OpenRouter OSS] Executing Tool: ${call.function.name}`, call.function.arguments);
          let args = {};
          try {
            args = JSON.parse(call.function.arguments);
          } catch (e) {
            console.error('JSON parse error on arguments', e);
          }
          
          const toolResult = await executeTool(call.function.name, args, userId);
          
          // Append the tool result to the conversation
          activeChats[userId].push({
            tool_call_id: call.id,
            role: 'tool',
            name: call.function.name,
            content: JSON.stringify(toolResult)
          });
        }
      } else {
        // Final text generated, break loop
        isMakingToolCalls = false;
        finalContent = responseMessage.content;
      }
    }
    
    return res.json({ text: finalContent, resetSession: false });

  } catch (error) {
    console.error('--- CHATBOT CONTROLLER ERROR ---');
    console.error('Status:', error.status);
    console.error('Message:', error.message);
    if (error.response) {
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
    }
    console.error('--------------------------------');
    
    let errorMsg = 'A technical error occurred with the AI agent. Please try again.';
    if (error.status === 429) {
      errorMsg = "I'm currently hitting OpenRouter rate-limits. Please wait a minute and try again.";
    }

    return res.status(500).json({ text: errorMsg, resetSession: true });
  }
};

// ─── TOOL EXECUTORS ───

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
      
        const suggestions = allSlots.filter(s => !bookedTimes.includes(s));
        return { available_slots: suggestions };
      }
      
      case 'book_appointment': {
        const [patients] = await db.query('SELECT id FROM patients WHERE user_id = ?', [userId]);
        if (patients.length === 0) return { status: 'error', message: 'Patient profile not found.' };
        
        // Double check conflict
        const [conflict] = await db.query(
          "SELECT id FROM appointments WHERE doctor_id = ? AND appointment_date = ? AND TIME_FORMAT(appointment_time,'%H:%i') = ? AND status NOT IN ('cancelled')",
          [args.doctorId, args.date, args.time]
        );
        if (conflict.length > 0) return { status: 'error', message: 'Slot taken, try another time.' };

        await db.query(
          'INSERT INTO appointments (patient_id, doctor_id, clinic_id, appointment_date, appointment_time, reason, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [patients[0].id, args.doctorId, args.clinicId, args.date, args.time, 'Chatbot AI Booking', 'pending']
        );
        return { status: 'success', message: 'Appointment booked.' };
      }
      
      case 'get_my_appointments': {
        const [appointments] = await db.query(`
          SELECT a.id as appointmentId, a.appointment_date as date, a.appointment_time as time, a.doctor_id as doctorId, a.clinic_id as clinicId,
                 d.first_name, d.last_name, c.name as clinic_name, a.status
          FROM appointments a
          JOIN patients p ON a.patient_id = p.id
          LEFT JOIN doctors d ON a.doctor_id = d.id
          JOIN clinics c ON a.clinic_id = c.id
          WHERE p.user_id = ? AND a.appointment_date >= CURDATE() AND a.status NOT IN ('cancelled')
          ORDER BY a.appointment_date
        `, [userId]);
        return { appointments };
      }
      
      case 'cancel_appointment': {
        await db.query("UPDATE appointments SET status = 'cancelled' WHERE id = ?", [args.appointmentId]);
        return { status: 'success' };
      }
      
      case 'reschedule_appointment': {
        // Double check
        const [conflict] = await db.query(
          "SELECT id FROM appointments WHERE doctor_id = ? AND appointment_date = ? AND TIME_FORMAT(appointment_time,'%H:%i') = ? AND status NOT IN ('cancelled')",
          [args.doctorId, args.newDate, args.newTime]
        );
        if (conflict.length > 0) return { status: 'error', message: 'Slot no longer available.' };

        await db.query(
          "UPDATE appointments SET appointment_date = ?, appointment_time = ?, status = 'pending' WHERE id = ?",
          [args.newDate, args.newTime, args.appointmentId]
        );
        return { status: 'success', message: 'Rescheduled successfully.' };
      }

      default:
        return { error: 'Unknown tool' };
    }
  } catch(err) {
    console.error('Tool exec error:', err);
    return { error: err.message };
  }
}
