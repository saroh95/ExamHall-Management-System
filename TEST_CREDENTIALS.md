# 🔐 Test Credentials

This document contains test credentials for accessing the Exam Hall Management System.

## 📋 Test User Accounts

After running the seed script (`node Backend/scripts/seed-test-users.js`), you can use the following credentials to test the application:

### 👨‍💼 Admin Account
- **Email:** `admin@test.com`
- **Password:** `admin123`
- **Role:** Admin
- **Access:** Full system access, can manage all users, exams, and settings

### 👨‍🏫 Teacher Account
- **Email:** `teacher@test.com`
- **Password:** `teacher123`
- **Role:** Teacher
- **Access:** Can view and manage assigned exams, students, and classes

### 👨‍🎓 Student Account
- **Email:** `student@test.com`
- **Password:** `student123`
- **Role:** Student
- **Access:** Can view exam schedules, seating arrangements, and personal information


## 🚀 Setting Up Test Users

### Step 1: Configure MongoDB Atlas

1. Sign up at [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a free cluster
3. Create a database user:
   - Go to "Database Access" → "Add New Database User"
   - Choose "Password" authentication
   - Create username and password (save these!)
4. Whitelist IP addresses:
   - Go to "Network Access" → "Add IP Address"
   - For testing, add `0.0.0.0/0` (allows all IPs)
   - For production, use specific IPs
5. Get connection string:
   - Go to "Clusters" → "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `exam-hall-management` (or your preferred database name)

### Step 2: Update Environment Variables

1. Copy `Backend/env.example` to `Backend/.env`
2. Update `MONGODB_URI` with your MongoDB Atlas connection string:
   ```env
   MONGODB_URI=mongodb+srv://yourusername:yourpassword@cluster0.xxxxx.mongodb.net/exam-hall-management?retryWrites=true&w=majority
   ```
3. Set other required environment variables (JWT_SECRET, etc.)

### Step 3: Run the Seed Script

```bash
cd Backend
node scripts/seed-test-users.js
```

This will create all test users in your MongoDB Atlas database.

## 🔄 Resetting Test Users

If you need to reset the test users, you can:

1. Delete the users manually from MongoDB Atlas dashboard, or
2. Modify the seed script to delete existing users before creating new ones

## ⚠️ Security Notes

- **These are test credentials only!** Do not use these in production.
- Change all passwords before deploying to production.
- Use strong, unique passwords for production environments.
- Consider implementing password complexity requirements.
- Enable email verification for production.

## 📝 Additional Notes

- All test users have email verification set to `true` by default
- All test users are set to `isActive: true`
- Phone numbers are placeholder values (10 digits)
- You can create additional test users through the registration API or admin panel

## 🆘 Troubleshooting

### Users not created?
- Check MongoDB Atlas connection string is correct
- Verify database user has read/write permissions
- Check IP whitelist includes your current IP
- Review console output for specific error messages

### Can't login?
- Ensure seed script ran successfully
- Verify email and password match exactly (case-sensitive)
- Check if user account is active (`isActive: true`)
- Verify JWT_SECRET is set in environment variables

### Connection issues?
- Verify MongoDB Atlas cluster is running
- Check network access IP whitelist
- Ensure connection string format is correct
- Test connection using MongoDB Compass or similar tool

## 📞 Support

If you encounter any issues:
1. Check the console logs for error messages
2. Verify all environment variables are set correctly
3. Ensure MongoDB Atlas cluster is accessible
4. Review the seed script output for specific errors

---

**Last Updated:** Generated automatically
**For:** Exam Hall Management System

