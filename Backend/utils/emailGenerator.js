const crypto = require('crypto');

/**
 * Generate institute email ID for students
 * Format: firstname+lastname(first2chars)_ug_(batch_year-entry_year)@dept.nits.ac.in
 * Example: david+ch_ug_4@cse.nits.ac.in
 */
function generateStudentEmail (firstName, lastName, batchYear, departmentCode) {
  const cleanFirstName = String(firstName || '').toLowerCase().replace(/[^a-z]/g, '');
  const cleanLastName = String(lastName || '').toLowerCase().replace(/[^a-z]/g, '');
  const lastTwo = cleanLastName.slice(0, 2);
  const passoutYear = parseInt(String(batchYear), 10);
  const entryYear = isNaN(passoutYear) ? new Date().getFullYear() - 4 : passoutYear - 4;
  const yearDiff = passoutYear - entryYear;
  const dept = String(departmentCode || 'GEN').toLowerCase();
  return `${cleanFirstName}+${lastTwo}_ug_${yearDiff}@${dept}.nits.ac.in`;
}

/**
 * Generate institute email ID for teachers
 * Format: firstname+lastname(first2chars)@dept.nits.ac.in
 * Example: sarah+jo@cse.nits.ac.in
 */
function generateTeacherEmail (firstName, lastName, departmentCode) {
  // Clean and format names
  const cleanFirstName = String(firstName || '').toLowerCase().replace(/[^a-z]/g, '');
  const cleanLastName = String(lastName || '').toLowerCase().replace(/[^a-z]/g, '');
  const lastTwo = cleanLastName.slice(0, 2);

  // Generate email
  const email = `${cleanFirstName}+${lastTwo}@${departmentCode.toLowerCase()}.nits.ac.in`;

  return email;
}

/**
 * Generate employee ID for teachers
 * Format: DEPT + 4-digit number
 * Example: CSE2024, EEE2025
 */
function generateEmployeeId (departmentCode, joiningYear) {
  // Get current year or use joining year
  const year = joiningYear || new Date().getFullYear();

  // Generate a random 4-digit number
  const randomNum = Math.floor(1000 + Math.random() * 9000);

  return `${departmentCode.toUpperCase()}${year}${randomNum}`;
}

/**
 * Generate secure password
 * Format: 8-12 characters with mixed case, numbers, and symbols
 */
function generatePassword () {
  const length = 10;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';

  // Ensure at least one of each type
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // uppercase
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // lowercase
  password += '0123456789'[Math.floor(Math.random() * 10)]; // number
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // symbol

  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Generate scholar ID for students
 * Format: DEPT + Year + 3-digit number
 * Example: CSE2026001, EEE2026002
 */
function generateScholarId (departmentCode, batchYear) {
  // Deprecated: kept for backward compatibility (not used)
  const randomNum = Math.floor(100 + Math.random() * 900);
  return `${departmentCode.toUpperCase()}${batchYear}${randomNum}`;
}

// Department code to numeric mapping for scholarId format (deprecated - keeping for backward compatibility)
function mapDepartmentToNumeric (deptCode) {
  const code = String(deptCode || '').toUpperCase();
  switch (code) {
  case 'CSE': return 2;
  case 'CE': return 1;
  case 'EE': return 3;
  case 'ECE': return 4;
  case 'EI': return 5;
  case 'ME': return 6;
  default: return 0; // unknown
  }
}

/**
 * Generate new format scholar ID
 * Format: YY + 1 + DEPT + NNN (e.g., 221CS095)
 * Where: YY = entry year, 1 = UG level, DEPT = department code, NNN = roll number
 */
function generateNewScholarId (departmentCode, batchYear, sequenceNumber) {
  const passoutYear = parseInt(String(batchYear), 10);
  const entryYear = isNaN(passoutYear) ? new Date().getFullYear() - 4 : passoutYear - 4;
  const entryYearTwo = String(entryYear).slice(-2);
  const level = '1'; // UG
  // Convert 3-letter codes to 2-letter for scholar ID
  let deptCode = String(departmentCode || 'CS').toUpperCase();
  if (deptCode === 'CSE') deptCode = 'CS';
  if (deptCode === 'ECE') deptCode = 'EC';
  if (deptCode === 'EIE') deptCode = 'EI';
  if (deptCode === 'EI2') deptCode = 'EI';
  const rollNumber = String(sequenceNumber).padStart(3, '0');

  return `${entryYearTwo}${level}${deptCode}${rollNumber}`;
}

/**
 * Get department code from department name
 */
function getDepartmentCode (departmentName) {
  if (!departmentName) return 'CS';
  const normalized = String(departmentName).trim();
  const departmentMap = new Map([
    ['Civil Engineering', 'CE'],
    ['Civil', 'CE'],
    ['CE', 'CE'],
    ['Mechanical Engineering', 'ME'],
    ['Mechanical', 'ME'],
    ['ME', 'ME'],
    ['Electrical Engineering', 'EE'],
    ['Electrical', 'EE'],
    ['EE', 'EE'],
    ['Electronics and Communication Engineering', 'ECE'],
    ['Electronics and Communication', 'ECE'],
    ['ECE', 'ECE'],
    ['Computer Science and Engineering', 'CSE'],
    ['Computer Science', 'CSE'],
    ['CSE', 'CSE'],
    ['CS', 'CSE'],
    ['Electronics and Instrumentation Engineering', 'EI'],
    ['Electronics and Instrumentation', 'EI'],
    ['EIE', 'EI'],
    ['EI', 'EI'],
    ['EI2', 'EI'],
    ['Chemistry', 'CH'],
    ['CH', 'CH'],
    ['Physics', 'PH'],
    ['PH', 'PH'],
    ['Humanities and Social Sciences', 'HS'],
    ['Humanities & Social Sciences', 'HS'],
    ['HS', 'HS'],
    ['Mathematics', 'MA'],
    ['MA', 'MA'],
    ['Management Studies', 'MS'],
    ['MS', 'MS'],
    // Common alternates
    ['Computer Science Engineering', 'CSE'],
    ['Electronics & Communication', 'ECE'],
    ['Electronics & Instrumentation', 'EIE'],
  ]);

  return departmentMap.get(normalized) || 'CSE';
}

module.exports = {
  generateStudentEmail,
  generateTeacherEmail,
  generateEmployeeId,
  generatePassword,
  generateScholarId,
  generateNewScholarId,
  mapDepartmentToNumeric,
  getDepartmentCode,
};
