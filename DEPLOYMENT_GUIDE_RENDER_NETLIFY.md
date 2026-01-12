# 🚀 Complete Deployment Guide: Render (Backend) + Netlify (Frontend)

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Backend Deployment on Render](#backend-deployment-on-render)
3. [Frontend Deployment on Netlify](#frontend-deployment-on-netlify)
4. [MongoDB Atlas Setup](#mongodb-atlas-setup)
5. [Environment Variables](#environment-variables)
6. [Code Changes Made](#code-changes-made)
7. [Troubleshooting](#troubleshooting)
8. [Post-Deployment Checklist](#post-deployment-checklist)

---

## Prerequisites

Before starting, ensure you have:
- ✅ GitHub account
- ✅ Render account (sign up at [render.com](https://render.com))
- ✅ Netlify account (sign up at [netlify.com](https://netlify.com))
- ✅ MongoDB Atlas account (sign up at [cloud.mongodb.com](https://cloud.mongodb.com))
- ✅ Your project pushed to a GitHub repository

---

## Backend Deployment on Render

### Step 1: Prepare Your Backend

1. **Ensure your backend is ready:**
   - Backend folder contains `package.json` with start script
   - `server.js` is the entry point
   - All dependencies are listed in `package.json`

### Step 2: Create Render Web Service

1. **Go to [Render Dashboard](https://dashboard.render.com)**
2. **Click "New +" → "Web Service"**
3. **Connect your GitHub repository**
4. **Configure the service:**
   - **Name:** `exam-hall-backend` (or your preferred name)
   - **Environment:** `Node`
   - **Region:** Choose closest to your users (e.g., `Oregon (US West)`)
   - **Branch:** `main` (or your main branch)
   - **Root Directory:** `Backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free` (or upgrade if needed)

### Step 3: Set Environment Variables in Render

Click on "Environment" tab and add these variables:

```env
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/exam-hall-management?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long-generate-randomly
JWT_EXPIRE=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-at-least-32-characters-long-generate-randomly
JWT_REFRESH_EXPIRE=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_SECURE=false
CORS_ORIGIN=https://your-app-name.netlify.app
FRONTEND_URL=https://your-app-name.netlify.app
APP_URL=https://your-app-name.netlify.app
INSTITUTE_NAME=Exam Hall Management System
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
MAX_FILE_SIZE=5242880
UPLOAD_PATH=uploads
BCRYPT_ROUNDS=12
LOG_LEVEL=info
DB_CONNECTION_TIMEOUT=30000
DB_SOCKET_TIMEOUT=45000
```

**Important Notes:**
- Replace `your-app-name.netlify.app` with your actual Netlify URL (you'll get this after deploying frontend)
- Generate strong secrets using: `openssl rand -base64 32`
- For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833) instead of your regular password

### Step 4: Deploy

1. Click "Create Web Service"
2. Render will automatically:
   - Clone your repository
   - Install dependencies
   - Start your server
3. Wait for deployment to complete (usually 2-5 minutes)
4. Copy your backend URL (e.g., `https://exam-hall-backend.onrender.com`)

### Step 5: Update CORS After Getting Frontend URL

After deploying frontend, update the `CORS_ORIGIN` and `FRONTEND_URL` environment variables in Render with your actual Netlify URL.

---

## Frontend Deployment on Netlify

### Step 1: Prepare Your Frontend

1. **Create `.env.production` file** (already created, see below)
2. **Ensure build works locally:**
   ```bash
   cd Frontend
   npm install
   npm run build
   ```

### Step 2: Create Netlify Site

1. **Go to [Netlify Dashboard](https://app.netlify.com)**
2. **Click "Add new site" → "Import an existing project"**
3. **Connect to GitHub** and select your repository
4. **Configure build settings:**
   - **Base directory:** `Frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `Frontend/dist`
   - **Node version:** `18` or `20` (set in Netlify environment variables)

### Step 3: Set Environment Variables in Netlify

Go to **Site settings → Environment variables** and add:

```env
VITE_API_BASE_URL=https://your-backend-url.onrender.com/api
```

**Important:** Replace `your-backend-url.onrender.com` with your actual Render backend URL.

### Step 4: Deploy

1. Click "Deploy site"
2. Netlify will:
   - Install dependencies
   - Build your React app
   - Deploy to CDN
3. Wait for deployment (usually 2-3 minutes)
4. Copy your frontend URL (e.g., `https://exam-hall-management.netlify.app`)

### Step 5: Update Backend CORS

Go back to Render dashboard and update:
- `CORS_ORIGIN` = Your Netlify URL
- `FRONTEND_URL` = Your Netlify URL

Then redeploy the backend (or it will auto-redeploy).

---

## MongoDB Atlas Setup

### Step 1: Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Sign up for free account
3. Create a new organization (or use default)

### Step 2: Create Cluster

1. Click "Build a Database"
2. Choose **FREE (M0) Shared** cluster
3. Select cloud provider and region (choose closest to Render region)
4. Name your cluster (e.g., `exam-hall-cluster`)
5. Click "Create"

### Step 3: Create Database User

1. Go to **Database Access** → **Add New Database User**
2. Choose **Password** authentication
3. Username: `exam-hall-admin` (or your choice)
4. Password: Generate secure password (save it!)
5. Set privileges: **Atlas admin** (or **Read and write to any database**)
6. Click "Add User"

### Step 4: Configure Network Access

1. Go to **Network Access** → **Add IP Address**
2. Click "Allow Access from Anywhere" (adds `0.0.0.0/0`)
3. Click "Confirm"

### Step 5: Get Connection String

1. Go to **Database** → Click "Connect" on your cluster
2. Choose **Connect your application**
3. Copy the connection string
4. Replace `<password>` with your database user password
5. Replace `<dbname>` with `exam-hall-management` (or your database name)

Example:
```
mongodb+srv://exam-hall-admin:YourPassword123@cluster0.xxxxx.mongodb.net/exam-hall-management?retryWrites=true&w=majority
```

### Step 6: Add to Render Environment Variables

Add the connection string to Render as `MONGODB_URI`.

---

## Environment Variables

### Backend (Render) - Complete List

```env
# Application
NODE_ENV=production
PORT=10000
APP_URL=https://your-app-name.netlify.app
INSTITUTE_NAME=Exam Hall Management System

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/exam-hall-management?retryWrites=true&w=majority
DB_CONNECTION_TIMEOUT=30000
DB_SOCKET_TIMEOUT=45000

# JWT
JWT_SECRET=generate-32-character-random-string-here
JWT_EXPIRE=15m
JWT_REFRESH_SECRET=generate-another-32-character-random-string-here
JWT_REFRESH_EXPIRE=7d

# Email (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_SECURE=false

# CORS
CORS_ORIGIN=https://your-app-name.netlify.app
FRONTEND_URL=https://your-app-name.netlify.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=uploads

# Security
BCRYPT_ROUNDS=12

# Logging
LOG_LEVEL=info
```

### Frontend (Netlify) - Complete List

```env
VITE_API_BASE_URL=https://your-backend-url.onrender.com/api
```

**Note:** In Netlify, environment variables starting with `VITE_` are automatically available in your build.

---

## Code Changes Made

### 1. Updated CORS Configuration (`Backend/config/cors.js`)
- Now supports `FRONTEND_URL` environment variable
- Automatically allows Netlify URLs in production

### 2. Created `render.yaml`
- Automated deployment configuration for Render
- Defines build and start commands

### 3. Created `netlify.toml`
- Netlify build configuration
- Specifies build directory and commands
- Configures redirects for SPA routing

### 4. Updated `_redirects` file
- Ensures React Router works correctly on Netlify
- Handles all routes properly

### 5. Created `.env.example` files
- Template for environment variables
- Helps with configuration

---

## Troubleshooting

### Backend Issues

#### Issue: Build fails on Render
**Solution:**
- Check build logs in Render dashboard
- Ensure `package.json` has correct `start` script
- Verify Node version compatibility (Render uses Node 18 by default)

#### Issue: Database connection fails
**Solution:**
- Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Check connection string format
- Ensure database user has correct permissions
- Check Render logs for specific error messages

#### Issue: CORS errors
**Solution:**
- Verify `CORS_ORIGIN` in Render matches your Netlify URL exactly
- Check `FRONTEND_URL` is set correctly
- Ensure no trailing slashes in URLs
- Redeploy backend after updating CORS variables

#### Issue: Server goes to sleep (Free tier)
**Solution:**
- Render free tier services sleep after 15 minutes of inactivity
- First request after sleep takes ~30 seconds (cold start)
- Consider upgrading to paid plan for always-on service
- Or use a ping service to keep it awake

### Frontend Issues

#### Issue: Build fails on Netlify
**Solution:**
- Check build logs in Netlify dashboard
- Verify Node version (set `NODE_VERSION=18` in environment variables)
- Ensure all dependencies are in `package.json`
- Check for TypeScript/ESLint errors

#### Issue: API calls fail (404 or CORS)
**Solution:**
- Verify `VITE_API_BASE_URL` is set correctly in Netlify
- Check backend URL is accessible (visit in browser)
- Ensure backend CORS allows your Netlify domain
- Rebuild frontend after changing environment variables

#### Issue: Routes don't work (404 on refresh)
**Solution:**
- Verify `_redirects` file exists in `Frontend/public/`
- Check `netlify.toml` has correct redirect configuration
- Ensure `_redirects` is copied to `dist` folder during build

#### Issue: Environment variables not working
**Solution:**
- Variables must start with `VITE_` to be available in Vite builds
- Rebuild after adding/changing environment variables
- Check Netlify build logs to see if variables are injected

---

## Post-Deployment Checklist

### Backend (Render)
- [ ] Backend URL is accessible (visit `/health` endpoint)
- [ ] Database connection successful (check Render logs)
- [ ] CORS configured with frontend URL
- [ ] Environment variables all set correctly
- [ ] Health check endpoint returns 200 OK

### Frontend (Netlify)
- [ ] Frontend URL loads correctly
- [ ] Login page displays
- [ ] API calls work (check browser console)
- [ ] Routes work on refresh (no 404 errors)
- [ ] Environment variables set correctly

### Testing
- [ ] Can login with admin credentials
- [ ] Can create/view students
- [ ] Can create/view teachers
- [ ] Can create/view subjects
- [ ] Can create/view classrooms
- [ ] Can schedule exams
- [ ] File uploads work
- [ ] Email notifications work (if configured)

### Security
- [ ] Strong JWT secrets generated
- [ ] Database password is secure
- [ ] CORS only allows frontend domain
- [ ] No sensitive data in code/logs
- [ ] HTTPS enabled (automatic on Render/Netlify)

---

## Quick Reference URLs

After deployment, you'll have:
- **Backend URL:** `https://your-backend-name.onrender.com`
- **Frontend URL:** `https://your-app-name.netlify.app`
- **Health Check:** `https://your-backend-name.onrender.com/health`
- **API Base:** `https://your-backend-name.onrender.com/api`

---

## Support & Resources

- **Render Docs:** [https://render.com/docs](https://render.com/docs)
- **Netlify Docs:** [https://docs.netlify.com](https://docs.netlify.com)
- **MongoDB Atlas Docs:** [https://docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)
- **Vite Environment Variables:** [https://vitejs.dev/guide/env-and-mode.html](https://vitejs.dev/guide/env-and-mode.html)

---

## Cost Estimate

### Free Tier (Sufficient for Testing/Demo)
- **Render:** Free tier available (services sleep after inactivity)
- **Netlify:** 100GB bandwidth/month, unlimited builds
- **MongoDB Atlas:** 512MB storage, shared cluster

### Paid Options (If Needed)
- **Render:** $7/month for always-on service
- **Netlify:** $19/month for Pro plan
- **MongoDB Atlas:** $9/month for dedicated cluster

---

## Next Steps After Deployment

1. **Test all features** thoroughly
2. **Create admin user** using backend script
3. **Set up demo data** if needed
4. **Configure custom domain** (optional)
5. **Set up monitoring** (optional)
6. **Share URL** with stakeholders

---

**🎉 Congratulations! Your Exam Hall Management System is now live!**

For any issues, check the troubleshooting section or review the deployment logs in Render/Netlify dashboards.
