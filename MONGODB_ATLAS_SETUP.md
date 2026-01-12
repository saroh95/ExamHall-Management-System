# 🗄️ MongoDB Atlas Setup Guide

This guide will help you set up MongoDB Atlas for your Exam Hall Management System so that anyone can access and test your application.

## 📋 Prerequisites

- A MongoDB Atlas account (free tier available)
- Your application code ready to deploy

## 🚀 Step-by-Step Setup

### Step 1: Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Click "Sign Up" or "Try Free"
3. Fill in your details and create an account
4. Verify your email address

### Step 2: Create a Cluster

1. After logging in, click "Build a Database"
2. Choose the **FREE (M0) Shared** tier
3. Select a cloud provider and region (choose closest to your users)
4. Click "Create Cluster"
5. Wait 3-5 minutes for the cluster to be created

### Step 3: Create Database User

1. Go to **"Database Access"** in the left sidebar
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication method
4. Create a username (e.g., `examhalladmin`)
5. Generate a secure password (or create your own)
6. **IMPORTANT:** Save the username and password - you'll need them!
7. Set user privileges to **"Atlas admin"** (for full access)
8. Click **"Add User"**

### Step 4: Configure Network Access

1. Go to **"Network Access"** in the left sidebar
2. Click **"Add IP Address"**
3. For testing/public access, click **"Allow Access from Anywhere"**
   - This adds `0.0.0.0/0` to the whitelist
   - ⚠️ **Note:** For production, restrict to specific IPs
4. Click **"Confirm"**

### Step 5: Get Connection String

1. Go back to **"Clusters"** in the left sidebar
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Select **"Node.js"** as the driver
5. Copy the connection string (it looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### Step 6: Update Your Application

1. Open `Backend/.env` file (create from `Backend/env.example` if it doesn't exist)
2. Replace the `MONGODB_URI` with your connection string:
   ```env
   MONGODB_URI=mongodb+srv://examhalladmin:YourPassword@cluster0.xxxxx.mongodb.net/exam-hall-management?retryWrites=true&w=majority
   ```
3. Replace:
   - `<username>` with your database username
   - `<password>` with your database password (URL encode special characters)
   - Add `/exam-hall-management` before the `?` (or your preferred database name)

### Step 7: Seed Test Users

Run the seed script to create test users:

```bash
cd Backend
npm run seed-test-users
```

Or directly:
```bash
node Backend/scripts/seed-test-users.js
```

This will create:
- Admin user: `admin@test.com` / `admin123`
- Teacher user: `teacher@test.com` / `teacher123`
- Student user: `student@test.com` / `student123`
- Invigilator user: `invigilator@test.com` / `invigilator123`

### Step 8: Test Connection

1. Start your backend server:
   ```bash
   cd Backend
   npm start
   ```
2. You should see: `MongoDB Connected: cluster0-shard-00-00.xxxxx.mongodb.net`
3. Try logging in with test credentials

## 🔐 Security Best Practices

### For Production:

1. **Restrict IP Access:**
   - Remove `0.0.0.0/0` from Network Access
   - Add only your server's IP addresses

2. **Use Strong Passwords:**
   - Database user password should be complex
   - Use password manager to store credentials

3. **Environment Variables:**
   - Never commit `.env` files to Git
   - Use secure environment variable storage in deployment platforms

4. **Database User Permissions:**
   - Create specific users with limited permissions for different services
   - Don't use admin user for application connections

## 🐛 Troubleshooting

### Connection Timeout
- **Issue:** Can't connect to MongoDB Atlas
- **Solution:** 
  - Check Network Access IP whitelist
  - Verify connection string is correct
  - Check if cluster is running (not paused)

### Authentication Failed
- **Issue:** "Authentication failed" error
- **Solution:**
  - Verify username and password are correct
  - URL encode special characters in password (e.g., `@` becomes `%40`)
  - Check database user exists and is active

### Connection String Format
- **Issue:** Invalid connection string
- **Solution:**
  - Ensure format: `mongodb+srv://username:password@cluster/dbname?options`
  - Replace all placeholders with actual values
  - Don't include `<>` brackets in the actual connection string

### Password Special Characters
If your password contains special characters, URL encode them:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `&` → `%26`
- `+` → `%2B`
- `=` → `%3D`

## 📊 Monitoring Your Database

1. **View Collections:**
   - Go to "Collections" in MongoDB Atlas
   - Browse your database and collections
   - View documents directly in the web interface

2. **Monitor Performance:**
   - Check "Metrics" tab for connection stats
   - Monitor storage usage (free tier: 512MB)
   - View query performance

3. **Backup:**
   - Free tier includes automated backups
   - Can export data manually from Collections view

## 💰 Free Tier Limits

MongoDB Atlas Free (M0) tier includes:
- ✅ 512MB storage
- ✅ Shared RAM and vCPU
- ✅ Automated backups
- ✅ Basic monitoring
- ✅ Up to 500 connections

**Note:** Free tier is perfect for testing and small applications!

## 🎯 Next Steps

1. ✅ MongoDB Atlas cluster created
2. ✅ Database user configured
3. ✅ Network access configured
4. ✅ Connection string added to `.env`
5. ✅ Test users seeded
6. 🚀 **Deploy your application!**

See `TEST_CREDENTIALS.md` for login credentials and `DEPLOYMENT_GUIDE.md` for deployment instructions.

## 📞 Need Help?

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [MongoDB Connection String Guide](https://docs.mongodb.com/manual/reference/connection-string/)
- Check your application logs for specific error messages

---

**Your database is now ready for public testing!** 🎉

