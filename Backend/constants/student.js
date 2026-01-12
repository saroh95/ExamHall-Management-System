// Student-related constants shared between frontend and backend

// Validation patterns
const VALIDATION_PATTERNS = {
  SCHOLAR_ID: /^[A-Z0-9]{3,10}$/,
  EMAIL: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
  CONTACT_NUMBER: /^[0-9]{10,15}$/,
  BATCH_YEAR: /^20\d{2}$/,
  SECTION: /^[A-Z]{1,2}$/,
};

// Field limits
const FIELD_LIMITS = {
  SCHOLAR_ID: { min: 3, max: 10 },
  FULL_NAME: { min: 2, max: 100 },
  ADDRESS: { max: 500 },
  PASSWORD: { min: 6 },
  CONTACT_NUMBER: { min: 10, max: 15 },
};

// Dropdown options
const SEMESTER_OPTIONS = [
  'Semester 1', 'Semester 2', 'Semester 3', 'Semester 4',
  'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8',
];

const SECTION_OPTIONS = ['A', 'B', 'C', 'D', 'E', 'F'];

const ACADEMIC_STATUS_OPTIONS = ['active', 'suspended', 'graduated', 'dropped'];

// Department mappings (aligned with shared constants)
const DEPARTMENT_OPTIONS = [
  { code: 'CE',  name: 'Civil Engineering',                           value: 'CE' },
  { code: 'ME',  name: 'Mechanical Engineering',                      value: 'ME' },
  { code: 'EE',  name: 'Electrical Engineering',                      value: 'EE' },
  { code: 'ECE', name: 'Electronics and Communication Engineering',   value: 'ECE' },
  { code: 'CSE', name: 'Computer Science and Engineering',            value: 'CSE' },
  { code: 'EI',  name: 'Electronics and Instrumentation Engineering', value: 'EI' },
  { code: 'CH',  name: 'Chemistry',                                   value: 'CH' },
  { code: 'PH',  name: 'Physics',                                     value: 'PH' },
  { code: 'HS',  name: 'Humanities and Social Sciences',              value: 'HS' },
  { code: 'MA',  name: 'Mathematics',                                 value: 'MA' },
  { code: 'MS',  name: 'Management Studies',                          value: 'MS' },
];

// File upload constants
const PHOTO_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif'],
  UPLOAD_PATH: 'uploads/profiles',
};

// Validation messages
const VALIDATION_MESSAGES = {
  SCHOLAR_ID: {
    REQUIRED: 'Scholar ID is required',
    INVALID: 'Scholar ID must be 3-10 uppercase alphanumeric characters',
    EXISTS: 'Student with this Scholar ID already exists',
  },
  FULL_NAME: {
    REQUIRED: 'Full name is required',
    TOO_LONG: 'Full name cannot exceed 100 characters',
  },
  EMAIL: {
    REQUIRED: 'Email is required',
    INVALID: 'Please enter a valid email address',
    EXISTS: 'Student with this email already exists',
  },
  CONTACT_NUMBER: {
    REQUIRED: 'Contact number is required',
    INVALID: 'Contact number must be 10-15 digits',
  },
  SEMESTER: {
    REQUIRED: 'Semester is required',
    INVALID: 'Please select a valid semester',
  },
  SECTION: {
    REQUIRED: 'Section is required',
    INVALID: 'Please select a valid section',
  },
  BATCH_YEAR: {
    REQUIRED: 'Batch year is required',
    INVALID: 'Batch year must be in format 20xx (e.g., 2024)',
  },
  DEPARTMENT: {
    REQUIRED: 'Department is required',
    INVALID: 'Please select a valid department',
  },
  ADDRESS: {
    REQUIRED: 'Address is required',
    TOO_LONG: 'Address cannot exceed 500 characters',
  },
  PHOTO: {
    INVALID_TYPE: 'Only JPEG, PNG, and GIF images are allowed',
    TOO_LARGE: 'Image must be less than 5MB',
    UPLOAD_ERROR: 'Error uploading photo',
  },
};

// Form field configurations
const FORM_FIELDS = {
  scholarId: {
    type: 'text',
    required: true,
    pattern: VALIDATION_PATTERNS.SCHOLAR_ID,
    maxLength: FIELD_LIMITS.SCHOLAR_ID.max,
    title: VALIDATION_MESSAGES.SCHOLAR_ID.INVALID,
  },
  fullName: {
    type: 'text',
    required: true,
    maxLength: FIELD_LIMITS.FULL_NAME.max,
  },
  personalEmail: {
    type: 'email',
    required: true,
    pattern: VALIDATION_PATTERNS.EMAIL,
    title: VALIDATION_MESSAGES.EMAIL.INVALID,
  },
  contactNumber: {
    type: 'tel',
    required: true,
    pattern: VALIDATION_PATTERNS.CONTACT_NUMBER,
    title: VALIDATION_MESSAGES.CONTACT_NUMBER.INVALID,
  },
  semester: {
    type: 'select',
    required: true,
    options: SEMESTER_OPTIONS,
  },
  section: {
    type: 'text',
    required: true,
    pattern: VALIDATION_PATTERNS.SECTION,
    maxLength: 2,
    title: VALIDATION_MESSAGES.SECTION.INVALID,
  },
  batchYear: {
    type: 'text',
    required: true,
    pattern: VALIDATION_PATTERNS.BATCH_YEAR,
    title: VALIDATION_MESSAGES.BATCH_YEAR.INVALID,
  },
  department: {
    type: 'select',
    required: true,
    options: DEPARTMENT_OPTIONS,
  },
  address: {
    type: 'textarea',
    required: true,
    maxLength: FIELD_LIMITS.ADDRESS.max,
  },
  photo: {
    type: 'file',
    accept: PHOTO_UPLOAD.ALLOWED_EXTENSIONS.join(','),
    maxSize: PHOTO_UPLOAD.MAX_SIZE,
  },
};

module.exports = {
  VALIDATION_PATTERNS,
  FIELD_LIMITS,
  SEMESTER_OPTIONS,
  SECTION_OPTIONS,
  ACADEMIC_STATUS_OPTIONS,
  DEPARTMENT_OPTIONS,
  PHOTO_UPLOAD,
  VALIDATION_MESSAGES,
  FORM_FIELDS,
};
