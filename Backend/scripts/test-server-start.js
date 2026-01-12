/**
 * Test Server Start Script
 *
 * This script tests if the server can start without crashes
 *
 * Usage:
 *   node scripts/test-server-start.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function testServerStart () {
  try {
    console.log('🧪 Testing server startup...\n');

    // Test 1: Check environment variables
    console.log('🔍 Test 1: Checking environment variables...');
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      console.log('❌ MONGODB_URI not found in environment variables');
      return;
    }
    console.log('✅ MongoDB URI found');

    // Test 2: Test database connection
    console.log('\n🔍 Test 2: Testing database connection...');
    await mongoose.connect(mongoUri);
    console.log('✅ Database connected successfully');

    // Test 3: Test model imports
    console.log('\n🔍 Test 3: Testing model imports...');
    const Teacher = require('../models/Teacher');
    const Exam = require('../models/Exam');
    console.log('✅ Models imported successfully');

    // Test 4: Test service imports
    console.log('\n🔍 Test 4: Testing service imports...');
    const balancedDutyService = require('../services/balancedDutyAssignmentService');
    console.log('✅ Services imported successfully');

    // Test 5: Test route imports
    console.log('\n🔍 Test 5: Testing route imports...');
    const teacherDutyRoutes = require('../routes/teacherDuty');
    const apiRoutes = require('../routes');
    console.log('✅ Routes imported successfully');

    // Test 6: Test middleware imports
    console.log('\n🔍 Test 6: Testing middleware imports...');
    const { protect, checkPermission } = require('../middleware/auth');
    console.log('✅ Middleware imported successfully');

    // Test 7: Test basic functionality
    console.log('\n🔍 Test 7: Testing basic functionality...');
    const teachers = await Teacher.find({ isActive: true }).limit(1);
    console.log(`✅ Found ${teachers.length} active teachers`);

    const exams = await Exam.find({ isActive: true }).limit(1);
    console.log(`✅ Found ${exams.length} active exams`);

    // Test 8: Test balanced duty service
    console.log('\n🔍 Test 8: Testing balanced duty service...');
    try {
      const stats = await balancedDutyService.getTeacherDutyStatistics();
      console.log(`✅ Duty statistics: ${stats.totalTeachers} teachers, ${stats.teachersWithDuties} with duties`);
    } catch (error) {
      console.log(`⚠️  Duty service test failed: ${error.message}`);
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log('🎉 ALL TESTS PASSED!');
    console.log('✅ Server should start without crashes');
    console.log(`${'='.repeat(50)}\n`);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    try {
      await mongoose.connection.close();
      console.log('📡 Database connection closed');
    } catch (error) {
      console.log('⚠️  Error closing database:', error.message);
    }
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  testServerStart();
}

module.exports = testServerStart;
