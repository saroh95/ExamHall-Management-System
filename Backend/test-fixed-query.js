/**
 * Test Fixed Query
 *
 * Test the enrollment query with correct data types
 */

const mongoose = require('mongoose');
const Enrollment = require('./models/Enrollment');

async function testFixedQuery () {
  try {
    console.log('🧪 Testing Fixed Enrollment Query...\n');

    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/exam-hall-management');
    console.log('✅ MongoDB connected\n');

    // Test with correct data types (numbers, not strings)
    const semesters = [2, 4]; // Numbers, not strings
    const departments = null;
    const academicYear = '2024-2025';

    console.log('📋 Query Parameters:');
    console.log('   Semesters:', semesters, '(type:', typeof semesters[0], ')');
    console.log('   Departments:', departments);
    console.log('   Academic Year:', academicYear);
    console.log('');

    // Build the query exactly like the scheduler does
    const enrollmentQuery = {
      status: 'Enrolled',
      academicYear,
    };

    if (semesters && semesters.length > 0) {
      enrollmentQuery.semester = { $in: semesters };
    }

    console.log('🔍 Enrollment Query:', JSON.stringify(enrollmentQuery, null, 2));
    console.log('');

    // Execute the query
    const enrollments = await Enrollment.find(enrollmentQuery)
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
        console.log(`      Semester: ${enrollment.semester} (type: ${typeof enrollment.semester})`);
        console.log(`      Department: ${enrollment.department || 'N/A'}`);
        console.log(`      Academic Year: ${enrollment.academicYear || 'N/A'}`);
        console.log('');
      });

      // Group by subject to see how many subjects have enrollments
      const subjectMap = new Map();
      for (const enrollment of enrollments) {
        if (enrollment.subject) {
          const subjectId = enrollment.subject._id.toString();
          if (!subjectMap.has(subjectId)) {
            subjectMap.set(subjectId, {
              subject: enrollment.subject,
              students: [],
            });
          }
          subjectMap.get(subjectId).students.push(enrollment.student);
        }
      }

      console.log(`📚 Subjects with enrollments: ${subjectMap.size}`);
      console.log('📝 Sample subjects:');
      Array.from(subjectMap.values()).slice(0, 3).forEach((subjectData, index) => {
        console.log(`   ${index + 1}. ${subjectData.subject.name} (${subjectData.subject.code})`);
        console.log(`      Students: ${subjectData.students.length}`);
        console.log(`      Semester: ${subjectData.subject.semesterId}`);
        console.log('');
      });

    } else {
      console.log('❌ No enrollments found with the given criteria');
    }

  } catch (error) {
    console.error('\n❌ Error testing fixed query:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n📡 Database connection closed');
    process.exit(0);
  }
}

testFixedQuery();
