// Utility helpers for normalizing CSV headers and values for bulk uploads

function toKey (raw) {
  if (!raw) return '';
  return String(raw).trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
}

// Teachers: map various header variants to expected camelCase keys
function normalizeTeacherHeader (header) {
  const key = toKey(header);
  const map = {
    fullname: 'fullName',
    name: 'fullName',
    personalemail: 'personalEmail',
    personalmail: 'personalEmail',
    email: 'email', // kept as-is; later we fallback to personalEmail if missing
    phone: 'phone',
    phonenumber: 'phone',
    contact: 'phone',
    contactnumber: 'phone',
    mobile: 'phone',
    department: 'department',
    dept: 'department',
    departmentname: 'department',
    departmentcode: 'department',
    address: 'address',
    designation: 'designation',
    qualification: 'qualification',
    specialization: 'specialization',
    joiningdate: 'joiningDate',
    dateofjoining: 'joiningDate',
    doj: 'joiningDate',
    password: 'password',
  };
  return map[key] || header; // fallback to original if unknown
}

// Classrooms: map export-style TitleCase headers to expected keys
function normalizeClassroomHeader (header) {
  const key = toKey(header);
  const map = {
    name: 'name',
    roomnumber: 'roomNumber',
    roomnum: 'roomNumber',
    building: 'building',
    capacity: 'capacity',
    floor: 'floor',
    type: 'type',
    facilities: 'facilities',
    isavailable: 'isAvailable',
    description: 'description',
  };
  return map[key] || header;
}

function trimRowValues (row) {
  const out = {};
  for (const [k, v] of Object.entries(row || {})) {
    if (typeof v === 'string') out[k] = v.trim();
    else out[k] = v;
  }
  return out;
}

function parseFlexibleDate (value) {
  if (!value) return value;
  const str = String(value).trim();
  // Try ISO/native first
  const native = new Date(str);
  if (!isNaN(native.getTime())) return native.toISOString();
  // Support dd/mm/yyyy
  const m = str.match(/^([0-3]?\d)[\/\-]([0-1]?\d)[\/\-](\d{4})$/);
  if (m) {
    const [_, d, mo, y] = m;
    const iso = new Date(parseInt(y, 10), parseInt(mo, 10) - 1, parseInt(d, 10));
    if (!isNaN(iso.getTime())) return iso.toISOString();
  }
  return value; // fallback
}

module.exports = {
  normalizeTeacherHeader,
  normalizeClassroomHeader,
  trimRowValues,
  parseFlexibleDate,
};

// Add designation normalization to map variants to allowed values
function normalizeDesignation (value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return raw;
  const map = new Map([
    // Assistant Professor variants
    ['assistant professor', 'Assistant Professor'],
    ['asst professor', 'Assistant Professor'],
    ['asst. professor', 'Assistant Professor'],
    ['assistant prof', 'Assistant Professor'],
    ['asst prof', 'Assistant Professor'],
    ['asst. prof.', 'Assistant Professor'],
    ['assistant professor (sr. scale)', 'Assistant Professor'],
    ['assistant professor (senior scale)', 'Assistant Professor'],
    ['assistant lecturer', 'Assistant Professor'],
    // Associate Professor variants
    ['associate professor', 'Associate Professor'],
    ['assoc professor', 'Associate Professor'],
    ['assoc. professor', 'Associate Professor'],
    ['reader', 'Associate Professor'],
    // Professor variants
    ['professor', 'Professor'],
    ['prof', 'Professor'],
    ['hod', 'Professor'], // map Head to Professor
    ['head of department', 'Professor'],
    // Lecturer variants
    ['lecturer', 'Lecturer'],
    ['sr lecturer', 'Lecturer'],
    ['senior lecturer', 'Lecturer'],
    // Teaching Assistant variants
    ['teaching assistant', 'Teaching Assistant'],
    ['teaching asst', 'Teaching Assistant'],
    ['ta', 'Teaching Assistant'],
  ]);
  if (map.has(raw)) return map.get(raw);
  // Title-case simple matches if it's already one of the allowed terms in different casing
  const candidates = ['professor','associate professor','assistant professor','lecturer','teaching assistant'];
  if (candidates.includes(raw)) {
    return raw.split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
  }
  return value; // fallback
}

module.exports.normalizeDesignation = normalizeDesignation;

// Students: map various header variants to expected camelCase keys
function normalizeStudentHeader (header) {
  const key = toKey(header);
  const map = {
    scholarid: 'scholarId',
    id: 'scholarId',
    roll: 'scholarId',
    rollno: 'scholarId',
    fullname: 'fullName',
    name: 'fullName',
    personalemail: 'personalEmail',
    email: 'email',
    contactnumber: 'contactNumber',
    contact: 'contactNumber',
    phone: 'contactNumber',
    department: 'department',
    dept: 'department',
    departmentname: 'department',
    departmentcode: 'department',
    address: 'address',
    semester: 'semester',
    sem: 'semester',
    section: 'section',
    batch: 'batchYear',
    batchyear: 'batchYear',
    password: 'password',
  };
  return map[key] || header;
}

