// Student-related constants for frontend (synced with backend)

// Validation patterns
export const VALIDATION_PATTERNS = {
  SCHOLAR_ID: /^[A-Z0-9]{3,10}$/,
  EMAIL: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
  CONTACT_NUMBER: /^[0-9]{10,15}$/,
  BATCH_YEAR: /^20\d{2}$/,
  SECTION: /^[A-Z]{1,2}$/
};

// Field limits
export const FIELD_LIMITS = {
  SCHOLAR_ID: { min: 3, max: 10 },
  FULL_NAME: { min: 2, max: 100 },
  ADDRESS: { max: 500 },
  PASSWORD: { min: 6 },
  CONTACT_NUMBER: { min: 10, max: 15 }
};

// Dropdown options
export const SEMESTER_OPTIONS = [
  'Semester 1', 'Semester 2', 'Semester 3', 'Semester 4',
  'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'
];

export const SECTION_OPTIONS = ['A', 'B', 'C', 'D', 'E', 'F'];

export const ACADEMIC_STATUS_OPTIONS = ['active', 'suspended', 'graduated', 'dropped'];

// Department mappings
export const DEPARTMENT_OPTIONS = [
  { code: 'CE',  name: 'Civil Engineering',                           value: 'CE',  label: 'Civil Engineering (CE)' },
  { code: 'ME',  name: 'Mechanical Engineering',                      value: 'ME',  label: 'Mechanical Engineering (ME)' },
  { code: 'EE',  name: 'Electrical Engineering',                      value: 'EE',  label: 'Electrical Engineering (EE)' },
  { code: 'ECE', name: 'Electronics and Communication Engineering',   value: 'ECE', label: 'Electronics and Communication Engineering (ECE)' },
  { code: 'CSE', name: 'Computer Science and Engineering',            value: 'CSE', label: 'Computer Science and Engineering (CSE)' },
  { code: 'EI',  name: 'Electronics and Instrumentation Engineering', value: 'EI',  label: 'Electronics and Instrumentation Engineering (EI)' },
  { code: 'CH',  name: 'Chemistry',                                   value: 'CH',  label: 'Chemistry (CH)' },
  { code: 'PH',  name: 'Physics',                                     value: 'PH',  label: 'Physics (PH)' },
  { code: 'HS',  name: 'Humanities and Social Sciences',              value: 'HS',  label: 'Humanities and Social Sciences (HS/HU)' },
  { code: 'MA',  name: 'Mathematics',                                 value: 'MA',  label: 'Mathematics (MA)' },
  { code: 'MS',  name: 'Management Studies',                          value: 'MS',  label: 'Management Studies (MS)' }
];

// File upload constants
export const PHOTO_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif'],
  ACCEPT_STRING: '.jpg,.jpeg,.png,.gif'
};

// Validation messages
export const VALIDATION_MESSAGES = {
  SCHOLAR_ID: {
    REQUIRED: 'Scholar ID is required',
    INVALID: 'Scholar ID must be 3-10 uppercase alphanumeric characters',
    EXISTS: 'Student with this Scholar ID already exists'
  },
  FULL_NAME: {
    REQUIRED: 'Full name is required',
    TOO_LONG: 'Full name cannot exceed 100 characters'
  },
  EMAIL: {
    REQUIRED: 'Email is required',
    INVALID: 'Please enter a valid email address',
    EXISTS: 'Student with this email already exists'
  },
  CONTACT_NUMBER: {
    REQUIRED: 'Contact number is required',
    INVALID: 'Contact number must be 10-15 digits'
  },
  SEMESTER: {
    REQUIRED: 'Semester is required',
    INVALID: 'Please select a valid semester'
  },
  SECTION: {
    REQUIRED: 'Section is required',
    INVALID: 'Please select a valid section'
  },
  BATCH_YEAR: {
    REQUIRED: 'Batch year is required',
    INVALID: 'Batch year must be in format 20xx (e.g., 2024)'
  },
  DEPARTMENT: {
    REQUIRED: 'Department is required',
    INVALID: 'Please select a valid department'
  },
  ADDRESS: {
    REQUIRED: 'Address is required',
    TOO_LONG: 'Address cannot exceed 500 characters'
  },
  PHOTO: {
    INVALID_TYPE: 'Only JPEG, PNG, and GIF images are allowed',
    TOO_LARGE: 'Image must be less than 5MB',
    UPLOAD_ERROR: 'Error uploading photo'
  }
};

// Form field configurations
export const FORM_FIELDS = {
  fullName: {
    type: 'text',
    required: true,
    maxLength: FIELD_LIMITS.FULL_NAME.max
  },
  personalEmail: {
    type: 'email',
    required: true,
    pattern: VALIDATION_PATTERNS.EMAIL.source,
    title: VALIDATION_MESSAGES.EMAIL.INVALID
  },
  contactNumber: {
    type: 'tel',
    required: true,
    pattern: VALIDATION_PATTERNS.CONTACT_NUMBER.source,
    title: VALIDATION_MESSAGES.CONTACT_NUMBER.INVALID
  },
  semester: {
    type: 'select',
    required: true,
    options: SEMESTER_OPTIONS
  },
  section: {
    type: 'text',
    required: true,
    pattern: VALIDATION_PATTERNS.SECTION.source,
    maxLength: 2,
    title: VALIDATION_MESSAGES.SECTION.INVALID
  },
  batchYear: {
    type: 'text',
    required: true,
    pattern: VALIDATION_PATTERNS.BATCH_YEAR.source,
    title: VALIDATION_MESSAGES.BATCH_YEAR.INVALID
  },
  department: {
    type: 'select',
    required: true,
    options: DEPARTMENT_OPTIONS
  },
  address: {
    type: 'textarea',
    required: true,
    maxLength: FIELD_LIMITS.ADDRESS.max
  },
  photo: {
    type: 'file',
    accept: PHOTO_UPLOAD.ACCEPT_STRING,
    maxSize: PHOTO_UPLOAD.MAX_SIZE
  }
};

// Default form data
export const DEFAULT_STUDENT_FORM = {
  fullName: '',
  personalEmail: '',
  contactNumber: '',
  semester: 'Semester 1',
  section: 'A',
  batchYear: new Date().getFullYear().toString(),
  department: 'CSE',
  address: '',
  photo: ''
};

// Helper functions
export const validateFile = (file) => {
  const errors = [];
  
  if (!file) return errors;
  
  // Check file type
  if (!PHOTO_UPLOAD.ALLOWED_TYPES.includes(file.type)) {
    errors.push(VALIDATION_MESSAGES.PHOTO.INVALID_TYPE);
  }
  
  // Check file size
  if (file.size > PHOTO_UPLOAD.MAX_SIZE) {
    errors.push(VALIDATION_MESSAGES.PHOTO.TOO_LARGE);
  }
  
  return errors;
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};