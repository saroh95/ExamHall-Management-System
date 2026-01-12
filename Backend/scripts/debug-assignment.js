/**
 * Debug Teacher Assignment Script
 *
 * This script debugs the teacher assignment system to see why only 2 teachers are assigned
 *
 * Usage:
 *   node Backend/scripts/debug-assignment.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function debugAssignment () {
  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log('🐛 DEBUGGING TEACHER ASSIGNMENT SYSTEM');
    console.log('='.repeat(60));

    // Connect to database
    console.log('\n📡 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('✅ Connected to database\n');

    // Test the balanced duty service
    console.log('🔍 Testing balanced duty assignment service...');
    const BalancedDutyAssignmentService = require('../services/balancedDutyAssignmentService');

    // Test 1: Check singleton
    console.log('\n📋 Test 1: Singleton Pattern');
    const service1 = BalancedDutyAssignmentService.getInstance();
    const service2 = BalancedDutyAssignmentService.getInstance();
    console.log(`   Same instance: ${service1 === service2}`);
    console.log(`   Initial global index: ${service1.getGlobalIndex()}`);

    // Test 2: Multiple assignments
    console.log('\n📋 Test 2: Multiple Assignments');

    for (let i = 1; i <= 5; i++) {
      console.log(`\n   Assignment ${i}:`);

      const testParams = {
        examDate: new Date(),
        timeSlot: { start: '10:00', end: '13:00' },
        classroomCount: 2,
        teachersPerClassroom: 2,
        existingAssignments: new Set(),
      };

      console.log(`     Before: Global index = ${service1.getGlobalIndex()}`);
      const assignments = await service1.assignBalancedInvigilators(testParams);
      console.log(`     After: Global index = ${service1.getGlobalIndex()}`);
      console.log(`     Assigned: ${assignments.length} teachers`);

      if (assignments.length > 0) {
        console.log(`     Teachers: ${assignments.map(a => a.teacherName).join(', ')}`);
      }
    }

    // Test 3: Check teacher data
    console.log('\n📋 Test 3: Teacher Data');
    const Teacher = require('../models/Teacher');
    const teachers = await Teacher.find({ isActive: true }).select('_id fullName employeeId').limit(10);
    console.log(`   Total active teachers: ${teachers.length}`);
    console.log('   Sample teachers:');
    teachers.slice(0, 5).forEach((teacher, idx) => {
      console.log(`     ${idx + 1}. ${teacher.fullName} (${teacher.employeeId})`);
    });

    // Test 4: Direct assignment test
    console.log('\n📋 Test 4: Direct Assignment Test');
    const service = BalancedDutyAssignmentService.getInstance();

    // Reset for clean test
    service.resetGlobalIndex();
    console.log(`   Reset global index to: ${service.getGlobalIndex()}`);

    // Test with 10 classrooms (20 teachers needed)
    const testParams = {
      examDate: new Date(),
      timeSlot: { start: '10:00', end: '13:00' },
      classroomCount: 10,
      teachersPerClassroom: 2,
      existingAssignments: new Set(),
    };

    console.log('   Testing with 10 classrooms (20 teachers needed)...');
    const assignments = await service.assignBalancedInvigilators(testParams);

    console.log(`   Result: ${assignments.length} teachers assigned`);
    console.log(`   Final global index: ${service.getGlobalIndex()}`);

    if (assignments.length > 0) {
      console.log('   Assigned teachers:');
      assignments.forEach((assignment, idx) => {
        console.log(`     ${idx + 1}. ${assignment.teacherName} (${assignment.role})`);
      });

      // Check for duplicates
      const teacherIds = assignments.map(a => a.teacher.toString());
      const uniqueIds = new Set(teacherIds);
      console.log(`   Unique teachers: ${uniqueIds.size} out of ${assignments.length}`);

      if (uniqueIds.size < assignments.length) {
        console.log('   ⚠️  Duplicate teachers found!');
      } else {
        console.log('   ✅ All teachers are unique');
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('🎯 DEBUG COMPLETE');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error in debug script:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from database');
  }
}

// Run the script
if (require.main === module) {
  debugAssignment();
}

module.exports = debugAssignment;
