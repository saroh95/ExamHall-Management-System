// Student Registration Constants for Backend

// Registration Status
const REGISTRATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  INCOMPLETE: 'incomplete',
  VERIFIED: 'verified',
};

const REGISTRATION_STATUS_LABELS = {
  pending: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
  incomplete: 'Incomplete',
  verified: 'Verified',
};

// Academic Year and Batch Constants
const ACADEMIC_YEAR_OPTIONS = [
  '2024-2025',
  '2025-2026',
  '2026-2027',
  '2027-2028',
  '2028-2029',
];

const BATCH_YEAR_OPTIONS = [
  '2024',
  '2025',
  '2026',
  '2027',
  '2028',
];

const CURRENT_ACADEMIC_YEAR = '2024-2025';
const CURRENT_BATCH_YEAR = '2024';

// Student Category Constants
const STUDENT_CATEGORIES = {
  REGULAR: 'regular',
  INTERNATIONAL: 'international',
  TRANSFER: 'transfer',
  EXCHANGE: 'exchange',
  DIPLOMA: 'diploma',
};

const STUDENT_CATEGORY_LABELS = {
  regular: 'Regular Student',
  international: 'International Student',
  transfer: 'Transfer Student',
  exchange: 'Exchange Student',
  diploma: 'Diploma Student',
};

// Gender Constants
const GENDER_OPTIONS = [
  'male',
  'female',
  'other',
  'prefer_not_to_say',
];

const GENDER_LABELS = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
  prefer_not_to_say: 'Prefer not to say',
};

// Blood Group Constants
const BLOOD_GROUP_OPTIONS = [
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
];

// Guardian Relationship Constants
const GUARDIAN_RELATIONSHIPS = {
  FATHER: 'father',
  MOTHER: 'mother',
  GUARDIAN: 'guardian',
  SIBLING: 'sibling',
  OTHER: 'other',
};

const GUARDIAN_RELATIONSHIP_LABELS = {
  father: 'Father',
  mother: 'Mother',
  guardian: 'Guardian',
  sibling: 'Sibling',
  other: 'Other',
};

// Document Type Constants
const REQUIRED_DOCUMENTS = {
  PHOTO: 'photo',
  ID_PROOF: 'id_proof',
  ADDRESS_PROOF: 'address_proof',
  BIRTH_CERTIFICATE: 'birth_certificate',
  PREVIOUS_MARKSHEET: 'previous_marksheet',
  TRANSFER_CERTIFICATE: 'transfer_certificate',
  CHARACTER_CERTIFICATE: 'character_certificate',
  INCOME_CERTIFICATE: 'income_certificate',
  CASTE_CERTIFICATE: 'caste_certificate',
  DISABILITY_CERTIFICATE: 'disability_certificate',
};

const DOCUMENT_LABELS = {
  photo: 'Passport Size Photo',
  id_proof: 'ID Proof (Aadhar/PAN)',
  address_proof: 'Address Proof',
  birth_certificate: 'Birth Certificate',
  previous_marksheet: 'Previous Marksheet',
  transfer_certificate: 'Transfer Certificate',
  character_certificate: 'Character Certificate',
  income_certificate: 'Income Certificate',
  caste_certificate: 'Caste Certificate',
  disability_certificate: 'Disability Certificate',
};

