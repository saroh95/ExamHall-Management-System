/**
 * Test Exam Scheduling
 *
 * Simple test to verify exam scheduling is working
 */

const mongoose = require('mongoose');
const unifiedScheduler = require('./services/unifiedEnrollmentScheduler');

async function testExamScheduling () {
  try {
    console.log('🧪 Testing Exam Scheduling...\n');

    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/exam-hall-management');
    console.log('✅ MongoDB connected\n');

    // Test parameters
    const testParams = {
      examType: 'Mid-Semester',
      semesters: [2, 4],
      departments: null, // All departments
      dateRange: {
        start: '2025-01-15',
        end: '2025-01-20',
      },
      timeSlots: [
        { start: '10:00', end: '13:00' },
        { start: '14:00', end: '17:00' },
      ],
      seatingStrategy: 'alternate',
      academicYear: '2025-2026', // Use the correct academic year from database
      createdBy: new mongoose.Types.ObjectId(),
    };

    console.log('📋 Test Parameters:');
    console.log('   Exam Type:', testParams.examType);
    console.log('   Semesters:', testParams.semesters);
    console.log('   Date Range:', testParams.dateRange);
    console.log('   Time Slots:', testParams.timeSlots.length);
    console.log('');

    // Test the scheduler
    console.log('🚀 Starting exam scheduling...');
    const result = await unifiedScheduler.scheduleExams(testParams);

    console.log('\n✅ Exam Scheduling Test Results:');
    console.log('   Success:', result ? 'Yes' : 'No');
    if (result) {
      console.log('   Exams Scheduled:', result.examsScheduled || 0);
      console.log('   Total Students:', result.totalStudents || 0);
      console.log('   Classrooms Used:', result.classroomsUsed || 0);
      console.log('   Invigilators Assigned:', result.invigilatorsAssigned || 0);
    }

  } catch (error) {
    console.error('\n❌ Exam Scheduling Test Failed:');
    console.error('   Error:', error.message);
    console.error('   Stack:', error.stack);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n📡 Database connection closed');
    process.exit(0);
  }
}

// Run the test
testExamScheduling();
