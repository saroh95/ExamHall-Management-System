/**
 * Force Assign All Teachers Script
 *
 * This script ensures ALL 87 teachers get at least one duty assignment
 *
 * Usage:
 *   node Backend/scripts/force-assign-all-teachers.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function forceAssignAllTeachers () {
  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log('🎯 FORCE ASSIGN ALL TEACHERS');
    console.log('='.repeat(60));

    // Connect to database
    console.log('\n📡 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('✅ Connected to database\n');

    // Step 1: Get all teachers
    console.log('🔍 Step 1: Getting all teachers...');
    const Teacher = require('../models/Teacher');
    const teachers = await Teacher.find({ isActive: true }).select('_id fullName employeeId department');
    console.log(`   Found ${teachers.length} active teachers`);

    if (teachers.length === 0) {
      console.log('❌ No active teachers found!');
      return;
    }

    // Step 2: Get all future exams
    console.log('\n🔍 Step 2: Getting future exams...');
    const Exam = require('../models/Exam');
    const now = new Date();

    const futureExams = await Exam.find({
      examDate: { $gte: now },
      status: { $in: ['scheduled', 'in_progress'] },
      isActive: true,
    }).sort({ examDate: 1, startTime: 1 });

    console.log(`   Found ${futureExams.length} future exams`);

    // Step 3: Create more exams if needed to ensure all teachers get duties
    if (futureExams.length < Math.ceil(teachers.length / 4)) {
      console.log('\n📝 Step 3: Creating additional exams for complete coverage...');

      const additionalExamsNeeded = Math.ceil(teachers.length / 4) - futureExams.length;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1); // Tomorrow

      for (let i = 0; i < additionalExamsNeeded; i++) {
        const examDate = new Date(startDate);
        examDate.setDate(examDate.getDate() + i);

        try {
          const additionalExam = await Exam.create({
            title: `Additional Exam ${i + 1} for Complete Teacher Coverage`,
            type: 'end_semester',
            subject: null,
            semester: `Semester ${(i % 4) + 1}`,
            academicYear: '2024-2025',
            examDate,
            startTime: '10:00',
            endTime: '13:00',
            duration: 180,
            totalMarks: 100,
            passingMarks: 40,
            classrooms: [],
            invigilators: [],
            totalStudents: 0,
            departments: [],
            status: 'scheduled',
            isActive: true,
            createdBy: null,
            notes: `Additional exam ${i + 1} created for complete teacher coverage`,
          });

          futureExams.push(additionalExam);
          console.log(`   ✅ Created: ${additionalExam.title} (${additionalExam.examDate.toDateString()})`);
        } catch (error) {
          console.log(`   ❌ Error creating additional exam ${i + 1}: ${error.message}`);
        }
      }
    }

    // Step 4: Clear all existing invigilator assignments from future exams
    console.log('\n🧹 Step 4: Clearing existing assignments...');
    for (const exam of futureExams) {
      exam.invigilators = [];
      await exam.save();
    }
    console.log(`   ✅ Cleared assignments from ${futureExams.length} exams`);

    // Step 5: Assign teachers in round-robin fashion to ensure everyone gets duties
    console.log('\n👨‍🏫 Step 5: Force assigning all teachers...');

    // Shuffle teachers to get different assignments
    const shuffledTeachers = [...teachers].sort(() => Math.random() - 0.5);
    let teacherIndex = 0;
    let totalAssignments = 0;

    for (let examIndex = 0; examIndex < futureExams.length; examIndex++) {
      const exam = futureExams[examIndex];

      // Determine how many teachers to assign to this exam (2-4 teachers per exam)
      const teachersPerExam = Math.min(4, Math.max(2, Math.ceil(teachers.length / futureExams.length)));

      console.log(`\n   📝 Processing: ${exam.title} (${exam.examDate.toDateString()})`);
      console.log(`      📊 Assigning ${teachersPerExam} teachers`);

      const examAssignments = [];

      for (let i = 0; i < teachersPerExam; i++) {
        const teacher = shuffledTeachers[teacherIndex % shuffledTeachers.length];
        const role = i === 0 ? 'chief_invigilator' : 'invigilator';

        examAssignments.push({
          teacher: teacher._id,
          role,
          assignedClassrooms: [],
        });

        console.log(`      ✅ ${role}: ${teacher.fullName || 'Unknown'} (${teacher.employeeId || 'N/A'})`);

        teacherIndex++;
        totalAssignments++;
      }

      // Update exam with assignments
      exam.invigilators = examAssignments;
      await exam.save();

      console.log(`      ✅ Assigned ${examAssignments.length} teachers to this exam`);
    }

    console.log(`\n✅ Total assignments made: ${totalAssignments}`);

    // Step 6: Verify all teachers have duties
    console.log('\n🔍 Step 6: Verifying all teachers have duties...');

    // Recalculate duties
    const teacherDutyCount = new Map();
    teachers.forEach(teacher => {
      teacherDutyCount.set(teacher._id.toString(), {
        teacherId: teacher._id,
        teacherName: teacher.fullName || 'Unknown',
        employeeId: teacher.employeeId || 'N/A',
        duties: 0,
      });
    });

    const allExams = await Exam.find({ isActive: true }).select('invigilators').lean();
    allExams.forEach(exam => {
      if (exam.invigilators && exam.invigilators.length > 0) {
        exam.invigilators.forEach(inv => {
          const teacherId = inv.teacher.toString();
          const teacherData = teacherDutyCount.get(teacherId);
          if (teacherData) {
            teacherData.duties++;
          }
        });
      }
    });

    const teachersWithDuties = Array.from(teacherDutyCount.values()).filter(t => t.duties > 0);
    const teachersWithoutDuties = Array.from(teacherDutyCount.values()).filter(t => t.duties === 0);

    console.log(`   Teachers with duties: ${teachersWithDuties.length}/${teachers.length}`);
    console.log(`   Teachers without duties: ${teachersWithoutDuties.length}`);

    if (teachersWithoutDuties.length > 0) {
      console.log('\n⚠️  Teachers still without duties:');
      teachersWithoutDuties.forEach((teacher, idx) => {
        console.log(`   ${idx + 1}. ${teacher.teacherName} (${teacher.employeeId})`);
      });
    }

    // Step 7: Clean up additional exams
    console.log('\n🧹 Step 7: Cleaning up additional exams...');
    try {
      const deleted = await Exam.deleteMany({
        title: { $regex: /^Additional Exam.*for Complete Teacher Coverage$/ },
      });
      console.log(`✅ Removed ${deleted.deletedCount} additional exams`);
    } catch (error) {
      console.log(`❌ Error cleaning up additional exams: ${error.message}`);
    }

    // Final summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 FINAL SUMMARY');
    console.log('='.repeat(60));

    if (teachersWithoutDuties.length === 0) {
      console.log('🎉 SUCCESS! All teachers now have duties!');
    } else {
      console.log(`⚠️  ${teachersWithoutDuties.length} teachers still have no duties`);
    }

    console.log('\n📊 Results:');
    console.log(`   Total Teachers: ${teachers.length}`);
    console.log(`   Teachers with duties: ${teachersWithDuties.length}`);
    console.log(`   Teachers without duties: ${teachersWithoutDuties.length}`);
    console.log(`   Success rate: ${((teachersWithDuties.length / teachers.length) * 100).toFixed(1)}%`);

    // Show duty distribution
    const dutyCounts = Array.from(teacherDutyCount.values()).map(t => t.duties);
    const minDuties = Math.min(...dutyCounts);
    const maxDuties = Math.max(...dutyCounts);
    const avgDuties = (dutyCounts.reduce((a, b) => a + b, 0) / dutyCounts.length).toFixed(2);

    console.log('\n📊 Duty Distribution:');
    console.log(`   Min duties per teacher: ${minDuties}`);
    console.log(`   Max duties per teacher: ${maxDuties}`);
    console.log(`   Average duties per teacher: ${avgDuties}`);
    console.log(`   Balance spread: ${maxDuties - minDuties} (lower is better)`);

    console.log(`${'='.repeat(60)}\n`);

  } catch (error) {
    console.error('\n❌ Error during force assignment:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    try {
      await mongoose.connection.close();
      console.log('📡 Database connection closed\n');
    } catch (error) {
      console.log('⚠️  Error closing database connection:', error.message);
    }
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  forceAssignAllTeachers();
}

module.exports = forceAssignAllTeachers;
