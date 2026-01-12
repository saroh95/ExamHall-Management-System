import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Token Manager
export const TokenManager = {
  getAccessToken: () => localStorage.getItem('token'),
  setAccessToken: (token) => localStorage.setItem('token', token),
  removeAccessToken: () => localStorage.removeItem('token'),
  isTokenExpired: (token) => {
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch (error) {
      return true;
    }
  }
};

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  // Increase default timeout to handle longer scheduling operations
  timeout: 60000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log('🔍 API Request Debug:', {
      url: config.url,
      method: config.method,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      hasToken: !!localStorage.getItem('token'),
      timestamp: new Date().toISOString()
    });

    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Token added to request');
    } else {
      console.log('⚠️  No token found in localStorage');
    }
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response Success:', {
      url: response.config.url,
      status: response.status,
      dataSuccess: response.data?.success
    });
    return response;
  },
  (error) => {
    // Extract error message for better logging
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        'Unknown error';
    
    console.error('🚨 API Response Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: errorMessage,
      data: error.response?.data,
      fullError: error
    });
    
    if (error.response?.status === 401) {
      console.log('🔐 Unauthorized - Clearing token');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  studentLogin: (credentials) => api.post('/auth/student-login', credentials),
  teacherLogin: (credentials) => api.post('/auth/teacher-login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
  changePassword: (currentPassword, newPassword) => api.put('/auth/change-password', { currentPassword, newPassword }),
  changeStudentPassword: (currentPassword, newPassword) => api.put('/students/change-password', { currentPassword, newPassword }),
  changeTeacherPassword: (currentPassword, newPassword) => api.put('/teachers/change-password', { currentPassword, newPassword }),
};


// Student APIs
export const studentAPI = {
  getStudents: (params) => api.get('/students', { params }),
  getAllStudents: (params) => api.get('/students/all', { params }),
  getStudent: (id) => api.get(`/students/${id}`),
  createStudent: (studentData) => api.post('/students', studentData),
  updateStudent: (id, studentData) => api.patch(`/students/${id}`, studentData),
  deleteStudent: (id) => api.delete(`/students/${id}`),
  bulkDeleteStudents: (ids) => api.post('/students/bulk-delete', { ids }),
  bulkUploadStudents: (formData, onUploadProgress) => api.post('/students/bulk-upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
    timeout: 300000, // 5 minutes for large bulk uploads
  }),
  sendCredentials: (credentials) => api.post('/students/send-credentials', { credentials }, {
    timeout: 60000 // 60 seconds for sending credentials (email may be slow)
  }),
  exportCSV: () => api.get('/students/export', { responseType: 'blob' }),
  getCachedStats: (params) => api.get('/students/stats/cached', { params }),
};

// Teacher APIs
export const teacherAPI = {
  getTeachers: (params) => api.get('/teachers', { params }),
  getTeacher: (id) => api.get(`/teachers/${id}`),
  createTeacher: (teacherData) => api.post('/teachers', teacherData),
  updateTeacher: (id, teacherData) => api.patch(`/teachers/${id}`, teacherData),
  deleteTeacher: (id) => api.delete(`/teachers/${id}`),
  bulkUploadTeachers: (formData, onUploadProgress, lenient = false) => api.post(`/teachers/bulk-upload?lenient=${lenient}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
    timeout: 300000, // 5 minutes for large bulk uploads
  }),
  // Backward-compatible alias used across components
  // Accepts (formData, { onUploadProgress, lenient }) to match callers
  bulkUpload: (formData, options = {}) => api.post(`/teachers/bulk-upload?lenient=${options.lenient === true}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: options.onUploadProgress,
    timeout: 300000, // 5 minutes for large bulk uploads
  }),
  // Bulk delete API: backend expects { teacherIds: [...] } in request body on DELETE
  bulkDeleteTeachers: (teacherIds) => api.delete('/teachers/bulk-delete', { data: { teacherIds } }),
  sendCredentials: (credentials) => api.post('/teachers/send-credentials', { credentials }, {
    timeout: 60000 // 60 seconds for sending credentials (email may be slow)
  }),
  getCachedStats: () => api.get('/teachers/stats/cached'),
};

// Subject APIs
export const subjectAPI = {
  getSubjects: (params) => api.get('/subjects', { params }),
  getSubject: (id) => api.get(`/subjects/${id}`),
  createSubject: (subjectData) => api.post('/subjects', subjectData),
  updateSubject: (id, subjectData) => api.patch(`/subjects/${id}`, subjectData),
  deleteSubject: (id) => api.delete(`/subjects/${id}`),
  getSubjectsByDepartment: (departmentId) => api.get(`/subjects/department/${departmentId}`),
  getSubjectsBySemester: (semester) => api.get(`/subjects/semester/${semester}`),
  bulkUpload: (formData) => api.post('/subjects/bulk-upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 300000, // 5 minutes for large bulk uploads
  }),
};

