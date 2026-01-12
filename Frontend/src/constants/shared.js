// Shared constants that should be identical between frontend and backend

// Common validation patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
  PHONE: /^[0-9]{10,15}$/,
  ALPHA_NUMERIC: /^[A-Z0-9]+$/,
  YEAR: /^20\d{2}$/
};

// User roles (consistent across the system)
export const USER_ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student'
};

// Common status options
export const STATUS_OPTIONS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  PENDING: 'pending'
};

// Academic year and semester options
export const SEMESTER_OPTIONS = [
  'Semester 1', 'Semester 2', 'Semester 3', 'Semester 4',
  'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'
];

export const SECTION_OPTIONS = ['A', 'B', 'C', 'D', 'E', 'F'];

// Department mappings (master list)
export const DEPARTMENT_OPTIONS = [
  { code: 'CE',  name: 'Civil Engineering',                           shortName: 'Civil',                         value: 'CE',  label: 'Civil Engineering (CE)' },
  { code: 'ME',  name: 'Mechanical Engineering',                      shortName: 'Mechanical',                    value: 'ME',  label: 'Mechanical Engineering (ME)' },
  { code: 'EE',  name: 'Electrical Engineering',                      shortName: 'Electrical',                    value: 'EE',  label: 'Electrical Engineering (EE)' },
  { code: 'ECE', name: 'Electronics and Communication Engineering',   shortName: 'Electronics & Communication',   value: 'ECE', label: 'Electronics and Communication Engineering (ECE)' },
  { code: 'CSE', name: 'Computer Science and Engineering',            shortName: 'Computer Science',              value: 'CSE', label: 'Computer Science and Engineering (CSE)' },
  { code: 'EI',  name: 'Electronics and Instrumentation Engineering', shortName: 'Electronics & Instrumentation', value: 'EI',  label: 'Electronics and Instrumentation Engineering (EI)' },
  { code: 'CH',  name: 'Chemistry',                                   shortName: 'Chemistry',                     value: 'CH',  label: 'Chemistry (CH)' },
  { code: 'PH',  name: 'Physics',                                     shortName: 'Physics',                       value: 'PH',  label: 'Physics (PH)' },
  { code: 'HS',  name: 'Humanities and Social Sciences',              shortName: 'Humanities & Social Sciences',  value: 'HS',  label: 'Humanities and Social Sciences (HS/HU)' },
  { code: 'MA',  name: 'Mathematics',                                 shortName: 'Mathematics',                   value: 'MA',  label: 'Mathematics (MA)' },
  { code: 'MS',  name: 'Management Studies',                          shortName: 'Management Studies',            value: 'MS',  label: 'Management Studies (MS)' }
];

// File upload constants
export const UPLOAD_CONSTANTS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ALLOWED_CSV_TYPES: ['text/csv', 'application/csv'],
  IMAGE_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif'],
  ACCEPT_STRING: '.jpg,.jpeg,.png,.gif'
};

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
};

// Common field limits
export const FIELD_LIMITS = {
  NAME: { min: 2, max: 100 },
  EMAIL: { max: 255 },
  PHONE: { min: 10, max: 15 },
  ADDRESS: { max: 500 },
  DESCRIPTION: { max: 1000 },
  CODE: { min: 2, max: 10 }
};

// Exam related constants
export const EXAM_STATUS = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const EXAM_TYPES = [
  'Mid-term',
  'End-term', 
  'Surprise Test',
  'Assignment',
  'Viva',
  'Practical',
  'Project'
];

// Classroom related constants
export const CLASSROOM_STATUS = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  MAINTENANCE: 'maintenance'
};

export const CLASSROOM_TYPES = [
  'Lecture Hall',
  'Laboratory',
  'Tutorial Room',
  'Seminar Hall',
  'Conference Room',
  'Auditorium'
];

// Helper functions
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const validateFile = (file, allowedTypes = UPLOAD_CONSTANTS.ALLOWED_IMAGE_TYPES, maxSize = UPLOAD_CONSTANTS.MAX_FILE_SIZE) => {
  const errors = [];
  
  if (!file) return errors;
  
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    errors.push('Invalid file type. Only images are allowed.');
  }
  
  // Check file size
  if (file.size > maxSize) {
    errors.push(`File too large. Maximum size is ${formatFileSize(maxSize)}.`);
  }
  
  return errors;
};