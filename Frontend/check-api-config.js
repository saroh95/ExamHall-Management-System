/**
 * Quick script to check API configuration
 * Run this in browser console or Node.js to verify environment variables
 */

// Check if running in browser
if (typeof window !== 'undefined') {
  console.log('🌐 Browser Environment');
  console.log('API Base URL:', import.meta?.env?.VITE_API_BASE_URL || 'NOT SET (using default: http://localhost:5000/api)');
  console.log('All Vite env vars:', import.meta?.env);
} else {
  // Node.js environment
  console.log('🖥️  Node.js Environment');
  console.log('VITE_API_BASE_URL:', process.env.VITE_API_BASE_URL || 'NOT SET');
  console.log('All env vars:', process.env);
}

// Instructions
console.log(`
📋 Configuration Checklist:
1. ✅ Backend running? Test: curl http://localhost:5000/health
2. ✅ API Base URL set? Should be: http://localhost:5000/api (local) or https://your-backend.onrender.com/api (production)
3. ✅ Environment variable format? Must start with VITE_ for Vite
4. ✅ Dev server restarted? (Required after changing .env files)
5. ✅ Production rebuilt? (Required after changing Netlify env vars)

🔍 Debug Steps:
- Check browser console for "🔍 API Request Debug" logs
- Check Network tab for actual request URL
- Verify backend is accessible at the API_BASE_URL
`);
