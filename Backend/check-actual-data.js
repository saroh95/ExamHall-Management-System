/**
 * Check Actual Data
 *
 * Check what the actual data looks like in the database
 */

const mongoose = require('mongoose');
const Enrollment = require('./models/Enrollment');

async function checkActualData () {
  try {
    console.log('🔍 Checking Actual Database Data...\n');

    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/exam-hall-management');
    console.log('✅ MongoDB connected\n');

    // Get a few sample enrollments to see the actual data structure
    const sampleEnrollments = await Enrollment.find({}).limit(5);
    console.log(`📊 Total enrollments in database: ${await Enrollment.countDocuments()}`);
    console.log('');

    if (sampleEnrollments.length > 0) {
      console.log('📝 Sample enrollment data:');
      sampleEnrollments.forEach((enrollment, index) => {
        console.log(`   ${index + 1}. Semester: ${enrollment.semester} (type: ${typeof enrollment.semester})`);
        console.log(`      Academic Year: ${enrollment.academicYear}`);
        console.log(`      Status: ${enrollment.status}`);
        console.log(`      Is Active: ${enrollment.isActive}`);
        console.log(`      Student ID: ${enrollment.student}`);
        console.log(`      Subject ID: ${enrollment.subject}`);
        console.log('');
      });

      // Check what semesters actually exist
      const semesterCounts = await Enrollment.aggregate([
        { $group: { _id: '$semester', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]);

      console.log('📊 Semester distribution:');
      semesterCounts.forEach(item => {
        console.log(`   Semester ${item._id}: ${item.count} enrollments`);
      });
      console.log('');

      // Check what academic years exist
      const yearCounts = await Enrollment.aggregate([
        { $group: { _id: '$academicYear', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]);

      console.log('📊 Academic year distribution:');
      yearCounts.forEach(item => {
        console.log(`   ${item._id}: ${item.count} enrollments`);
      });
      console.log('');

      // Check what statuses exist
      const statusCounts = await Enrollment.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]);

      console.log('📊 Status distribution:');
      statusCounts.forEach(item => {
        console.log(`   ${item._id}: ${item.count} enrollments`);
      });
      console.log('');

      // Now test with the actual data we found
      const actualSemesters = semesterCounts.map(item => item._id);
      const actualYears = yearCounts.map(item => item._id);
      const actualStatuses = statusCounts.map(item => item._id);

      console.log('🧪 Testing with actual data:');
      console.log(`   Using semesters: ${actualSemesters.slice(0, 2)}`);
      console.log(`   Using academic year: ${actualYears[0]}`);
      console.log(`   Using status: ${actualStatuses[0]}`);
      console.log('');

      const testQuery = {
        status: actualStatuses[0],
        academicYear: actualYears[0],
        semester: { $in: actualSemesters.slice(0, 2) },
      };

      console.log('🔍 Test Query:', JSON.stringify(testQuery, null, 2));
      console.log('');

      const testResults = await Enrollment.find(testQuery).limit(3);
      console.log(`📊 Test Results: ${testResults.length} enrollments found`);

      if (testResults.length > 0) {
        console.log('✅ Query works with actual data!');
        testResults.forEach((enrollment, index) => {
          console.log(`   ${index + 1}. Semester: ${enrollment.semester}, Year: ${enrollment.academicYear}, Status: ${enrollment.status}`);
        });
      } else {
        console.log('❌ Still no results with actual data');
      }

    } else {
      console.log('❌ No enrollments found in database');
    }

  } catch (error) {
    console.error('\n❌ Error checking actual data:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n📡 Database connection closed');
    process.exit(0);
  }
}

checkActualData();
