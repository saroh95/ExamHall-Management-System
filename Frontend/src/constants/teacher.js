// Teacher-related constants for frontend (synced with backend)

// Validation patterns
export const VALIDATION_PATTERNS = {
  EMPLOYEE_ID: /^[A-Z0-9]{3,10}$/,
  EMAIL: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
  PHONE: /^[0-9]{10,15}$/,
  QUALIFICATION: /^[A-Za-z\s.,()]{2,100}$/
};

// Field limits
export const FIELD_LIMITS = {
  EMPLOYEE_ID: { min: 3, max: 10 },
  FULL_NAME: { min: 2, max: 100 },
  QUALIFICATION: { min: 2, max: 100 },
  ADDRESS: { max: 500 },
  PHONE: { min: 10, max: 15 },
  SPECIALIZATION: { max: 200 }
};

// Teacher designation options
export const DESIGNATION_OPTIONS = [
  'Professor',
  'Associate Professor', 
  'Assistant Professor',
  'Lecturer',
  'Teaching Assistant'
];

// Teacher status options
export const TEACHER_STATUS_OPTIONS = [
  'active',
  'inactive', 
  'on_leave',
  'retired',
  'suspended'
];

// Academic qualification options
export const QUALIFICATION_OPTIONS = [
  'PhD',
  'M.Tech',
  'M.Sc',
  'M.A',
  'M.Com',
  'MBA',
  'B.Tech',
  'B.Sc',
  'B.A',
  'B.Com',
  'Diploma',
  'Other'
];

// Department mappings (should match department constants)
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
  EMPLOYEE_ID: {
    REQUIRED: 'Employee ID is required',
    INVALID: 'Employee ID must be 3-10 uppercase alphanumeric characters',
    EXISTS: 'Teacher with this Employee ID already exists'
  },
  FULL_NAME: {
    REQUIRED: 'Full name is required',
    TOO_LONG: 'Full name cannot exceed 100 characters'
  },
  EMAIL: {
    REQUIRED: 'Email is required',
    INVALID: 'Please enter a valid email address',
    EXISTS: 'Teacher with this email already exists'
  },
  PERSONAL_EMAIL: {
    REQUIRED: 'Personal email is required',
    INVALID: 'Please enter a valid personal email address',
    EXISTS: 'Teacher with this personal email already exists'
  },
  PHONE: {
    REQUIRED: 'Phone number is required',
    INVALID: 'Phone number must be 10-15 digits'
  },
  DESIGNATION: {
    REQUIRED: 'Designation is required',
    INVALID: 'Please select a valid designation'
  },
  QUALIFICATION: {
    REQUIRED: 'Qualification is required',
    INVALID: 'Please enter a valid qualification'
  },
  DEPARTMENT: {
    REQUIRED: 'Department is required',
    INVALID: 'Please select a valid department'
  },
  ADDRESS: {
    REQUIRED: 'Address is required',
    TOO_LONG: 'Address cannot exceed 500 characters'
  },
  JOINING_DATE: {
    REQUIRED: 'Joining date is required',
    INVALID: 'Please enter a valid joining date'
  },
  PHOTO: {
    INVALID_TYPE: 'Only JPEG, PNG, and GIF images are allowed',
    TOO_LARGE: 'Image must be less than 5MB',
    UPLOAD_ERROR: 'Error uploading photo'
  }
};

// Form field configurations
export const FORM_FIELDS = {
  employeeId: {
    type: 'text',
    required: true,
    pattern: VALIDATION_PATTERNS.EMPLOYEE_ID.source,
    maxLength: FIELD_LIMITS.EMPLOYEE_ID.max,
    title: VALIDATION_MESSAGES.EMPLOYEE_ID.INVALID
  },
  fullName: {
    type: 'text',
    required: true,
    maxLength: FIELD_LIMITS.FULL_NAME.max
  },
  email: {
    type: 'email',
    required: true,
    pattern: VALIDATION_PATTERNS.EMAIL.source,
    title: VALIDATION_MESSAGES.EMAIL.INVALID
  },
  personalEmail: {
    type: 'email',
    required: true,
    pattern: VALIDATION_PATTERNS.EMAIL.source,
    title: VALIDATION_MESSAGES.PERSONAL_EMAIL.INVALID
  },
  phone: {
    type: 'tel',
    required: true,
    pattern: VALIDATION_PATTERNS.PHONE.source,
    title: VALIDATION_MESSAGES.PHONE.INVALID
  },
  designation: {
    type: 'select',
    required: true,
    options: DESIGNATION_OPTIONS
  },
  qualification: {
    type: 'text',
    required: true,
    maxLength: FIELD_LIMITS.QUALIFICATION.max
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
  joiningDate: {
    type: 'date',
    required: true
  },
  photo: {
    type: 'file',
    accept: PHOTO_UPLOAD.ACCEPT_STRING,
    maxSize: PHOTO_UPLOAD.MAX_SIZE
  }
};

// Default form data
export const DEFAULT_TEACHER_FORM = {
  employeeId: '',
  fullName: '',
  email: '',
  personalEmail: '',
  phone: '',
  designation: 'Assistant Professor',
  qualification: '',
  specialization: '',
  department: '',
  address: '',
  joiningDate: '',
  photo: '',
  isActive: true,
  isInvigilator: false
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