/**
 * Test Teacher Assignment Script
 *
 * This script tests the fixed teacher assignment system
 *
 * Usage:
 *   node Backend/scripts/test-teacher-assignment.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function testTeacherAssignment () {
  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log('🧪 TESTING TEACHER ASSIGNMENT SYSTEM');
    console.log('='.repeat(60));

    // Connect to database
    console.log('\n📡 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('✅ Connected to database\n');

    // Test the balanced duty service
    console.log('🔍 Testing balanced duty assignment service...');
    const balancedDutyService = require('../services/balancedDutyAssignmentService');

    // Test with multiple scenarios
    const testScenarios = [
      { classrooms: 1, teachersPerClassroom: 2, description: '1 classroom, 2 teachers' },
      { classrooms: 2, teachersPerClassroom: 2, description: '2 classrooms, 4 teachers' },
      { classrooms: 3, teachersPerClassroom: 2, description: '3 classrooms, 6 teachers' },
      { classrooms: 5, teachersPerClassroom: 2, description: '5 classrooms, 10 teachers' },
    ];

    for (const scenario of testScenarios) {
      console.log(`\n📋 Testing: ${scenario.description}`);

      const testParams = {
        examDate: new Date(),
        timeSlot: { start: '10:00', end: '13:00' },
        classroomCount: scenario.classrooms,
        teachersPerClassroom: scenario.teachersPerClassroom,
        existingAssignments: new Set(),
      };

      const assignments = await balancedDutyService.assignBalancedInvigilators(testParams);

      console.log(`   Result: ${assignments.length} teachers assigned`);

      if (assignments.length > 0) {
        console.log('   Sample assignments:');
        assignments.slice(0, 3).forEach((assignment, idx) => {
          console.log(`     ${idx + 1}. ${assignment.teacherName} (${assignment.role})`);
        });
      }
    }

    // Test global round-robin distribution
    console.log('\n🔄 Testing global round-robin distribution...');

    // Reset and test multiple rounds
    balancedDutyService.resetGlobalIndex();

    const rounds = 5;
    const allAssignments = [];

    for (let round = 1; round <= rounds; round++) {
      console.log(`\n   Round ${round}:`);

      const testParams = {
        examDate: new Date(),
        timeSlot: { start: '10:00', end: '13:00' },
        classroomCount: 2,
        teachersPerClassroom: 2,
        existingAssignments: new Set(),
      };

      const assignments = await balancedDutyService.assignBalancedInvigilators(testParams);
      allAssignments.push(...assignments);

      console.log(`     Assigned: ${assignments.map(a => a.teacherName).join(', ')}`);
    }

    // Analyze distribution
    console.log('\n📊 Distribution Analysis:');
    const teacherCounts = {};
    allAssignments.forEach(assignment => {
      const name = assignment.teacherName;
      teacherCounts[name] = (teacherCounts[name] || 0) + 1;
    });

    const sortedTeachers = Object.entries(teacherCounts)
      .sort(([,a], [,b]) => b - a);

    console.log(`   Total assignments across ${rounds} rounds: ${allAssignments.length}`);
    console.log(`   Unique teachers used: ${Object.keys(teacherCounts).length}`);
    console.log('   Assignment distribution:');

    sortedTeachers.forEach(([name, count]) => {
      console.log(`     ${name}: ${count} assignments`);
    });

    // Check for balance
    const counts = Object.values(teacherCounts);
    const minCount = Math.min(...counts);
    const maxCount = Math.max(...counts);
    const balance = maxCount - minCount;

    console.log(`   Balance: ${minCount}-${maxCount} (spread: ${balance})`);

    if (balance <= 1) {
      console.log('   ✅ Excellent balance! Teachers are distributed evenly.');
    } else if (balance <= 2) {
      console.log('   ✅ Good balance! Teachers are well distributed.');
    } else {
      console.log('   ⚠️  Imbalanced distribution. Some teachers assigned more than others.');
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('🎯 TEACHER ASSIGNMENT TEST COMPLETE');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error in test script:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from database');
  }
}

// Run the script
if (require.main === module) {
  testTeacherAssignment();
}

module.exports = testTeacherAssignment;
