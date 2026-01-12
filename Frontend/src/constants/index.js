// Main constants file - exports all constants for easy importing

// Import all constant modules
import * as sharedConstants from './shared';
import * as studentConstants from './student';
import * as teacherConstants from './teacher';

// Re-export all constants for easy access
export * from './shared';
export * from './student';
export * from './teacher';

// Export as modules for structured access
export const SHARED = sharedConstants;
export const STUDENT = studentConstants;
export const TEACHER = teacherConstants;

// Export commonly used constants directly
export const {
  USER_ROLES,
  STATUS_OPTIONS,
  SEMESTER_OPTIONS,
  SECTION_OPTIONS,
  DEPARTMENT_OPTIONS,
  UPLOAD_CONSTANTS,
  VALIDATION_PATTERNS,
  FIELD_LIMITS
} = sharedConstants;

// API endpoints constants
export const API_ENDPOINTS = {
  AUTH: '/auth',
  USERS: '/users',
  STUDENTS: '/students',
  TEACHERS: '/teachers',
  SUBJECTS: '/subjects',
  CLASSROOMS: '/classrooms',
  EXAMS: '/exams',
  DEPARTMENTS: '/departments',
  DASHBOARD: '/dashboard'
};

// Route paths for frontend navigation
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  STUDENTS: '/students',
  TEACHERS: '/teachers',
  SUBJECTS: '/subjects',
  CLASSROOMS: '/classrooms',
  EXAMS: '/exams',
  PROFILE: '/profile',
  SETTINGS: '/settings'
};

// Theme constants
export const THEME = {
  COLORS: {
    PRIMARY: '#3B82F6',
    SECONDARY: '#6366F1',
    SUCCESS: '#10B981',
    WARNING: '#F59E0B',
    ERROR: '#EF4444',
    INFO: '#06B6D4'
  },
  BREAKPOINTS: {
    SM: '640px',
    MD: '768px',
    LG: '1024px',
    XL: '1280px'
  }
};

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  THEME_PREFERENCE: 'theme_preference',
  LANGUAGE_PREFERENCE: 'language_preference'
};