const express = require('express');
const router = express.Router();
const {
  createClassroom,
  getClassrooms,
  getClassroom,
  getAllClassroomsForAssignment,
  findAvailableClassrooms,
  bookClassroom,
  updateClassroom,
  deleteClassroom,
  getClassroomBookings,
  bulkUploadClassrooms,
} = require('../controllers/classroomController');
const { protect, checkPermission } = require('../middleware/auth');
const { uploadBulkFile, handleUploadError } = require('../middleware/upload');

// Public routes (with auth)
router.get('/', protect, getClassrooms);

// Special routes (must come before /:id to avoid route conflicts)
router.get('/all-for-assignment', protect, getAllClassroomsForAssignment);

// Bulk upload route (must come before /:id)
router.post('/bulk-upload',
  protect,
  checkPermission('bulk_upload'),
  uploadBulkFile,
  handleUploadError,
  bulkUploadClassrooms,
);

router.get('/:id', protect, getClassroom);
router.get('/:id/bookings', protect, getClassroomBookings);

// Find available classrooms
router.post('/available', protect, findAvailableClassrooms);

// Booking
router.post('/:id/book', protect, bookClassroom);

// Admin routes
router.post('/', protect, checkPermission('create_classroom'), createClassroom);
router.patch('/:id', protect, checkPermission('update_classroom'), updateClassroom);
router.delete('/:id', protect, checkPermission('delete_classroom'), deleteClassroom);

module.exports = router;
