/**
 * Create Admin User Script
 * 
 * This script creates a single admin user in the database.
 * 
 * Usage: node scripts/create-admin.js
 * 
 * You can customize the admin credentials by modifying the adminData object below.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/database');

// Admin user data - CUSTOMIZE THESE VALUES
const adminData = {
  username: 'admin',
  email: 'admin@examhall.com',
  password: 'Admin@123', // Change this to your desired password
  firstName: 'Admin',
  lastName: 'User',
  phone: '1234567890',
  role: 'admin',
  isEmailVerified: true,
  isActive: true,
  permissions: [
    // Full access permissions for admin
    'access_students', 'access_teachers', 'access_subjects', 'access_classrooms',
    'access_enrollments', 'access_users', 'access_notifications', 'access_exams',
    'create_student', 'read_student', 'update_student', 'delete_student',
    'create_teacher', 'read_teacher', 'update_teacher', 'delete_teacher',
    'create_subject', 'read_subject', 'update_subject', 'delete_subject',
    'create_classroom', 'read_classroom', 'update_classroom', 'delete_classroom',
    'create_exam', 'read_exam', 'update_exam', 'delete_exam',
    'create_enrollment', 'read_enrollment', 'update_enrollment', 'delete_enrollment',
    'assign_invigilator', 'manage_users', 'view_reports', 'bulk_upload',
    'send_notifications', 'export_data',
  ],
};

async function createAdmin() {
  try {
    console.log('🔐 Creating admin user...');
    console.log(`   Email: ${adminData.email}`);
    console.log(`   Username: ${adminData.username}`);
    console.log(`   Password: ${adminData.password}\n`);
    
    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      $or: [
        { email: adminData.email },
        { username: adminData.username }
      ]
    });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Username: ${existingAdmin.username}`);
      console.log(`   Role: ${existingAdmin.role}`);
      console.log('\n💡 To update the password, use the change-password endpoint or delete and recreate the user.');
      
      // Ask if user wants to update password
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      return new Promise((resolve) => {
        readline.question('\nDo you want to update the password? (yes/no): ', async (answer) => {
          readline.close();
          
          if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
            existingAdmin.password = adminData.password;
            await existingAdmin.save();
            console.log('✅ Password updated successfully!');
          } else {
            console.log('⏭️  Skipping password update.');
          }
          
          await mongoose.connection.close();
          console.log('\n✅ Database connection closed');
          process.exit(0);
        });
      });
    }

    // Create admin user (password will be hashed automatically by the model)
    const admin = await User.create(adminData);
    
    console.log('✅ Admin user created successfully!');
    console.log('\n📝 Admin Credentials:');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Username: ${admin.username}`);
    console.log(`   Password: ${adminData.password}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   User ID: ${admin._id}`);
    console.log('\n🔐 You can now login with these credentials.');

    // Close database connection
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    if (error.code === 11000) {
      console.error('   Duplicate entry detected. Admin with this email or username already exists.');
    }
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the script
createAdmin();
