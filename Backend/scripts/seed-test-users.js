/**
 * Seed Script for Test Users
 * 
 * This script creates test users with different roles for testing the application.
 * Run this script after setting up MongoDB Atlas connection.
 * 
 * Usage: node scripts/seed-test-users.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/database');

// Test users to create
const testUsers = [
  {
    username: 'admin',
    email: 'admin@test.com',
    password: 'admin123',
    firstName: 'Admin',
    lastName: 'User',
    phone: '1234567890',
    role: 'admin',
    isEmailVerified: true,
    isActive: true,
  },
  {
    username: 'teacher1',
    email: 'teacher@test.com',
    password: 'teacher123',
    firstName: 'John',
    lastName: 'Teacher',
    phone: '1234567891',
    role: 'teacher',
    isEmailVerified: true,
    isActive: true,
  },
  {
    username: 'student1',
    email: 'student@test.com',
    password: 'student123',
    firstName: 'Jane',
    lastName: 'Student',
    phone: '1234567892',
    role: 'student',
    isEmailVerified: true,
    isActive: true,
  },
  {
    username: 'invigilator1',
    email: 'invigilator@test.com',
    password: 'invigilator123',
    firstName: 'Bob',
    lastName: 'Invigilator',
    phone: '1234567893',
    role: 'invigilator',
    isEmailVerified: true,
    isActive: true,
  },
];

async function seedTestUsers() {
  try {
    console.log('🌱 Starting test user seeding...');
    
    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Clear existing test users (optional - comment out if you want to keep existing users)
    const testEmails = testUsers.map(u => u.email);
    const existingUsers = await User.find({ email: { $in: testEmails } });
    
    if (existingUsers.length > 0) {
      console.log(`⚠️  Found ${existingUsers.length} existing test users.`);
      console.log('   To avoid duplicates, existing test users will be skipped.');
    }

    // Create test users
    let created = 0;
    let skipped = 0;

    for (const userData of testUsers) {
      try {
        // Check if user already exists
        const existingUser = await User.findByEmail(userData.email);
        if (existingUser) {
          console.log(`⏭️  Skipping ${userData.email} - already exists`);
          skipped++;
          continue;
        }

        // Create user (password will be hashed automatically by the model)
        const user = await User.create(userData);
        console.log(`✅ Created ${userData.role}: ${userData.email} (Password: ${userData.password})`);
        created++;
      } catch (error) {
        if (error.code === 11000) {
          console.log(`⏭️  Skipping ${userData.email} - duplicate entry`);
          skipped++;
        } else {
          console.error(`❌ Error creating ${userData.email}:`, error.message);
        }
      }
    }

    console.log('\n📊 Seeding Summary:');
    console.log(`   ✅ Created: ${created} users`);
    console.log(`   ⏭️  Skipped: ${skipped} users`);
    console.log('\n🎉 Test user seeding completed!');
    console.log('\n📝 Test Credentials:');
    console.log('   Admin:');
    console.log('     Email: admin@test.com');
    console.log('     Password: admin123');
    console.log('   Teacher:');
    console.log('     Email: teacher@test.com');
    console.log('     Password: teacher123');
    console.log('   Student:');
    console.log('     Email: student@test.com');
    console.log('     Password: student123');
    console.log('   Invigilator:');
    console.log('     Email: invigilator@test.com');
    console.log('     Password: invigilator123');

    // Close database connection
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding test users:', error);
    process.exit(1);
  }
}

// Run the seed script
seedTestUsers();

