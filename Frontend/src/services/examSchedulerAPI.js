import api from './api';

// Exam Scheduler API functions
export const examSchedulerAPI = {
  // Get available subjects for scheduling
  getAvailableSubjects: (params = {}) => 
    api.get('/subjects/available', { params }),
  
  // Get available classrooms for scheduling
    getAvailableClassrooms: (params = {}) =>
    api.get('/classrooms/available', { params }),
  getAllClassroomsForAssignment: (params = {}) =>
    api.get('/classrooms/all-for-assignment', { params }),
  
  // Get available departments for scheduling
  getAvailableDepartments: (params = {}) => 
    api.get('/departments', { params }),
  
  // Get available teachers for invigilation
  getAvailableTeachers: (params = {}) => 
    api.get('/teachers/available', { params }),
  
  // Get available invigilators for exam scheduling
    getAvailableInvigilators: (params = {}) =>
    api.get('/teachers/invigilators', { params }),
  getAllTeachersForInvigilation: (params = {}) =>
    api.get('/teachers/all-for-invigilation', { params }),
  
  // Get students by department and semester
  getStudentsByDepartment: (departmentId, semester, params = {}) => 
    api.get(`/students/department/${departmentId}/semester/${semester}`, { params }),
  
  // Create exam schedule
  createExamSchedule: (scheduleData) => 
    api.post('/exams/schedule', scheduleData),
  
  // Validate exam schedule
  validateSchedule: (scheduleData) => 
    api.post('/exams/validate-schedule', scheduleData),
  
  // Get schedule conflicts
  getScheduleConflicts: (scheduleData) => 
    api.post('/exams/check-conflicts', scheduleData),
  
  // Auto-assign classrooms
  autoAssignClassrooms: (examData) => 
    api.post('/exams/auto-assign-classrooms', examData),
  
  // Auto-assign invigilators
  autoAssignInvigilators: (examData) => 
    api.post('/exams/auto-assign-invigilators', examData),
  
  // Generate seating arrangements
  generateSeatingArrangements: (examId) => 
    api.post(`/exams/${examId}/generate-seating`),
  
  // Get exam schedule template
  getScheduleTemplate: (examType) => 
    api.get(`/exams/template/${examType}`),
  
  // Save draft schedule
  saveDraftSchedule: (draftData) => 
    api.post('/exams/draft', draftData),
  
  // Get draft schedules
  getDraftSchedules: () => 
    api.get('/exams/drafts'),
  
  // Publish schedule
  publishSchedule: (examId) => 
    api.post(`/exams/${examId}/publish`),
  
  // Send notifications
  sendScheduleNotifications: (examId) => 
    api.post(`/exams/${examId}/notify`),
};

export default examSchedulerAPI; 