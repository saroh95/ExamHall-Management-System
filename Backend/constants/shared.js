// Shared constants that should be identical between frontend and backend

// Common validation patterns
const VALIDATION_PATTERNS = {
  EMAIL: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
  PHONE: /^[0-9]{10,15}$/,
  ALPHA_NUMERIC: /^[A-Z0-9]+$/,
  YEAR: /^20\d{2}$/,
};

// User roles (consistent across the system)
const USER_ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
};

// Common status options
const STATUS_OPTIONS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  PENDING: 'pending',
};

// Academic year and semester options
const SEMESTER_OPTIONS = [
  'Semester 1', 'Semester 2', 'Semester 3', 'Semester 4',
  'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8',
];

const SECTION_OPTIONS = ['A', 'B', 'C', 'D', 'E', 'F'];

// Department mappings (master list)
// Aligned with requested departments and codes (with common abbreviations)
const DEPARTMENT_OPTIONS = [
  { code: 'CE',  name: 'Civil Engineering',                            shortName: 'Civil',                         value: 'CE' },
  { code: 'ME',  name: 'Mechanical Engineering',                       shortName: 'Mechanical',                    value: 'ME' },
  { code: 'EE',  name: 'Electrical Engineering',                       shortName: 'Electrical',                    value: 'EE' },
  { code: 'ECE', name: 'Electronics and Communication Engineering',    shortName: 'Electronics & Communication',   value: 'ECE' },
  { code: 'CSE', name: 'Computer Science and Engineering',             shortName: 'Computer Science',              value: 'CSE' },
  { code: 'EI',  name: 'Electronics and Instrumentation Engineering',  shortName: 'Electronics & Instrumentation', value: 'EI' },
  { code: 'CH',  name: 'Chemistry',                                    shortName: 'Chemistry',                     value: 'CH' },
  { code: 'PH',  name: 'Physics',                                      shortName: 'Physics',                       value: 'PH' },
  { code: 'HS',  name: 'Humanities and Social Sciences',               shortName: 'Humanities & Social Sciences',  value: 'HS' },
  { code: 'MA',  name: 'Mathematics',                                  shortName: 'Mathematics',                   value: 'MA' },
  { code: 'MS',  name: 'Management Studies',                           shortName: 'Management Studies',            value: 'MS' },
];

// File upload constants
const UPLOAD_CONSTANTS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ALLOWED_CSV_TYPES: ['text/csv', 'application/csv'],
  IMAGE_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif'],
};

// Pagination defaults
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

// Common field limits
const FIELD_LIMITS = {
  NAME: { min: 2, max: 100 },
  EMAIL: { max: 255 },
  PHONE: { min: 10, max: 15 },
  ADDRESS: { max: 500 },
  DESCRIPTION: { max: 1000 },
  CODE: { min: 2, max: 10 },
};

// Exam related constants
const EXAM_STATUS = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

const EXAM_TYPES = [
  'Mid-term',
  'End-term',
  'Surprise Test',
  'Assignment',
  'Viva',
  'Practical',
  'Project',
];

// Classroom related constants
const CLASSROOM_STATUS = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  MAINTENANCE: 'maintenance',
};

const CLASSROOM_TYPES = [
  'Lecture Hall',
  'Laboratory',
  'Tutorial Room',
  'Seminar Hall',
  'Conference Room',
  'Auditorium',
];

module.exports = {
  VALIDATION_PATTERNS,
  USER_ROLES,
  STATUS_OPTIONS,
  SEMESTER_OPTIONS,
  SECTION_OPTIONS,
  DEPARTMENT_OPTIONS,
  UPLOAD_CONSTANTS,
  PAGINATION,
  FIELD_LIMITS,
  EXAM_STATUS,
  EXAM_TYPES,
  CLASSROOM_STATUS,
  CLASSROOM_TYPES,
};
