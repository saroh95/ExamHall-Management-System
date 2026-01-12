/**
 * Debug Enrollment Query
 *
 * Debug why the enrollment query is not finding subjects
 */

const mongoose = require('mongoose');
const Enrollment = require('./models/Enrollment');
const Subject = require('./models/Subject');
const Student = require('./models/Student');

async function debugEnrollmentQuery () {
  try {
    console.log('🔍 Debugging Enrollment Query...\n');

    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/exam-hall-management');
    console.log('✅ MongoDB connected\n');

    // Test the same query that the scheduler uses
    const semesters = [2, 4];
    const departments = null; // All departments
    const academicYear = '2024-2025';

    console.log('📋 Query Parameters:');
    console.log('   Semesters:', semesters);
    console.log('   Departments:', departments);
    console.log('   Academic Year:', academicYear);
    console.log('');

    // Build the query exactly like the scheduler does
    const query = {
      isActive: true,
    };

    // Add semester filter
    if (semesters && semesters.length > 0) {
      query.semester = { $in: semesters.map(s => `Semester ${s}`) };
    }

    // Add department filter
    if (departments && departments.length > 0) {
      query.department = { $in: departments };
    }

    // Add academic year filter
    if (academicYear) {
      query.academicYear = academicYear;
    }

    console.log('🔍 Enrollment Query:', JSON.stringify(query, null, 2));
    console.log('');

    // Execute the query
    const enrollments = await Enrollment.find(query)
      .populate('student', 'fullName rollNumber department')
      .populate('subject', 'name code semesterId type credits')
      .lean();

    console.log(`📊 Query Results: ${enrollments.length} enrollments found`);
    console.log('');

    if (enrollments.length > 0) {
      console.log('📝 Sample Enrollments:');
      enrollments.slice(0, 3).forEach((enrollment, index) => {
        console.log(`   ${index + 1}. Student: ${enrollment.student?.fullName || 'N/A'} (${enrollment.student?.rollNumber || 'N/A'})`);
        console.log(`      Subject: ${enrollment.subject?.name || 'N/A'} (${enrollment.subject?.code || 'N/A'})`);
        console.log(`      Semester: ${enrollment.semester || 'N/A'}`);
        console.log(`      Department: ${enrollment.department || 'N/A'}`);
        console.log(`      Academic Year: ${enrollment.academicYear || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('❌ No enrollments found with the given criteria');

      // Let's check what data we actually have
      console.log('\n🔍 Checking actual data in database...');

      const allEnrollments = await Enrollment.find({}).limit(5);
      console.log(`   Total enrollments in DB: ${allEnrollments.length}`);

      if (allEnrollments.length > 0) {
        console.log('\n📝 Sample enrollment data:');
        allEnrollments.forEach((enrollment, index) => {
          console.log(`   ${index + 1}. Semester: ${enrollment.semester}`);
          console.log(`      Department: ${enrollment.department}`);
          console.log(`      Academic Year: ${enrollment.academicYear}`);
          console.log(`      Is Active: ${enrollment.isActive}`);
          console.log('');
        });
      }

      // Check subjects
      const allSubjects = await Subject.find({}).limit(5);
      console.log(`   Total subjects in DB: ${allSubjects.length}`);

      if (allSubjects.length > 0) {
        console.log('\n📝 Sample subject data:');
        allSubjects.forEach((subject, index) => {
          console.log(`   ${index + 1}. Name: ${subject.name}`);
          console.log(`      Code: ${subject.code}`);
          console.log(`      Semester: ${subject.semesterId}`);
          console.log(`      Type: ${subject.type}`);
          console.log('');
        });
      }
    }

  } catch (error) {
    console.error('\n❌ Error debugging enrollment query:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n📡 Database connection closed');
    process.exit(0);
  }
}

debugEnrollmentQuery();