// Department APIs
export const departmentAPI = {
  getDepartments: (params) => api.get('/departments', { params }),
  getDepartment: (id) => api.get(`/departments/${id}`),
  createDepartment: (departmentData) => api.post('/departments', departmentData),
  updateDepartment: (id, departmentData) => api.patch(`/departments/${id}`, departmentData),
  deleteDepartment: (id) => api.delete(`/departments/${id}`),
};

// Exam APIs
export const examAPI = {
  getExams: (params) => api.get('/exams', { params }),
  getExam: (id) => api.get(`/exams/${id}`),
  createExam: (examData) => api.post('/exams', examData),
  updateExam: (id, examData) => api.patch(`/exams/${id}`, examData),
  deleteExam: (id) => api.delete(`/exams/${id}`),
  assignInvigilators: (id, invigilators) => api.patch(`/exams/${id}/invigilators`, { invigilators }),
  scheduleExams: (scheduleData) => api.post('/unified-exam-scheduler/schedule', scheduleData, {
    timeout: 120000 // 2 minutes for exam scheduling
  }),
};

// Classroom APIs
export const classroomAPI = {
  getClassrooms: (params) => api.get('/classrooms', { params }),
  getClassroom: (id) => api.get(`/classrooms/${id}`),
  createClassroom: (classroomData) => api.post('/classrooms', classroomData),
  updateClassroom: (id, classroomData) => api.patch(`/classrooms/${id}`, classroomData),
  deleteClassroom: (id) => api.delete(`/classrooms/${id}`),
  findAvailableClassrooms: (searchData) => api.post('/classrooms/available', searchData),
  bookClassroom: (id, bookingData) => api.post(`/classrooms/${id}/book`, bookingData),
  getClassroomBookings: (id) => api.get(`/classrooms/${id}/bookings`),
  bulkUploadClassrooms: (formData, onUploadProgress) => api.post('/classrooms/bulk-upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
    timeout: 300000, // 5 minutes for large bulk uploads
  }),
};

// Enrollment APIs
export const enrollmentAPI = {
  autoEnrollStudent: (studentId) => api.post(`/enrollments/auto-enroll/${studentId}`, {}, {
    timeout: 60000 // 60 seconds for single student
  }),
  autoEnrollAllStudents: () => api.post('/enrollments/auto-enroll-all', {}, {
    timeout: 300000 // 5 minutes for all students
  }),
  autoEnrollElectives: () => api.post('/enrollments/auto-enroll-electives', {}, {
    timeout: 300000 // 5 minutes for electives
  }),
  getStudentEnrollments: (studentId) => api.get(`/enrollments/student/${studentId}`),
  getSubjectEnrollments: (subjectId) => api.get(`/enrollments/subject/${subjectId}`),
  getEnrollmentStats: (subjectId) => api.get(`/enrollments/stats/${subjectId}`),
  dropEnrollment: (id) => api.delete(`/enrollments/${id}`),
  clearSubjectEnrollments: (subjectId) => api.delete(`/enrollments/subject/${subjectId}/clear`),
  clearAllEnrollments: () => api.delete('/enrollments/clear-all', {
    timeout: 60000 // 60 seconds for clearing
  }),
};

// Dashboard APIs
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getExams: () => api.get('/dashboard/exams'),
  getActivity: () => api.get('/dashboard/activity'),
  getExamStats: () => api.get('/dashboard/exams'),
  getRecentActivities: () => api.get('/dashboard/activity'),
};

// Notification APIs
export const notificationAPI = {
  sendBulkEmail: (payload) => api.post('/notifications/email', payload, { timeout: 60000 }),
  sendTeacherDutyEmails: (payload) => api.post('/notifications/email/teacher-duties', payload, { timeout: 60000 }),
  getTeacherDutyPreview: (params = {}) => api.get('/notifications/email/teacher-duties/preview', { params }),
  sendStudentExamEmails: (payload) => api.post('/notifications/email/student-exams', payload, { timeout: 60000 }),
  sendStudentExamEmailsWithFiles: (formData) => api.post('/notifications/email/student-exams', formData, { 
    timeout: 60000,
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getStudentExamPreview: (params = {}) => api.get('/notifications/email/student-exams/preview', { params })
};

// User Management APIs
export const userAPI = {
  getUsers: (params = {}) => api.get('/users', { params }),
  getUser: (id) => api.get(`/users/${id}`),
  createUser: (userData) => api.post('/users', userData),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
  updateUserStatus: (id, status) => api.patch(`/users/${id}/status`, { isActive: status }),
  sendCredentials: (id) => api.post(`/users/${id}/send-credentials`),
  bulkDelete: (userIds) => api.delete('/users/bulk-delete', { data: { userIds } }),
  bulkStatusUpdate: (userIds, status) => api.patch('/users/bulk-status', { userIds, isActive: status }),
  bulkSendCredentials: (userIds) => api.post('/users/bulk-send-credentials', { userIds }),
};

export default api;
