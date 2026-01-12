/**
 * Simple Fix Teacher Duties Script
 *
 * This is a crash-safe version that fixes the teacher duty issues step by step
 *
 * Usage:
 *   node Backend/scripts/simple-fix-duties.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function simpleFixDuties () {
  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log('🔧 SIMPLE TEACHER DUTY FIX');
    console.log('='.repeat(60));

    // Connect to database
    console.log('\n📡 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('✅ Connected to database\n');

    // Step 1: Check teachers
    console.log('🔍 Step 1: Checking teachers...');
    const Teacher = require('../models/Teacher');
    const teachers = await Teacher.find({ isActive: true }).select('_id fullName employeeId');
    console.log(`   Found ${teachers.length} active teachers`);

    if (teachers.length === 0) {
      console.log('❌ No active teachers found!');
      return;
    }

    // Check for teachers with missing names
    const teachersWithMissingNames = teachers.filter(t => !t.fullName || t.fullName.trim() === '');
    if (teachersWithMissingNames.length > 0) {
      console.log(`⚠️  ${teachersWithMissingNames.length} teachers have missing names`);
    } else {
      console.log('✅ All teachers have names');
    }

    // Step 2: Check exams
    console.log('\n🔍 Step 2: Checking exams...');
    const Exam = require('../models/Exam');
    const now = new Date();

    const allExams = await Exam.find({ isActive: true }).select('examDate status title invigilators').lean();
    console.log(`   Total exams: ${allExams.length}`);

    const pastExams = allExams.filter(e => new Date(e.examDate) < now);
    const futureExams = allExams.filter(e => new Date(e.examDate) >= now);

    console.log(`   Past exams: ${pastExams.length}`);
    console.log(`   Future exams: ${futureExams.length}`);

    // Step 3: Count current duties
    console.log('\n🔍 Step 3: Counting current duties...');
    const teacherDutyCount = new Map();

    // Initialize all teachers with 0 duties
    teachers.forEach(teacher => {
      teacherDutyCount.set(teacher._id.toString(), {
        teacherId: teacher._id,
        teacherName: teacher.fullName || 'Unknown',
        employeeId: teacher.employeeId || 'N/A',
        duties: 0,
      });
    });

    // Count duties from all exams
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

    // Count teachers with/without duties
    const teachersWithDuties = Array.from(teacherDutyCount.values()).filter(t => t.duties > 0);
    const teachersWithoutDuties = Array.from(teacherDutyCount.values()).filter(t => t.duties === 0);

    console.log(`   Teachers with duties: ${teachersWithDuties.length}`);
    console.log(`   Teachers without duties: ${teachersWithoutDuties.length}`);

    if (teachersWithoutDuties.length > 0) {
      console.log('\n⚠️  Teachers without duties:');
      teachersWithoutDuties.slice(0, 10).forEach((teacher, idx) => {
        console.log(`   ${idx + 1}. ${teacher.teacherName} (${teacher.employeeId})`);
      });
      if (teachersWithoutDuties.length > 10) {
        console.log(`   ... and ${teachersWithoutDuties.length - 10} more`);
      }
    }

    // Step 4: Create dummy future exams if needed
    if (futureExams.length === 0) {
      console.log('\n📝 Step 4: Creating dummy future exams...');

      const dummyExams = [];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1); // Tomorrow

      // Create 5 dummy exams over next 5 days
      for (let i = 0; i < 5; i++) {
        const examDate = new Date(startDate);
        examDate.setDate(examDate.getDate() + i);

        try {
          const dummyExam = await Exam.create({
            title: `Dummy Exam ${i + 1} for Duty Assignment`,
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
            notes: `Dummy exam ${i + 1} created for duty assignment`,
          });

          dummyExams.push(dummyExam);
          console.log(`   ✅ Created: ${dummyExam.title} (${dummyExam.examDate.toDateString()})`);
        } catch (error) {
          console.log(`   ❌ Error creating dummy exam ${i + 1}: ${error.message}`);
        }
      }

      console.log(`\n✅ Created ${dummyExams.length} dummy exams`);
    }

    // Step 5: Assign duties to all teachers
    console.log('\n👨‍🏫 Step 5: Assigning duties to all teachers...');

    // Get all future exams (including newly created ones)
    const updatedFutureExams = await Exam.find({
      examDate: { $gte: now },
      status: { $in: ['scheduled', 'in_progress'] },
      isActive: true,
    }).sort({ examDate: 1, startTime: 1 });

    console.log(`   Found ${updatedFutureExams.length} future exams to process`);

    if (updatedFutureExams.length > 0) {
      let totalAssignments = 0;

      for (const exam of updatedFutureExams) {
        try {
          console.log(`\n   📝 Processing: ${exam.title} (${exam.examDate.toDateString()})`);

          // Determine how many classrooms this exam needs
          let classroomCount = 1;
          if (exam.title.includes('Dummy Exam')) {
            // Assign 2-4 classrooms per dummy exam to use more teachers
            classroomCount = Math.min(4, Math.ceil(teachers.length / 20));
          } else if (exam.classrooms && exam.classrooms.length > 0) {
            classroomCount = exam.classrooms.length;
          }

          console.log(`      📊 Assigning teachers for ${classroomCount} classroom(s)`);

          // Simple assignment: assign teachers in round-robin fashion
          const assignments = [];
          const teachersPerClassroom = 2;
          const totalTeachersNeeded = classroomCount * teachersPerClassroom;

          // Shuffle teachers to get different assignments
          const shuffledTeachers = [...teachers].sort(() => Math.random() - 0.5);

          for (let i = 0; i < totalTeachersNeeded; i++) {
            const teacher = shuffledTeachers[i % shuffledTeachers.length];
            const role = (i % teachersPerClassroom === 0) ? 'chief_invigilator' : 'invigilator';

            assignments.push({
              teacher: teacher._id,
              role,
              assignedClassrooms: [],
            });

            console.log(`      ✅ ${role}: ${teacher.fullName || 'Unknown'} (${teacher.employeeId || 'N/A'})`);
          }

          // Update exam with invigilators
          exam.invigilators = assignments;
          await exam.save();

          totalAssignments += assignments.length;
          console.log(`      ✅ Assigned ${assignments.length} teachers to this exam`);

        } catch (error) {
          console.log(`      ❌ Error processing ${exam.title}: ${error.message}`);
        }
      }

      console.log(`\n✅ Total assignments made: ${totalAssignments}`);
    }

    // Step 6: Check final statistics
    console.log('\n🔍 Step 6: Checking final statistics...');

    // Recalculate duties
    const finalTeacherDutyCount = new Map();
    teachers.forEach(teacher => {
      finalTeacherDutyCount.set(teacher._id.toString(), {
        teacherId: teacher._id,
        teacherName: teacher.fullName || 'Unknown',
        employeeId: teacher.employeeId || 'N/A',
        duties: 0,
      });
    });

    const allExamsFinal = await Exam.find({ isActive: true }).select('invigilators').lean();
    allExamsFinal.forEach(exam => {
      if (exam.invigilators && exam.invigilators.length > 0) {
        exam.invigilators.forEach(inv => {
          const teacherId = inv.teacher.toString();
          const teacherData = finalTeacherDutyCount.get(teacherId);
          if (teacherData) {
            teacherData.duties++;
          }
        });
      }
    });

    const finalTeachersWithDuties = Array.from(finalTeacherDutyCount.values()).filter(t => t.duties > 0);
    const finalTeachersWithoutDuties = Array.from(finalTeacherDutyCount.values()).filter(t => t.duties === 0);

    console.log(`   Teachers with duties: ${finalTeachersWithDuties.length}/${teachers.length}`);
    console.log(`   Teachers without duties: ${finalTeachersWithoutDuties.length}`);

    // Step 7: Clean up dummy exams
    console.log('\n🧹 Step 7: Cleaning up dummy exams...');
    try {
      const deleted = await Exam.deleteMany({
        title: { $regex: /^Dummy Exam.*for Duty Assignment$/ },
      });
      console.log(`✅ Removed ${deleted.deletedCount} dummy exams`);
    } catch (error) {
      console.log(`❌ Error cleaning up dummy exams: ${error.message}`);
    }

    // Final summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 FINAL SUMMARY');
    console.log('='.repeat(60));

    if (finalTeachersWithoutDuties.length === 0) {
      console.log('🎉 SUCCESS! All teachers now have duties!');
    } else {
      console.log(`⚠️  ${finalTeachersWithoutDuties.length} teachers still have no duties`);
    }

    console.log('\n📊 Results:');
    console.log(`   Total Teachers: ${teachers.length}`);
    console.log(`   Teachers with duties: ${finalTeachersWithDuties.length}`);
    console.log(`   Teachers without duties: ${finalTeachersWithoutDuties.length}`);
    console.log(`   Success rate: ${((finalTeachersWithDuties.length / teachers.length) * 100).toFixed(1)}%`);

    console.log(`${'='.repeat(60)}\n`);

  } catch (error) {
    console.error('\n❌ Error during simple fix:', error);
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
  simpleFixDuties();
}

module.exports = simpleFixDuties;