// Registration Validation Patterns
const REGISTRATION_VALIDATION_PATTERNS = {
  SCHOLAR_ID: /^[A-Z0-9]{3,10}$/,
  FULL_NAME: /^[A-Za-z\s\-'\.]{2,100}$/,
  EMAIL: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
  PHONE: /^[0-9]{10,15}$/,
  AADHAR: /^[0-9]{12}$/,
  PAN: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
  DATE_OF_BIRTH: /^\d{4}-\d{2}-\d{2}$/,
  PINCODE: /^[0-9]{6}$/,
  GUARDIAN_PHONE: /^[0-9]{10,15}$/,
  EMERGENCY_CONTACT: /^[0-9]{10,15}$/,
};

// Registration Field Limits
const REGISTRATION_FIELD_LIMITS = {
  SCHOLAR_ID: { min: 3, max: 10 },
  FULL_NAME: { min: 2, max: 100 },
  FATHER_NAME: { min: 2, max: 100 },
  MOTHER_NAME: { min: 2, max: 100 },
  GUARDIAN_NAME: { min: 2, max: 100 },
  ADDRESS: { min: 10, max: 500 },
  CITY: { min: 2, max: 50 },
  STATE: { min: 2, max: 50 },
  EMAIL: { max: 255 },
  PHONE: { min: 10, max: 15 },
  AADHAR: { exact: 12 },
  PAN: { exact: 10 },
  PINCODE: { exact: 6 },
  GUARDIAN_PHONE: { min: 10, max: 15 },
  EMERGENCY_CONTACT: { min: 10, max: 15 },
};

// Registration Validation Messages
const REGISTRATION_VALIDATION_MESSAGES = {
  SCHOLAR_ID: {
    REQUIRED: 'Scholar ID is required',
    INVALID: 'Scholar ID must be 3-10 uppercase alphanumeric characters',
    EXISTS: 'Student with this Scholar ID already exists',
    MIN_LENGTH: 'Scholar ID must be at least 3 characters',
    MAX_LENGTH: 'Scholar ID cannot exceed 10 characters',
  },
  FULL_NAME: {
    REQUIRED: 'Full name is required',
    INVALID: 'Full name can only contain letters, spaces, hyphens, and apostrophes',
    MIN_LENGTH: 'Full name must be at least 2 characters',
    MAX_LENGTH: 'Full name cannot exceed 100 characters',
  },
  EMAIL: {
    REQUIRED: 'Email address is required',
    INVALID: 'Please enter a valid email address',
    EXISTS: 'Student with this email already exists',
  },
  PHONE: {
    REQUIRED: 'Phone number is required',
    INVALID: 'Phone number must be 10-15 digits',
    MIN_LENGTH: 'Phone number must be at least 10 digits',
    MAX_LENGTH: 'Phone number cannot exceed 15 digits',
  },
  DATE_OF_BIRTH: {
    REQUIRED: 'Date of birth is required',
    INVALID: 'Please enter a valid date of birth',
    MIN_AGE: 'Student must be at least 15 years old',
    MAX_AGE: 'Student cannot be older than 30 years',
  },
  AADHAR: {
    REQUIRED: 'Aadhar number is required',
    INVALID: 'Aadhar number must be exactly 12 digits',
    EXISTS: 'Student with this Aadhar number already exists',
  },
  PAN: {
    REQUIRED: 'PAN number is required',
    INVALID: 'PAN number must be in format: ABCDE1234F',
    EXISTS: 'Student with this PAN number already exists',
  },
  ADDRESS: {
    REQUIRED: 'Address is required',
    MIN_LENGTH: 'Address must be at least 10 characters',
    MAX_LENGTH: 'Address cannot exceed 500 characters',
  },
  PINCODE: {
    REQUIRED: 'Pincode is required',
    INVALID: 'Pincode must be exactly 6 digits',
  },
  GUARDIAN_PHONE: {
    REQUIRED: 'Guardian phone number is required',
    INVALID: 'Guardian phone number must be 10-15 digits',
  },
  EMERGENCY_CONTACT: {
    REQUIRED: 'Emergency contact number is required',
    INVALID: 'Emergency contact must be 10-15 digits',
  },
  DOCUMENTS: {
    REQUIRED: 'All required documents must be uploaded',
    INVALID_TYPE: 'Invalid file type. Only PDF, JPG, PNG files are allowed',
    TOO_LARGE: 'File size must be less than 5MB',
    UPLOAD_ERROR: 'Error uploading document',
  },
};

// Default Registration Form Data
const DEFAULT_REGISTRATION_FORM = {
  scholarId: '',
  fullName: '',
  dateOfBirth: '',
  gender: '',
  bloodGroup: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  department: '',
  semester: 'Semester 1',
  section: 'A',
  batchYear: CURRENT_BATCH_YEAR,
  academicYear: CURRENT_ACADEMIC_YEAR,
  studentCategory: STUDENT_CATEGORIES.REGULAR,
  guardianName: '',
  guardianRelationship: GUARDIAN_RELATIONSHIPS.FATHER,
  guardianPhone: '',
  emergencyContact: '',
  documents: [],
  status: REGISTRATION_STATUS.PENDING,
};

// Helper Functions
const calculateAge = (dateOfBirth) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
};

const validateAge = (dateOfBirth, minAge = 15, maxAge = 30) => {
  const age = calculateAge(dateOfBirth);
  return age >= minAge && age <= maxAge;
};

const generateScholarId = (department, batchYear, sequence) => {
  const deptCode = department.substring(0, 3).toUpperCase();
  const yearCode = batchYear.substring(2, 4);
  const seqCode = sequence.toString().padStart(3, '0');
  return `${deptCode}${yearCode}${seqCode}`;
};

const getRegistrationStatusLabel = (status) => {
  return REGISTRATION_STATUS_LABELS[status] || 'Unknown';
};

const getStudentCategoryLabel = (category) => {
  return STUDENT_CATEGORY_LABELS[category] || 'Unknown';
};

module.exports = {
  REGISTRATION_STATUS,
  REGISTRATION_STATUS_LABELS,
  ACADEMIC_YEAR_OPTIONS,
  BATCH_YEAR_OPTIONS,
  CURRENT_ACADEMIC_YEAR,
  CURRENT_BATCH_YEAR,
  STUDENT_CATEGORIES,
  STUDENT_CATEGORY_LABELS,
  GENDER_OPTIONS,
  GENDER_LABELS,
  BLOOD_GROUP_OPTIONS,
  GUARDIAN_RELATIONSHIPS,
  GUARDIAN_RELATIONSHIP_LABELS,
  REQUIRED_DOCUMENTS,
  DOCUMENT_LABELS,
  REGISTRATION_VALIDATION_PATTERNS,
  REGISTRATION_FIELD_LIMITS,
  REGISTRATION_VALIDATION_MESSAGES,
  DEFAULT_REGISTRATION_FORM,
  calculateAge,
  validateAge,
  generateScholarId,
  getRegistrationStatusLabel,
  getStudentCategoryLabel,
};
