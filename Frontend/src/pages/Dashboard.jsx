import React, { useState, useEffect, useRef, Suspense } from 'react';
import { 
  FiLogOut, FiMenu, FiX, FiHome, FiUsers, 
  FiBook, FiUser, FiCalendar, FiLock, FiSettings,
  FiLayers, FiClock, FiBell, FiDownload, FiEye, FiCheckCircle, FiUserCheck
} from 'react-icons/fi';
import { Link, useNavigate, Outlet, useLocation, useMatch } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { dashboardAPI, TokenManager } from '../services/api';
import unifiedExamSchedulerAPI from '../services/unifiedExamSchedulerAPI';
import api from '../services/api';
import TimetableView from '../components/ExamTimetable/TimetableView';
const LazyAttendanceList = React.lazy(() => import('../components/Attendance/AttendanceList'));
import { hasModuleAccess } from '../utils/permissions';
import { formatTimeRange } from '../utils/timeFormatter';

// Import the modular panels
import NotificationPanel from '../components/NotificationPanel'; // Adjust the path if needed
import ProfilePanel from '../components/ProfilePanel'; // Adjust the path if needed

// NavLink Component
const NavLink = ({ to, icon, text, active = false }) => (
  <Link
    to={to}
    className={`flex items-center px-4 py-3 text-base font-medium ${
      active 
        ? 'text-white bg-blue-700' 
        : 'text-blue-200 hover:text-white hover:bg-blue-700'
    } rounded-lg transition-colors duration-200`}
  >
    {React.cloneElement(icon, { className: 'mr-4 h-6 w-6' })}
    {text}
  </Link>
);

// StatCard Component
const StatCard = ({ icon, title, value, link, trend, color, large = false }) => (
  <Link to={link} className={`bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200 ${large ? 'h-full' : ''}`}>
    <div className="px-4 py-5 sm:p-6">
      <div className="flex items-center">
        <div className={`flex-shrink-0 ${color} rounded-md p-3`}>
          {icon}
        </div>
        <div className="ml-5 w-0 flex-1">
          <dt className="text-sm font-medium text-gray-500 truncate">
            {title}
          </dt>
          <dd className="flex items-baseline">
            <div className="text-2xl font-semibold text-gray-900">
              {value}
            </div>
            {trend && (
              <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                {trend}
              </div>
            )}
          </dd>
        </div>
      </div>
    </div>
  </Link>
);

// QuickAction Component
const QuickAction = ({ icon, title, link, color }) => (
  <Link to={link} className={`${color} rounded-lg shadow p-4 hover:shadow-md transition-shadow duration-200 flex items-center`}>
    <div className="flex-shrink-0">{icon}</div>
    <div className="ml-3">
      <h3 className="text-sm font-medium">{title}</h3>
    </div>
  </Link>
);

