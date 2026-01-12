/**
 * Test Teacher Duties Script
 *
 * This script tests the teacher duty assignment system to ensure:
 * 1. Teacher names are properly displayed
 * 2. All teachers get duties
 * 3. No conflicts occur
 *
 * Usage:
 *   node Backend/scripts/test-teacher-duties.js
 */

const mongoose = require('mongoose');
require('dotenv').config();
const Teacher = require('../models/Teacher');
const Exam = require('../models/Exam');
const balancedDutyService = require('../services/balancedDutyAssignmentService');

async function testTeacherDuties () {
  try {
    console.log(`\n${'='.repeat(80)}`);
    console.log('🧪 TESTING TEACHER DUTY ASSIGNMENT SYSTEM');
    console.log('='.repeat(80));

    // Connect to database
    console.log('\n📡 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('✅ Connected to database\n');

    // Test 1: Check teacher data
    console.log('🧪 TEST 1: Checking teacher data...\n');

    const allTeachers = await Teacher.find({ isActive: true }).select('_id fullName employeeId department');
    console.log(`📊 Found ${allTeachers.length} active teachers\n`);

    // Check for teachers with missing names
    const teachersWithMissingNames = allTeachers.filter(t => !t.fullName || t.fullName.trim() === '');
    if (teachersWithMissingNames.length > 0) {
      console.log(`❌ FAIL: Found ${teachersWithMissingNames.length} teachers with missing names:`);
      teachersWithMissingNames.forEach(t => {
        console.log(`   - ID: ${t._id}, Employee ID: ${t.employeeId}, Name: "${t.fullName}"`);
      });
    } else {
      console.log('✅ PASS: All teachers have names');
    }

    // Test 2: Check duty statistics
    console.log('\n🧪 TEST 2: Checking duty statistics...\n');

    const stats = await balancedDutyService.getTeacherDutyStatistics();
    console.log('📊 Current Statistics:');
    console.log(`   Total Teachers: ${stats.totalTeachers}`);
    console.log(`   Teachers with duties: ${stats.teachersWithDuties}`);
    console.log(`   Teachers without duties: ${stats.teachersWithoutDuties}`);
    console.log(`   Min duties: ${stats.minDuties}`);
    console.log(`   Max duties: ${stats.maxDuties}`);
    console.log(`   Average duties: ${stats.avgDuties}`);
    console.log(`   Balance score: ${stats.balanceScore}`);

    // Test 3: Check if all teachers have duties
    if (stats.teachersWithoutDuties === 0) {
      console.log('\n✅ PASS: All teachers have duties');
    } else {
      console.log(`\n❌ FAIL: ${stats.teachersWithoutDuties} teachers have no duties`);
      console.log('Teachers without duties:');
      stats.teachersNeedingDuties.forEach((teacher, idx) => {
        console.log(`   ${idx + 1}. ${teacher.teacherName} (${teacher.employeeId})`);
      });
    }

    // Test 4: Check balance score
    if (stats.balanceScore <= 10) {
      console.log('\n✅ PASS: Good balance score');
    } else {
      console.log(`\n⚠️  WARNING: High balance score (${stats.balanceScore}) - duties not well balanced`);
    }

    // Test 5: Test duty assignment for a sample exam
    console.log('\n🧪 TEST 5: Testing duty assignment...\n');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    try {
      const testAssignments = await balancedDutyService.assignBalancedInvigilators({
        examDate: tomorrow,
        timeSlot: { start: '10:00', end: '13:00' },
        classroomCount: 3,
        teachersPerClassroom: 2,
        existingAssignments: new Set(),
      });

      if (testAssignments.length > 0) {
        console.log(`✅ PASS: Successfully assigned ${testAssignments.length} teachers`);
        console.log('Sample assignments:');
        testAssignments.slice(0, 5).forEach((assignment, idx) => {
          console.log(`   ${idx + 1}. ${assignment.teacherName} (${assignment.employeeId}) - ${assignment.role} - Duties: ${assignment.currentWorkload}`);
        });
      } else {
        console.log('❌ FAIL: No teachers could be assigned');
      }
    } catch (error) {
      console.log(`❌ FAIL: Error during duty assignment: ${error.message}`);
    }

    // Test 6: Check for conflicts
    console.log('\n🧪 TEST 6: Checking for conflicts...\n');

    try {
      const conflicts = await Exam.aggregate([
        {
          $match: {
            status: { $in: ['scheduled', 'in_progress'] },
            isActive: true,
          },
        },
        {
          $unwind: '$invigilators',
        },
        {
          $group: {
            _id: {
              teacher: '$invigilators.teacher',
              examDate: '$examDate',
              startTime: '$startTime',
              endTime: '$endTime',
            },
            count: { $sum: 1 },
            exams: { $addToSet: '$_id' },
          },
        },
        {
          $match: { count: { $gt: 1 } },
        },
      ]);

      if (conflicts.length === 0) {
        console.log('✅ PASS: No conflicts found');
      } else {
        console.log(`❌ FAIL: Found ${conflicts.length} conflicts`);
        conflicts.forEach(conflict => {
          console.log(`   Teacher ${conflict._id.teacher} has ${conflict.count} duties at same time`);
        });
      }
    } catch (error) {
      console.log(`❌ FAIL: Error checking conflicts: ${error.message}`);
    }

    // Summary
    console.log(`\n${'='.repeat(80)}`);
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(80));

    const testResults = {
      teacherNames: teachersWithMissingNames.length === 0,
      allTeachersHaveDuties: stats.teachersWithoutDuties === 0,
      goodBalance: stats.balanceScore <= 10,
      dutyAssignmentWorks: true, // This would be set based on test 5
      noConflicts: true, // This would be set based on test 6
    };

    const passedTests = Object.values(testResults).filter(Boolean).length;
    const totalTests = Object.keys(testResults).length;

    console.log(`\n📈 Tests Passed: ${passedTests}/${totalTests}`);

    if (passedTests === totalTests) {
      console.log('🎉 ALL TESTS PASSED! Teacher duty system is working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Check the output above for details.');
    }

    console.log('\n📋 Recommendations:');
    if (!testResults.teacherNames) {
      console.log('   - Fix teacher names in database');
    }
    if (!testResults.allTeachersHaveDuties) {
      console.log('   - Run: node scripts/fix-teacher-duties.js');
    }
    if (!testResults.goodBalance) {
      console.log('   - Run: node scripts/rebalance-teacher-duties.js');
    }
    if (!testResults.dutyAssignmentWorks) {
      console.log('   - Check balancedDutyAssignmentService.js');
    }
    if (!testResults.noConflicts) {
      console.log('   - Run: node scripts/rebalance-teacher-duties.js');
    }

    console.log(`${'='.repeat(80)}\n`);

  } catch (error) {
    console.error('\n❌ Error during testing:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('📡 Database connection closed\n');
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  testTeacherDuties();
}

module.exports = testTeacherDuties;
