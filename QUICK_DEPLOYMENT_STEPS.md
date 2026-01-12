# ⚡ Quick Deployment Steps

## 🎯 Prerequisites Checklist
- [ ] GitHub repository with your code
- [ ] Render account (free tier available)
- [ ] Netlify account (free tier available)
- [ ] MongoDB Atlas account (free tier available)

---

## 📦 Step 1: MongoDB Atlas Setup (5 minutes)

1. Go to [MongoDB Atlas](https://cloud.mongodb.com) and sign up
2. Create a **FREE (M0) Shared** cluster
3. Create database user:
   - Go to **Database Access** → **Add New Database User**
   - Username: `exam-hall-admin`
   - Password: Generate and **SAVE IT**
   - Privileges: **Atlas admin**
4. Configure network access:
   - Go to **Network Access** → **Add IP Address**
   - Click **"Allow Access from Anywhere"** (`0.0.0.0/0`)
5. Get connection string:
   - Go to **Database** → Click **"Connect"**
   - Choose **"Connect your application"**
   - Copy the connection string
   - Replace `<password>` with your password
   - Replace `<dbname>` with `exam-hall-management`

**Example:** `mongodb+srv://admin:YourPassword123@cluster0.xxxxx.mongodb.net/exam-hall-management?retryWrites=true&w=majority`

---

## 🖥️ Step 2: Deploy Backend to Render (10 minutes)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name:** `exam-hall-backend`
   - **Environment:** `Node`
   - **Region:** `Oregon (US West)` (or closest to you)
   - **Branch:** `main`
   - **Root Directory:** `Backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`

5. **Add Environment Variables** (click "Environment" tab):

```env
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/exam-hall-management?retryWrites=true&w=majority
JWT_SECRET=<generate-32-char-random-string>
JWT_EXPIRE=15m
JWT_REFRESH_SECRET=<generate-32-char-random-string>
JWT_REFRESH_EXPIRE=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
CORS_ORIGIN=https://your-app-name.netlify.app
FRONTEND_URL=https://your-app-name.netlify.app
APP_URL=https://your-app-name.netlify.app
INSTITUTE_NAME=Exam Hall Management System
```

**Generate secrets:** Run `openssl rand -base64 32` in terminal

6. Click **"Create Web Service"**
7. Wait for deployment (2-5 minutes)
8. **Copy your backend URL** (e.g., `https://exam-hall-backend.onrender.com`)

---

## 🌐 Step 3: Deploy Frontend to Netlify (10 minutes)

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect to GitHub and select your repository
4. Configure build settings:
   - **Base directory:** `Frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `Frontend/dist`

5. **Add Environment Variable:**
   - Go to **Site settings** → **Environment variables**
   - Add: `VITE_API_BASE_URL` = `https://your-backend-url.onrender.com/api`
   - Replace `your-backend-url.onrender.com` with your actual Render URL

6. Click **"Deploy site"**
7. Wait for deployment (2-3 minutes)
8. **Copy your frontend URL** (e.g., `https://exam-hall-management.netlify.app`)

---

## 🔄 Step 4: Update Backend CORS (2 minutes)

1. Go back to **Render Dashboard**
2. Update environment variables:
   - `CORS_ORIGIN` = Your Netlify URL
   - `FRONTEND_URL` = Your Netlify URL
3. Render will auto-redeploy

---

## ✅ Step 5: Test Your Deployment

1. Visit your frontend URL
2. Check browser console for errors
3. Try logging in (create admin user first if needed)
4. Test API connection:
   - Visit: `https://your-backend-url.onrender.com/health`
   - Should return: `{"success":true,"message":"Server is running"}`

---

## 🐛 Common Issues & Fixes

### Backend won't start
- Check Render logs for errors
- Verify all environment variables are set
- Ensure MongoDB connection string is correct

### CORS errors
- Verify `CORS_ORIGIN` matches your Netlify URL exactly
- No trailing slashes in URLs
- Redeploy backend after updating CORS

### Frontend can't connect to backend
- Check `VITE_API_BASE_URL` is set correctly
- Verify backend URL is accessible
- Rebuild frontend after changing environment variables

### Routes return 404
- Verify `_redirects` file exists in `Frontend/public/`
- Check `netlify.toml` configuration

---

## 📝 Environment Variables Reference

### Backend (Render)
```env
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<32-char-random>
JWT_REFRESH_SECRET=<32-char-random>
CORS_ORIGIN=https://your-app.netlify.app
FRONTEND_URL=https://your-app.netlify.app
```

### Frontend (Netlify)
```env
VITE_API_BASE_URL=https://your-backend.onrender.com/api
```

---

## 🎉 You're Done!

Your app is now live at:
- **Frontend:** `https://your-app-name.netlify.app`
- **Backend:** `https://your-backend-name.onrender.com`

For detailed instructions, see `DEPLOYMENT_GUIDE_RENDER_NETLIFY.md`