const Dashboard = () => {
  const location = useLocation();
  const isDashboardHome = !!useMatch('/dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [showProfilePanel, setShowProfilePanel] = useState(false);

  const [stats, setStats] = useState({
    teachers: 0,
    students: 0,
    subjects: 0,
    classrooms: 0,
    exams: 0,
    upcomingExams: 0,
    notifications: 0,
    messages: 0,
    upcomingExamList: [],
    recentActivities: [],
    loading: true,
    error: null
  });
  const [selectedExam, setSelectedExam] = useState(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [attendanceExamDetails, setAttendanceExamDetails] = useState(null);
  const [modalTimetableExams, setModalTimetableExams] = useState([]);
  const [modalTimetableLoading, setModalTimetableLoading] = useState(false);
  const [modalTimetableError, setModalTimetableError] = useState(null);
  const [selectedSemesterForSeating, setSelectedSemesterForSeating] = useState('1');
  const [seatingPreview, setSeatingPreview] = useState(null); // { dateRange, time, departments: { CSE: [ ... ], ... } }
  const [seatingLoading, setSeatingLoading] = useState(false);
  const [seatingError, setSeatingError] = useState(null);
  const [showSeatingModal, setShowSeatingModal] = useState(false);

  const { logout, currentUser } = useUser();
  const navigate = useNavigate();

  // Add a new exam to the dashboard's upcomingExamList
  const addExamToDashboard = (exam) => {
    setStats(prev => ({
      ...prev,
      upcomingExamList: [
        ...prev.upcomingExamList,
        exam
      ]
    }));
  };

  const notificationPanelRef = useRef();
  const profilePanelRef = useRef();

  // Fetch dashboard data from backend
  const fetchDashboardData = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true, error: null }));
      
      // Fetch all dashboard data in parallel
      const [statsResponse, examStatsResponse, activityResponse] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getExamStats(),
        dashboardAPI.getRecentActivities()
      ]);

      const dashboardStats = statsResponse.data.data;
      const examStats = examStatsResponse.data.data;
      const activities = activityResponse.data.data;


      // Build upcoming exams list (show ALL upcoming exams, uniquely by semester)
      const buildUpcomingList = (upcomingArr = []) => {
        const seenIds = new Set((JSON.parse(localStorage.getItem('seenUpcomingExamIds') || '[]')));
        const now = Date.now();
        const TWO_DAYS = 1000 * 60 * 60 * 48;
        
        // Group by semester to avoid duplicates
        const bySemester = {};
        console.log('🔍 Processing exams for upcoming list:', upcomingArr.length);
        (upcomingArr || []).forEach((exam, idx) => {
          const semesterLabel = exam.semester || exam.subject?.semester || 'Semester 1';
          const semNumMatch = String(semesterLabel).match(/(\d+)/);
          const semesterNumber = semNumMatch ? semNumMatch[1] : '1';
          const key = semesterNumber;
          
          if (idx < 5) {
            console.log(`  Exam ${idx + 1}:`, {
              subject: exam.subject?.code,
              semester: semesterLabel,
              semesterNumber,
              examDate: exam.examDate,
              type: exam.type
            });
          }
          
          if (!bySemester[key]) {
            const dateObj = new Date(exam.examDate || exam.date);
            const createdAtMs = exam.createdAt ? new Date(exam.createdAt).getTime() : null;
            const id = exam._id || exam.id || `sem-${semesterNumber}-${exam.type || 'exam'}`;
            
            bySemester[key] = {
              id,
              type: exam.type || 'End Semester Exam',
              semesterLabel,
              semesterNumber,
              dateObj,
              startDate: isNaN(dateObj) ? '' : dateObj.toLocaleDateString(),
              endDate: isNaN(dateObj) ? '' : dateObj.toLocaleDateString(),
              createdAtMs,
              isNew: false
            };
          } else {
            // Update date range if this exam has earlier/later date
            const dateObj = new Date(exam.examDate || exam.date);
            if (!isNaN(dateObj)) {
              if (dateObj < bySemester[key].dateObj) {
                bySemester[key].dateObj = dateObj;
                bySemester[key].startDate = dateObj.toLocaleDateString();
              }
              if (dateObj > new Date(bySemester[key].endDate)) {
                bySemester[key].endDate = dateObj.toLocaleDateString();
              }
            }
          }
        });
        
        // Convert to array and mark as new
        const list = Object.values(bySemester).map(exam => {
          const isNewByTime = exam.createdAtMs ? (now - exam.createdAtMs) < TWO_DAYS : false;
          const isNewBySeen = !seenIds.has(exam.id);
          return {
            ...exam,
            isNew: isNewByTime || isNewBySeen
          };
        }).sort((a, b) => parseInt(a.semesterNumber) - parseInt(b.semesterNumber));
        
        console.log('📊 Grouped by semester:', Object.keys(bySemester).sort((a, b) => parseInt(a) - parseInt(b)).join(', '));
        console.log('📋 Final list:', list.map(e => `Sem ${e.semesterNumber}: ${e.type}`).join(', '));
        
        try { localStorage.setItem('seenUpcomingExamIds', JSON.stringify(list.map(x => x.id))); } catch (e) { /* ignore */ }
        return list;
      };

      // Always fetch ALL scheduled exams directly (not limited to 30 days)
      let groupedUpcoming = [];
      try {
        const directExamsResp = await api.get('/unified-exam-scheduler/exams');
        const directExams = directExamsResp.data?.data || [];
        // Filter to only scheduled/active future exams
        const now = new Date();
        const filtered = directExams.filter(e => {
          if (!e) return false;
          if (e.status && e.status !== 'scheduled') return false;
          if (e.isActive === false) return false;
          if (!e.examDate) return true;
          const d = new Date(e.examDate);
          return !isNaN(d) ? d >= now : true;
        });
        groupedUpcoming = buildUpcomingList(filtered);
        console.log('📅 Fetched upcoming exams:', {
          total: directExams.length,
          filtered: filtered.length,
          grouped: groupedUpcoming.length,
          semesters: groupedUpcoming.map(e => e.semesterNumber).join(', ')
        });
      } catch (e) {
        console.warn('Failed to fetch scheduled exams, falling back to dashboard API:', e);
        // Fallback to dashboard API (limited to 30 days) if direct fetch fails
        groupedUpcoming = buildUpcomingList(examStats.upcoming);
      }

      setStats(prev => ({
        ...prev,
        teachers: dashboardStats.overview.totalTeachers || 0,
        students: dashboardStats.overview.totalStudents || 0,
        subjects: dashboardStats.overview.totalSubjects || 0,
        classrooms: dashboardStats.overview.totalClassrooms || 0,
        exams: dashboardStats.overview.totalExams || 0,
        upcomingExams: dashboardStats.active.upcomingExams || 0,
        notifications: activities.summary?.recentStudents + activities.summary?.recentTeachers + activities.summary?.recentExams || 0,
        messages: 0,
        upcomingExamList: groupedUpcoming,
        recentActivities: activities.activities?.slice(0, 10).map((activity, index) => ({
          id: index + 1,
          message: `${activity.action} ${activity.type}: ${activity.name}`,
          time: new Date(activity.date).toLocaleDateString()
        })) || [],
        loading: false,
        error: null
      }));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setStats(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to load dashboard data'
      }));
    }
  };

  useEffect(() => {
    if (isDashboardHome) {
      // Debug authentication status
      const token = sessionStorage.getItem('accessToken');
      console.log('🔐 Dashboard Auth Debug:', {
        isAuthenticated: !!token,
        token: token ? `${token.substring(0, 20)}...` : 'None',
        tokenExpired: token ? TokenManager.isTokenExpired(token) : 'N/A',
        currentUser: currentUser
      });
      
      fetchDashboardData();
    }
  }, [isDashboardHome]);

  // Auto-refresh when window regains focus and periodically while on dashboard
  useEffect(() => {
    if (!isDashboardHome) return;

    const handleFocus = () => fetchDashboardData();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchDashboardData();
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    const intervalId = setInterval(() => {
      fetchDashboardData();
    }, 60000); // refresh every 60s

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(intervalId);
    };
  }, [isDashboardHome]);

  // When opening Upcoming Exam Details, fetch full timetable for that semester
  useEffect(() => {
    const fetchModalTimetable = async () => {
      if (!selectedExam || !selectedExam.semesterNumber) return;
      try {
        setModalTimetableLoading(true);
        setModalTimetableError(null);
        const response = await api.get('/unified-exam-scheduler/exams', {
          params: { semester: selectedExam.semesterNumber }
        });
        setModalTimetableExams(response.data?.data || []);
      } catch (err) {
        console.error('Error fetching modal timetable exams:', err);
        setModalTimetableError(err.message || 'Failed to load timetable');
      } finally {
        setModalTimetableLoading(false);
      }
    };

    fetchModalTimetable();
  }, [selectedExam]);

  // Fetch department-wise seating arrangement preview for selected semester (combines ALL exams to show all departments)
  useEffect(() => {
    const fetchSeating = async () => {
      try {
        setSeatingLoading(true);
        setSeatingError(null);
        const resp = await api.get('/unified-exam-scheduler/exams', { params: { semester: selectedSemesterForSeating } });
        const exams = resp.data?.data || [];
        if (exams.length === 0) {
          setSeatingPreview(null);
          setSeatingLoading(false);
          return;
        }
        // Determine date range and time string (assuming consistent slot)
        const dates = exams.map(e => new Date(e.examDate)).filter(d => !isNaN(d));
        const minDate = dates.length ? new Date(Math.min(...dates)) : null;
        const maxDate = dates.length ? new Date(Math.max(...dates)) : null;
        const time = formatTimeRange(exams[0].startTime || '10:00', exams[0].endTime || '13:00');
        
        // Fetch detailed seating for ALL exams to get complete department coverage
        const departmentsMap = {};
        const seenStudents = new Set(); // Track students to avoid duplicates
        
        console.log(`📊 Fetching seating from ${exams.length} exams for semester ${selectedSemesterForSeating}...`);
        
        for (const exam of exams) {
          try {
            const detailsRes = await unifiedExamSchedulerAPI.getExamDetails(exam._id);
            const detailedExam = detailsRes?.data || detailsRes; // service returns .data
            
            (detailedExam.classrooms || []).forEach(cls => {
              const seating = cls.seatingArrangement || [];
              const assigned = cls.assignedStudents || [];
              
              seating.forEach(seat => {
                const stu = assigned.find(s => String(s._id) === String(seat.student));
                if (!stu) return;
                
                // Skip if we've already added this student (from another exam)
                const studentKey = `${stu._id}_${cls.classroom?._id || cls.classroom?.name}`;
                if (seenStudents.has(studentKey)) return;
                seenStudents.add(studentKey);
                
                const dept = (stu.department && (stu.department.code || stu.department.name)) || 'UNKNOWN';
                if (!departmentsMap[dept]) departmentsMap[dept] = [];
                departmentsMap[dept].push({
                  seatNumber: seat.seatNumber,
                  scholarId: stu.scholarId,
                  fullName: stu.fullName,
                  classroom: cls.classroom?.name || 'TBD',
                  subjectCode: exam.subject?.code || 'N/A'
                });
              });
            });
          } catch (examErr) {
            console.error(`Error fetching exam ${exam._id}:`, examErr);
            // Continue with other exams
          }
        }
        
        console.log(`✅ Found ${Object.keys(departmentsMap).length} departments with seating`);
        Object.entries(departmentsMap).forEach(([dept, students]) => {
          console.log(`   ${dept}: ${students.length} students`);
        });
        
        // Sort each dept by scholarId
        Object.values(departmentsMap).forEach(list => list.sort((a, b) => String(a.scholarId).localeCompare(String(b.scholarId))));
        
        setSeatingPreview({
          dateRange: minDate && maxDate ? `${minDate.toLocaleDateString()} to ${maxDate.toLocaleDateString()}` : '',
          time,
          departments: departmentsMap
        });
      } catch (err) {
        console.error('Error fetching seating preview:', err);
        setSeatingError(err.message || 'Failed to load seating');
      } finally {
        setSeatingLoading(false);
      }
    };
    fetchSeating();
  }, [selectedSemesterForSeating, isDashboardHome]);

  useEffect(() => {
    if (!showNotificationPanel) return;
    function handleClick(event) {
      if (
        notificationPanelRef.current &&
        !notificationPanelRef.current.contains(event.target)
      ) {
        setShowNotificationPanel(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showNotificationPanel]);

  useEffect(() => {
    if (!showProfilePanel) return;
    function handleClick(event) {
      if (
        profilePanelRef.current &&
        !profilePanelRef.current.contains(event.target)
      ) {
        setShowProfilePanel(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showProfilePanel]);

  const handleLogout = () => setShowLogoutModal(true);

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  const cancelLogout = () => setShowLogoutModal(false);

  const downloadSchedule = (exam) => {
    if (!exam) return;
    const csvRows = [
      ['Subject', 'Date', 'Time', 'Room'],
      ...exam.details.map(d => [d.subject, d.date, d.time, d.room])
    ];
    const csvContent = csvRows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${exam.type}_Exam_Schedule.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleProfile = () => {
    navigate('/settings', { state: { tab: 'profile' } });
    setShowProfilePanel(false);
  };

  const handleSettings = () => {
    navigate('/settings');
    setShowProfilePanel(false);
  };

  const handleMarkAllRead = () => {
    setStats((prev) => ({
      ...prev,
      notifications: 0,
      recentActivities: prev.recentActivities.map((n) => ({
        ...n,
        type: 'read'
      }))
    }));
  };

  const user = currentUser || { name: 'Admin', email: 'admin@example.com' };

  return (
    <>
    <div className="flex h-screen bg-gray-50">
      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Logout</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to log out?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelLogout}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={isLoggingOut}
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center"
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logging Out...
                  </>
                ) : (
                  'Logout'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    {showAttendanceModal && attendanceExamDetails && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-5xl max-h-[85vh] overflow-y-auto">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <h3 className="text-xl font-bold">Attendance - {attendanceExamDetails.name}</h3>
              <p className="text-sm text-gray-600">{attendanceExamDetails.date} • {attendanceExamDetails.startTime} - {attendanceExamDetails.endTime}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-2 text-sm bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
                onClick={() => setShowAttendanceModal(false)}
              >
                Close
              </button>
            </div>
          </div>
          <div className="bg-white rounded border border-gray-200 p-2">
            {attendanceExamDetails?.id ? (
              (
                <Suspense fallback={<div className="text-sm text-gray-500">Loading attendance...</div>}>
                  <LazyAttendanceList
                    examId={attendanceExamDetails.id}
                    examDetails={attendanceExamDetails}
                  />
                </Suspense>
              )
            ) : (
              <div className="text-sm text-gray-500">No exam selected for attendance.</div>
            )}
          </div>
        </div>
      </div>
    )}

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
          <div className="relative flex flex-col flex-1 w-full max-w-xs bg-gradient-to-b from-blue-800 to-indigo-900">
            <div className="absolute top-0 right-0 pt-4 pr-4">
              <button
                type="button"
                className="text-white hover:text-gray-300"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <FiX className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center justify-center px-4">
                <div className="text-white font-bold text-xl">EXAM HALL MANAGEMENT SYSTEM</div>
              </div>
            <nav className="mt-8 px-2 space-y-1">
                <NavLink to="/dashboard" icon={<FiHome />} text="Dashboard" active={isDashboardHome} />
                
                {/* Dynamic Navigation based on permissions */}
                {currentUser && hasModuleAccess(currentUser, 'teachers') && (
                  <NavLink to="/teachers" icon={<FiUser />} text="Teachers" />
                )}
                {currentUser && hasModuleAccess(currentUser, 'students') && (
                  <NavLink to="/students" icon={<FiUsers />} text="Students" />
                )}
                {currentUser && hasModuleAccess(currentUser, 'subjects') && (
                  <NavLink to="/subjects" icon={<FiBook />} text="Subjects" />
                )}
                {currentUser && hasModuleAccess(currentUser, 'classrooms') && (
                  <NavLink to="/classrooms" icon={<FiLayers />} text="Classrooms" />
                )}
                {currentUser && hasModuleAccess(currentUser, 'enrollments') && (
                  <NavLink to="/enrollments" icon={<FiCheckCircle />} text="Enrollments" />
                )}
                {currentUser && hasModuleAccess(currentUser, 'exams') && (
                  <NavLink to="/attendance" icon={<FiUserCheck />} text="Attendance" />
                )}
                {/* {currentUser && currentUser.role === 'admin' && (
                  <NavLink to="/exam-scheduler" icon={<FiCalendar />} text="Exam Scheduler (Old)" />
                )} */}
                {currentUser && hasModuleAccess(currentUser, 'exams') && (
                  <NavLink to="/unified-exam-scheduler" icon={<FiCalendar />} text="Exams" />
                )}
                {currentUser && hasModuleAccess(currentUser, 'users') && (
                  <NavLink to="/users" icon={<FiLock />} text="Users" />
                )}
                {currentUser && hasModuleAccess(currentUser, 'notifications') && (
                  <NavLink to="/notifications" icon={<FiBell />} text="Notifications" />
                )}
                {currentUser && (currentUser.role === 'admin' || hasModuleAccess(currentUser, 'settings')) && (
                  <NavLink to="/settings" icon={<FiSettings />} text="Settings" />
                )}
              </nav>
            </div>
            <div className="p-4 border-t border-blue-700">
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-base font-medium text-blue-200 hover:text-white hover:bg-blue-700 rounded-lg"
              >
                <FiLogOut className="mr-4 h-6 w-6" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 bg-gradient-to-b from-blue-800 to-indigo-900">
          <div className="flex flex-col flex-1 pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center justify-center flex-shrink-0 px-4">
              <div className="text-white font-bold text-xl">EXAM HALL MANAGEMENT SYSTEM</div>
            </div>
              <nav className="mt-8 flex-1 px-2 space-y-1">
              <NavLink to="/dashboard" icon={<FiHome />} text="Dashboard" active={isDashboardHome} />
              
              {/* Dynamic Navigation based on permissions */}
              {currentUser && hasModuleAccess(currentUser, 'teachers') && (
                <NavLink to="/teachers" icon={<FiUser />} text="Teachers" />
              )}
              {currentUser && hasModuleAccess(currentUser, 'students') && (
                <NavLink to="/students" icon={<FiUsers />} text="Students" />
              )}
              {currentUser && hasModuleAccess(currentUser, 'subjects') && (
                <NavLink to="/subjects" icon={<FiBook />} text="Subjects" />
              )}
              {currentUser && hasModuleAccess(currentUser, 'classrooms') && (
                <NavLink to="/classrooms" icon={<FiLayers />} text="Classrooms" />
              )}
              {currentUser && hasModuleAccess(currentUser, 'enrollments') && (
                <NavLink to="/enrollments" icon={<FiCheckCircle />} text="Enrollments" />
              )}
              {currentUser && hasModuleAccess(currentUser, 'exams') && (
                <NavLink to="/attendance" icon={<FiUserCheck />} text="Attendance" />
              )}
              {/* {currentUser && currentUser.role === 'admin' && (
                <NavLink to="/exam-scheduler" icon={<FiCalendar />} text="Exam Scheduler (Old)" />
              )} */}
              {currentUser && hasModuleAccess(currentUser, 'exams') && (
                <NavLink to="/unified-exam-scheduler" icon={<FiCalendar />} text="Exams" />
              )}
              {currentUser && hasModuleAccess(currentUser, 'users') && (
                <NavLink to="/users" icon={<FiLock />} text="Users" />
              )}
              {currentUser && hasModuleAccess(currentUser, 'notifications') && (
                <NavLink to="/notifications" icon={<FiBell />} text="Notifications" />
              )}
              {currentUser && (currentUser.role === 'admin' || hasModuleAccess(currentUser, 'settings')) && (
                <NavLink to="/settings" icon={<FiSettings />} text="Settings" />
              )}
            </nav>
          </div>
          <div className="p-4 border-t border-blue-700">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-base font-medium text-blue-200 hover:text-white hover:bg-blue-700 rounded-lg"
            >
              <FiLogOut className="mr-4 h-6 w-6" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        {/* Top header */}
        <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3">
          <button
            type="button"
            className="text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <FiMenu className="h-6 w-6" />
          </button>
        </div>
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isDashboardHome ? 'Dashboard' : location.pathname.split('/').pop()}
              </h1>
              <div className="text-sm text-gray-500 mt-1">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Notification Bell */}
              <div className="relative" ref={notificationPanelRef}>
                <button
                  className="p-2 text-gray-500 hover:text-gray-600 relative"
                  onClick={() => setShowNotificationPanel((open) => !open)}
                >
                  <FiBell className="h-6 w-6" />
                  {stats.notifications > 0 && !stats.loading && (
                    <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {stats.notifications}
                    </span>
                  )}
                </button>
                {showNotificationPanel && (
                 <NotificationPanel
                  notifications={stats.recentActivities}
                  user={user}
                  onProfile={handleProfile}
                  onSettings={handleSettings}
                  onLogout={handleLogout}
                  onMarkAllRead={handleMarkAllRead} // <-- Pass the handler here
/>

                )}
              </div>
              {/* Profile Icon */}
              <div className="relative" ref={profilePanelRef}>
                <button
                  className="p-2 text-gray-500 hover:text-gray-600 rounded-full border border-gray-200"
                  onClick={() => setShowProfilePanel(o => !o)}
                >
                  <FiUser className="h-6 w-6" />
                </button>
                {showProfilePanel && (
                  <ProfilePanel
                    user={user}
                    onProfile={handleProfile}
                    onSettings={handleSettings}
                    onLogout={handleLogout}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none bg-gray-50">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {isDashboardHome ? (
                <div className="space-y-8">
                  {/* Welcome Banner */}
                  <div className="bg-white shadow rounded-lg p-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome to Dashboard!</h1>
                    <p className="text-gray-600">Manage your exam hall system efficiently</p>
                  </div>
                  {/* Seating Arrangement Section */}
                  <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-gray-800">Seating Arrangement (Department-wise)</h2>
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">Semester:</label>
                        <select
                          className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                          value={selectedSemesterForSeating}
                          onChange={(e) => setSelectedSemesterForSeating(e.target.value)}
                        >
                          {['1','2','3','4','5','6','7','8'].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <button
                          className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                          onClick={() => setShowSeatingModal(true)}
                          disabled={seatingLoading || !seatingPreview}
                        >
                          View Seating
                        </button>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                      {seatingLoading ? (
                        <div className="text-sm text-gray-500">Loading seating arrangement...</div>
                      ) : seatingError ? (
                        <div className="text-sm text-red-600">{seatingError}</div>
                      ) : seatingPreview ? (
                        <div className="text-sm text-gray-700">
                          <div className="mb-2"><span className="font-medium">Date Range:</span> {seatingPreview.dateRange || '—'}</div>
                          <div className="mb-4"><span className="font-medium">Time:</span> {seatingPreview.time}</div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {Object.keys(seatingPreview.departments).slice(0,6).map((dept) => (
                              <div key={dept} className="border border-gray-200 rounded p-3">
                                <div className="font-semibold mb-2">{dept}</div>
                                <div className="text-xs text-gray-500">{seatingPreview.departments[dept].length} students</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">No seating data found for selected semester.</div>
                      )}
                    </div>
                  </div>
                  {/* Loading State */}
                  {stats.loading && (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white overflow-hidden shadow rounded-lg animate-pulse">
                          <div className="px-4 py-5 sm:p-6">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 bg-gray-200 rounded-md p-3 w-12 h-12"></div>
                              <div className="ml-5 w-0 flex-1">
                                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                                <div className="h-8 bg-gray-200 rounded w-16"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Error State */}
                  {stats.error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">Error loading dashboard data</h3>
                          <p className="text-sm text-red-700 mt-1">{stats.error}</p>
                          <button
                            onClick={fetchDashboardData}
                            className="mt-2 text-sm text-red-800 hover:text-red-900 underline"
                          >
                            Try again
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Stats Cards */}
                  {!stats.loading && !stats.error && (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                      <StatCard 
                        icon={<FiUser className="h-6 w-6 text-blue-500" />}
                        title="Teachers"
                        value={stats.teachers}
                        link="/teachers"
                        trend={"Active: " + (stats.teachers > 0 ? Math.round(stats.teachers * 0.9) : 0)}
                        color="bg-blue-100"
                      />
                      <StatCard 
                        icon={<FiUsers className="h-6 w-6 text-green-500" />}
                        title="Students"
                        value={stats.students.toLocaleString()}
                        link="/students"
                        trend={"Active: " + (stats.students > 0 ? Math.round(stats.students * 0.95) : 0)}
                        color="bg-green-100"
                      />
                      <StatCard 
                        icon={<FiBook className="h-6 w-6 text-purple-500" />}
                        title="Subjects"
                        value={stats.subjects}
                        link="/subjects"
                        trend="Total courses"
                        color="bg-purple-100"
                      />
                      <StatCard 
                        icon={<FiLayers className="h-6 w-6 text-yellow-500" />}
                        title="Classrooms"
                        value={stats.classrooms}
                        link="/classrooms"
                        trend="Available"
                        color="bg-yellow-100"
                      />
                    </div>
                  )}
                  {/* Exam Stats */}
                  {!stats.loading && !stats.error && (
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                      <StatCard 
                        icon={<FiCalendar className="h-6 w-6 text-red-500" />}
                        title="Exams Scheduled"
                        value={stats.exams}
                        link="/unified-exam-scheduler"
                        trend="Total scheduled"
                        color="bg-red-100"
                        large
                      />
                      <StatCard 
                        icon={<FiClock className="h-6 w-6 text-indigo-500" />}
                        title="Upcoming Exams"
                        value={stats.upcomingExams}
                        link="/unified-exam-scheduler"
                        trend="Next 30 days"
                        color="bg-indigo-100"
                        large
                      />
                    </div>
                  )}
                  {/* Upcoming Exams Section (grouped by type + semester) */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-gray-800">Upcoming Exams</h2>
                      <button
                        onClick={fetchDashboardData}
                        className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        Refresh
                      </button>
                    </div>
                    {stats.loading ? (
                      <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="p-4 animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-48"></div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <ul className="bg-white rounded-lg shadow divide-y divide-gray-200">
                        {(stats.upcomingExamList || []).length > 0 ? (
                          stats.upcomingExamList.map((exam) => (
                            <li key={exam.id} className="p-4 flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                {exam.isNew && (
                                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-green-100 text-green-700 uppercase tracking-wider">New</span>
                                )}
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{exam.semesterLabel} - {exam.type}</p>
                                  <p className="text-sm text-gray-500">{exam.startDate} to {exam.endDate}</p>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  className="flex items-center px-3 py-1 text-sm text-indigo-600 font-semibold hover:underline"
                                  onClick={() => setSelectedExam(exam)}
                                >
                                  <FiEye className="mr-1" /> View Details
                                </button>
                              </div>
                            </li>
                          ))
                        ) : (
                          <li className="p-4 text-center text-gray-500">
                            No upcoming exams scheduled
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                  {/* Modal for Exam Details */}
                  {selectedExam && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-5xl max-h-[85vh] overflow-y-auto">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <h3 className="text-xl font-bold">{selectedExam.semesterLabel} - {selectedExam.type}</h3>
                            <p className="text-sm text-gray-600">{selectedExam.startDate} to {selectedExam.endDate}</p>
                          </div>
                              <div className="flex items-center gap-2">
                            <button
                              className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                              onClick={() => window.print()}
                            >
                              Print
                            </button>
                            <button
                              className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                              onClick={() => {
                                try {
                                  const buildTime = (exam) => {
                                    if (exam.time && typeof exam.time === 'string') return exam.time;
                                    const start = exam.startTime || (exam.time && exam.time.start);
                                    const end = exam.endTime || (exam.time && exam.time.end);
                                    if (start || end) return `${start || '10:00'} - ${end || '13:00'}`;
                                    return '10:00 - 13:00';
                                  };
                                  const byDate = {};
                                  (modalTimetableExams || []).forEach(ex => {
                                    const d = ex.examDate || ex.date;
                                    if (!d) return;
                                    const key = (() => { try { const pd = new Date(d); return isNaN(pd) ? String(d) : pd.toISOString().split('T')[0]; } catch { return new Date().toISOString().split('T')[0]; } })();
                                    if (!byDate[key]) byDate[key] = [];
                                    byDate[key].push({
                                      subject: ex.subject,
                                      time: buildTime(ex)
                                    });
                                  });
                                  let csv = 'Date,Subject Code,Name of Subject,Time\n';
                                  Object.entries(byDate).sort(([a],[b]) => new Date(a) - new Date(b)).forEach(([date, arr]) => {
                                    const seen = new Set();
                                    arr.forEach(item => {
                                      const key = `${item.subject?.code}-${item.time}`;
                                      if (seen.has(key)) return;
                                      seen.add(key);
                                      const formattedDate = new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                                      csv += `"${formattedDate}","${item.subject?.code || ''}","${item.subject?.name || ''}","${item.time || ''}"\n`;
                                    });
                                  });
                                  const blob = new Blob([csv], { type: 'text/csv' });
                                  const url = window.URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = `${selectedExam.semesterLabel.replace(/\s+/g,'-').toLowerCase()}-${selectedExam.type.replace(/\s+/g,'-').toLowerCase()}-timetable.csv`;
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                  window.URL.revokeObjectURL(url);
                                } catch (e) {
                                  console.error('Download failed:', e);
                                }
                              }}
                            >
                              Download CSV
                            </button>
                                <button
                                  className="px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                                  onClick={() => {
                                    // Open attendance modal with the first exam of the selected semester
                                    const firstExam = (modalTimetableExams || [])[0];
                                    if (!firstExam) return;
                                    setAttendanceExamDetails({
                                      id: firstExam._id || firstExam.id,
                                      name: firstExam.subject?.name || 'Unknown Subject',
                                      date: firstExam.examDate || firstExam.date,
                                      startTime: firstExam.startTime,
                                      endTime: firstExam.endTime
                                    });
                                    setShowAttendanceModal(true);
                                  }}
                                >
                                  <FiUserCheck className="mr-2" /> Take Attendance
                                </button>
                          </div>
                        </div>
                        <div className="bg-white rounded border border-gray-200 p-2">
                          {modalTimetableLoading ? (
                            <div className="text-sm text-gray-500">Loading timetable...</div>
                          ) : modalTimetableError ? (
                            <div className="text-sm text-red-600">{modalTimetableError}</div>
                          ) : (
                            <TimetableView
                              scheduledExams={modalTimetableExams}
                              semesters={[selectedExam.semesterNumber]}
                              dateRange={{}}
                            />
                          )}
                        </div>
                        <div className="flex justify-end mt-4">
                          <button
                            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                            onClick={() => setSelectedExam(null)}
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Recent Activities Section */}
                  <div className="mt-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activities</h2>
                    {stats.loading ? (
                      <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="p-4 animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-24"></div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <ul className="bg-white rounded-lg shadow divide-y divide-gray-200">
                        {(stats.recentActivities || []).length > 0 ? (
                          stats.recentActivities.map((activity) => (
                            <li key={activity.id} className="p-4">
                              <p className="text-sm text-gray-800">{activity.message}</p>
                              <p className="text-xs text-gray-500">{activity.time}</p>
                            </li>
                          ))
                        ) : (
                          <li className="p-4 text-center text-gray-500">
                            No recent activities
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                  {/* Quick Actions */}
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <QuickAction 
                        icon={<FiCalendar className="h-6 w-6" />}
                        title="Schedule Exam"
                        link="/exam-scheduler"
                        color="bg-blue-100 text-blue-800"
                      />
                      <QuickAction 
                        icon={<FiUser className="h-6 w-6" />}
                        title="Add Teacher"
                        link="/teachers"
                        color="bg-green-100 text-green-800"
                      />
                      <QuickAction 
                        icon={<FiUsers className="h-6 w-6" />}
                        title="Register Student"
                        link="/students"
                        color="bg-purple-100 text-purple-800"
                      />
                      <QuickAction 
                        icon={<FiBook className="h-6 w-6" />}
                        title="Create Subject"
                        link="/subjects"
                        color="bg-yellow-100 text-yellow-800"
                      />
                      <QuickAction 
                        icon={<FiLayers className="h-6 w-6" />}
                        title="Add Classroom"
                        link="/classrooms"
                        color="bg-red-100 text-red-800"
                      />
                      <QuickAction 
                        icon={<FiLock className="h-6 w-6" />}
                        title="User Management"
                        link="/users"
                        color="bg-indigo-100 text-indigo-800"
                      />
                      <QuickAction 
                        icon={<FiSettings className="h-6 w-6" />}
                        title="Settings"
                        link="/settings"
                        color="bg-gray-200 text-gray-800"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                // Pass addExamToDashboard to your exam scheduling flow via context or props
                <Outlet context={{ addExamToDashboard }} />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
    {showSeatingModal && seatingPreview && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-5xl max-h-[85vh] overflow-y-auto">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold">Department-wise Seating - Semester {selectedSemesterForSeating}</h3>
              <p className="text-sm text-gray-600">{seatingPreview.dateRange || ''} • {seatingPreview.time}</p>
            </div>
            <div className="flex gap-2">
              <button
                className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                onClick={() => window.print()}
              >
                Print
              </button>
              <button
                className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                onClick={() => {
                  try {
                    let csv = 'Department,Scholar ID,Student Name,Seat Number,Classroom\n';
                    Object.entries(seatingPreview.departments).forEach(([dept, list]) => {
                      list.forEach(item => {
                        csv += `"${dept}","${item.scholarId}","${item.fullName}","${item.seatNumber}","${item.classroom}"\n`;
                      });
                    });
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `seating-sem-${selectedSemesterForSeating}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                  } catch (e) {
                    console.error('Seating CSV export failed:', e);
                  }
                }}
              >
                Download CSV
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(seatingPreview.departments).map(([dept, list]) => (
              <div key={dept} className="border border-gray-200 rounded">
                <div className="px-4 py-3 bg-gray-50 border-b font-semibold">{dept} • {list.length} students</div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Scholar ID</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Seat</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Classroom</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {list.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-sm text-gray-900">{row.scholarId}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{row.fullName}</td>
                          <td className="px-3 py-2 text-sm font-semibold text-indigo-600">{row.seatNumber}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{row.classroom}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-4">
            <button
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              onClick={() => setShowSeatingModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default Dashboard;
