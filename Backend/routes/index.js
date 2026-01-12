const express = require('express');
const router = express.Router();

// Import all route modules
const authRoutes = require('./auth');
const userRoutes = require('./users');
const studentRoutes = require('./students');
const teacherRoutes = require('./teachers');
const subjectRoutes = require('./subjects');
const classroomRoutes = require('./classrooms');
const examRoutes = require('./exams');
const departmentRoutes = require('./departments');
const dashboardRoutes = require('./dashboard');
const enrollmentRoutes = require('./enrollments');
const enrollmentBasedExamRoutes = require('./enrollmentBasedExams');
const unifiedExamSchedulerRoutes = require('./unifiedExamScheduler');
const diagnosticRoutes = require('./diagnostics');
const examTimetableRoutes = require('./examTimetable');
const testRoutes = require('./testTeachers');
const notificationRoutes = require('./notifications');
const settingsRoutes = require('./settings');
const attendanceRoutes = require('./attendance');
const teacherDutyRoutes = require('./teacherDuty');

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Exam Hall Management System API is running',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/students', studentRoutes);
router.use('/teachers', teacherRoutes);
router.use('/subjects', subjectRoutes);
router.use('/classrooms', classroomRoutes);
router.use('/exams', examRoutes);
router.use('/departments', departmentRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/enrollments', enrollmentRoutes);
router.use('/enrollment-exams', enrollmentBasedExamRoutes);
router.use('/unified-exam-scheduler', unifiedExamSchedulerRoutes);
router.use('/diagnostics', diagnosticRoutes);
router.use('/exam-timetable', examTimetableRoutes);
router.use('/test', testRoutes);
router.use('/notifications', notificationRoutes);
router.use('/settings', settingsRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/teacher-duty', teacherDutyRoutes);

module.exports = router;
