module.exports = { systemInstruction:  `You are CarePlus Assistant, a helpful AI virtual receptionist for a hospital. 
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
4. Only call 'reschedule_appointment' if the requested time is explicitly in the available suggestions.`,
tools:  [
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
]
};