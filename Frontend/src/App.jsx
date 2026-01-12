import NotificationPreview from './pages/Notify';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Signup from './pages/Signup';
import Students from './pages/Students';
import Teachers from './pages/Teachers';
import Subjects from './pages/Subjects';
import Classrooms from './pages/Classrooms';
import Enrollments from './pages/Enrollments';
// import ExamScheduler from './pages/ExamScheduler';
import UnifiedExamScheduler from './pages/UnifiedExamScheduler';
import Settings from './pages/Settings';
import Users from './pages/Users';
import BulkUploadPage from './pages/BulkUploadPage';
import AttendancePage from './pages/Attendance';
import { UserProvider, useUser } from './context/UserContext';
import Notifications from './pages/Notifications';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useUser();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Role-based Protected Route Component
const RoleProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, loading } = useUser();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!currentUser || !allowedRoles.includes(currentUser.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
          <button 
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  return children;
};

// App Routes Component
const AppRoutes = () => {
  const { currentUser } = useUser();
  const role = currentUser?.role;
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected Routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      }>
        <Route index element={null} />
        <Route path="dashboard" element={null} />
        {/* Admin Routes */}
        <Route path="students" element={
          <RoleProtectedRoute allowedRoles={['admin', 'teacher']}>
            <Students />
          </RoleProtectedRoute>
        } />
        <Route path="students/bulk-upload" element={
          <RoleProtectedRoute allowedRoles={['admin']}>
            <BulkUploadPage />
          </RoleProtectedRoute>
        } />
        <Route path="teachers" element={
          <RoleProtectedRoute allowedRoles={['admin']}>
            <Teachers />
          </RoleProtectedRoute>
        } />
        <Route path="subjects" element={
          <RoleProtectedRoute allowedRoles={['admin', 'teacher']}>
            <Subjects />
          </RoleProtectedRoute>
        } />
        <Route path="classrooms" element={
          <RoleProtectedRoute allowedRoles={['admin', 'teacher']}>
            <Classrooms />
          </RoleProtectedRoute>
        } />
        <Route path="enrollments" element={
          <RoleProtectedRoute allowedRoles={['admin']}>
            <Enrollments />
          </RoleProtectedRoute>
        } />
        {/* <Route path="exam-scheduler" element={
          <RoleProtectedRoute allowedRoles={['admin']}>
            <ExamScheduler />
          </RoleProtectedRoute>
        } /> */}
        <Route path="unified-exam-scheduler" element={
          <RoleProtectedRoute allowedRoles={['admin', 'teacher']}>
            <UnifiedExamScheduler />
          </RoleProtectedRoute>
        } />
        <Route path="users" element={
          <RoleProtectedRoute allowedRoles={['admin']}>
            <Users />
          </RoleProtectedRoute>
        } />
        <Route path="notify" element={
          <RoleProtectedRoute allowedRoles={['admin', 'teacher']}>
            <NotificationPreview />
          </RoleProtectedRoute>
        } />
        <Route path="attendance" element={
          <RoleProtectedRoute allowedRoles={['admin', 'teacher']}>
            <AttendancePage />
          </RoleProtectedRoute>
        } />
        <Route path="settings" element={
          <RoleProtectedRoute allowedRoles={['admin', 'teacher', 'student']}>
            <Settings />
          </RoleProtectedRoute>
        } />
        <Route path="notifications" element={
          <RoleProtectedRoute allowedRoles={['admin', 'user']}>
            <Notifications />
          </RoleProtectedRoute>
        } />
      </Route>

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <AppRoutes />
        </div>
        
        {/* Toast Container for notifications */}
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;
