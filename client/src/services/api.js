import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Global error handling and response unwrapping
api.interceptors.response.use(
  (response) => {
    // If the response follows our standardized { success, data, requestId } format,
    // unwrap the data field so components can continue using it directly.
    if (response.data && response.data.success === true && response.data.hasOwnProperty('data')) {
      // Preserve the original Axios response structure but update data
      response.data = response.data.data;
    }
    return response;
  },
  (error) => {
    // Standardized error unwrapping
    if (error.response?.data?.success === false && error.response?.data?.error) {
      error.message = error.response.data.error;
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// --- Domain Services ---

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  changePassword: (data) => api.patch('/auth/change-password', data),
  inviteUser: (data) => api.post('/auth/invite', data),
  verifyInvite: (token) => api.get(`/auth/verify-invite?token=${token}`),
  setupInvitedAccount: (data) => api.post('/auth/setup-invited', data),
};

export const adminService = {
  getStats: () => api.get('/users/stats'),
  getUsers: () => api.get('/users'),
  createUser: (data) => authService.register(data), 
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
};

export const receptionistService = {
  getAll: () => api.get('/receptionists'),
  delete: (id) => api.delete(`/receptionists/${id}`),
};

export const doctorService = {
  getAll: () => api.get('/doctors'),
  getByClinic: (clinicId) => api.get(`/doctors/clinic/${clinicId}`),
  getAppointments: () => api.get('/appointments'),
  updateStatus: (id, data) => api.patch(`/appointments/${id}/status`, data),
};

export const patientService = {
  getAll: () => api.get('/users?role=patient'), // Filtered list
  getHistory: (id) => api.get(`/medical-records/patient/${id}`),
};

export const appointmentService = {
  getAll: () => api.get('/appointments'),
  getMyAppointments: () => api.get('/appointments'),
  create: (data) => api.post('/appointments', data),
  update: (id, data) => api.patch(`/appointments/${id}/status`, data),
  // Check if a slot is free and get suggestions if not
  checkAvailability: (doctorId, date, time) =>
    api.get('/appointments/availability', { params: { doctor_id: doctorId, date, time } }),
  // Admin analytics
  getAnalytics: () => api.get('/appointments/analytics'),
};

export const clinicService = {
  getAll: () => api.get('/clinics'),
  getDoctors: (clinicId) => api.get(`/doctors/clinic/${clinicId}`),
  create: (data) => api.post('/clinics', data),
  update: (id, data) => api.put(`/clinics/${id}`, data),
  delete: (id) => api.delete(`/clinics/${id}`),
};

export const chatbotService = {
  sendMessage: (message, contextHint = null) => 
    api.post('/chatbot/message', { message, contextHint }),
  getResult: (jobId) => api.get(`/chatbot/result/${jobId}`),
};

export default api;
