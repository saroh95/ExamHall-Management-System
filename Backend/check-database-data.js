/**
 * Check Database Data
 *
 * Check what data exists in the database
 */

const mongoose = require('mongoose');
const Student = require('./models/Student');
const Subject = require('./models/Subject');
const Enrollment = require('./models/Enrollment');
const Teacher = require('./models/Teacher');
const Classroom = require('./models/Classroom');

async function checkDatabaseData () {
  try {
    console.log('🔍 Checking Database Data...\n');

    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/exam-hall-management');
    console.log('✅ MongoDB connected\n');

    // Check each collection
    const students = await Student.find({}).countDocuments();
    const subjects = await Subject.find({}).countDocuments();
    const enrollments = await Enrollment.find({}).countDocuments();
    const teachers = await Teacher.find({}).countDocuments();
    const classrooms = await Classroom.find({}).countDocuments();

    console.log('📊 Database Data Summary:');
    console.log(`   Students: ${students}`);
    console.log(`   Subjects: ${subjects}`);
    console.log(`   Enrollments: ${enrollments}`);
    console.log(`   Teachers: ${teachers}`);
    console.log(`   Classrooms: ${classrooms}`);

    if (students === 0) {
      console.log('\n❌ No students found in database');
    }
    if (subjects === 0) {
      console.log('\n❌ No subjects found in database');
    }
    if (enrollments === 0) {
      console.log('\n❌ No enrollments found in database');
    }
    if (teachers === 0) {
      console.log('\n❌ No teachers found in database');
    }
    if (classrooms === 0) {
      console.log('\n❌ No classrooms found in database');
    }

    // Check if we have the minimum required data
    if (students > 0 && subjects > 0 && enrollments > 0 && teachers > 0 && classrooms > 0) {
      console.log('\n✅ Database has all required data for exam scheduling');
    } else {
      console.log('\n⚠️  Database is missing required data for exam scheduling');
      console.log('   You need to:');
      if (students === 0) console.log('   - Add students');
      if (subjects === 0) console.log('   - Add subjects');
      if (enrollments === 0) console.log('   - Create enrollments (students enrolled in subjects)');
      if (teachers === 0) console.log('   - Add teachers');
      if (classrooms === 0) console.log('   - Add classrooms');
    }

  } catch (error) {
    console.error('\n❌ Error checking database:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n📡 Database connection closed');
    process.exit(0);
  }
}

checkDatabaseData();