function normalizeSemester (value) {
  if (!value && value !== 0) return value;
  const raw = String(value).trim();
  if (/^[1-8]$/.test(raw)) return `Semester ${raw}`;
  const m = raw.match(/^semester\s*([1-8])$/i);
  if (m) return `Semester ${m[1]}`;
  return raw;
}

function normalizeSection (value) {
  if (!value) return value;
  const raw = String(value).trim().toUpperCase();
  const valid = ['A','B','C','D','E','F'];
  return valid.includes(raw) ? raw : raw.charAt(0);
}

module.exports.normalizeStudentHeader = normalizeStudentHeader;
module.exports.normalizeSemester = normalizeSemester;
module.exports.normalizeSection = normalizeSection;

// Subjects: map various header variants to expected keys
function normalizeSubjectHeader (header) {
  const key = toKey(header);
  const map = {
    code: 'code',
    subjectcode: 'code',
    name: 'name',
    subjectname: 'name',
    department: 'department',
    dept: 'department',
    departmentname: 'department',
    semester: 'semesterId',
    semesterid: 'semesterId',
    sem: 'semesterId',
    type: 'type',
    subjecttype: 'type',
    credits: 'credits',
    credit: 'credits',
    theoryhours: 'theoryHours',
    practicalhours: 'practicalHours',
    tutorialhours: 'tutorialHours',
    totalhours: 'totalHours',
    description: 'description',
  };
  return map[key] || header;
}

function normalizeSubjectType (value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return raw;
  const map = new Map([
    ['regular', 'regular'],
    ['core', 'core_elective'],
    ['core elective', 'core_elective'],
    ['core_elective', 'core_elective'],
    ['open', 'open_elective'],
    ['open elective', 'open_elective'],
    ['open_elective', 'open_elective'],
  ]);
  return map.get(raw) || 'regular';
}

module.exports.normalizeSubjectHeader = normalizeSubjectHeader;
module.exports.normalizeSubjectType = normalizeSubjectType;

// Classrooms: normalize type variants
function normalizeClassroomType (value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return raw;
  const map = new Map([
    ['lecture', 'lecture'],
    ['lecture hall', 'lecture'],
    ['lecture hal', 'lecture'],
    ['lecturehall', 'lecture'],
    ['classroom', 'lecture'],
    ['lab', 'laboratory'],
    ['laboratory', 'laboratory'],
    ['computer lab', 'computer'],
    ['computer laboratory', 'computer'],
    ['computer', 'computer'],
    ['exam', 'examination'],
    ['examination', 'examination'],
    ['seminar', 'seminar'],
    ['seminar hall', 'seminar'],
    ['drawing', 'drawing'],
    ['drawing hall', 'drawing'],
  ]);
  return map.get(raw) || raw;
}

// Classrooms: normalize facilities list to enum tokens
function normalizeFacilitiesList (value) {
  const raw = String(value || '')
    .split(/\||;|,/)
    .map(s => s.trim())
    .filter(Boolean);
  const map = new Map([
    ['projector', 'projector'],
    ['whiteboard', 'whiteboard'],
    ['blackboard', 'blackboard'],
    ['ac', 'air_conditioning'],
    ['air conditioning', 'air_conditioning'],
    ['air_conditioning', 'air_conditioning'],
    ['fan', 'fans'],
    ['fans', 'fans'],
    ['light', 'lights'],
    ['lights', 'lights'],
    ['computer', 'computers'],
    ['computers', 'computers'],
    ['internet', 'internet'],
    ['wifi', 'internet'],
    ['audio', 'audio_system'],
    ['audio system', 'audio_system'],
    ['audiosystem', 'audio_system'],
    ['video', 'video_system'],
    ['video system', 'video_system'],
    ['videosystem', 'video_system'],
    ['furniture', 'furniture'],
    ['storage', 'storage'],
    ['security camera', 'security_camera'],
    ['security_camera', 'security_camera'],
    ['cctv', 'security_camera'],
  ]);
  const normalized = [];
  for (const item of raw) {
    const key = item.toLowerCase();
    const mapped = map.get(key) || key.replace(/\s+/g, '_');
    normalized.push(mapped);
  }
  // Deduplicate
  return Array.from(new Set(normalized));
}

module.exports.normalizeClassroomType = normalizeClassroomType;
module.exports.normalizeFacilitiesList = normalizeFacilitiesList;


