import React, { useState, useEffect, useMemo } from 'react';
import { FiUser, FiHome, FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { studentAPI, departmentAPI } from '../services/api';
import { DEFAULT_STUDENT_FORM, DEPARTMENT_OPTIONS } from '../constants/student';
import { useUser } from '../context/UserContext';
import StatsCards from '../components/Students/StatsCards';
import ActionBar from '../components/Students/ActionBar';
import StudentForm from '../components/Students/StudentForm';
import StudentTable from '../components/Students/StudentTable';
import Footer from '../components/Students/Footer';

const StudentManagement = () => {
  const navigate = useNavigate();
  const { currentUser } = useUser();
  
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkUploadPercent, setBulkUploadPercent] = useState(0);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [pageSize, setPageSize] = useState(50);

  // Form data state
  const [formData, setFormData] = useState(DEFAULT_STUDENT_FORM);

  // Department options (using shared constants)
  const [departments, setDepartments] = useState([]);
  const departmentOptions = departments.length > 0 ? departments : DEPARTMENT_OPTIONS;

  // Fetch students on component mount and when filters change
  useEffect(() => {
    fetchStudents();
    fetchDepartments();
  }, [currentPage, pageSize, searchTerm, filterDepartment, filterYear, filterSemester]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const params = {
        page: currentPage,
        limit: pageSize,
        ...(searchTerm && { search: searchTerm }),
        ...(filterDepartment && { department: filterDepartment }),
        ...(filterYear && { batchYear: filterYear }),
        ...(filterSemester && { semester: filterSemester })
      };
      
      const response = await studentAPI.getStudents(params);
      console.log('📊 Frontend Student Response:', {
        success: response.data.success,
        count: response.data.count,
        total: response.data.total,
        page: response.data.debug?.page,
        actualLimit: response.data.debug?.actualLimit
      });
      
      if (response.data.success) {
        setStudents(response.data.data || []);
        setTotalStudents(response.data.debug?.total || response.data.total || 0);
        setTotalPages(Math.ceil((response.data.debug?.total || response.data.total || 0) / pageSize));
        console.log(`✅ Loaded ${response.data.data?.length || 0} students (page ${currentPage}/${Math.ceil((response.data.debug?.total || response.data.total || 0) / pageSize)})`);
      } else {
        setError(response.data.message || 'Failed to fetch students');
        toast.error(response.data.message || 'Failed to fetch students');
      }
    } catch (err) {
      setError('Failed to fetch students');
      toast.error('Failed to fetch students');
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await departmentAPI.getDepartments();
      if (response.data.success) {
        setDepartments(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  const handleExportStudents = async () => {
    try {
      const res = await studentAPI.exportCSV();
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'students.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      toast.error('Failed to export students');
    }
  };

  // For stats, we need to fetch all students (without pagination) for accurate counts
  const [statsStudents, setStatsStudents] = useState([]);
  const [statsLoading, setStatsLoading] = useState(false);

  // Fetch stats data separately using cached endpoint
  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      // Add timestamp to bust browser cache
      const response = await studentAPI.getCachedStats({ _t: Date.now() });
      if (response.data.success) {
        // Convert cached stats to the format expected by the component
        const stats = response.data.data;
        const students = [];
        
        // We need to create students that have BOTH department and year
        // Get all departments and years
        const deptEntries = Object.entries(stats.departmentCounts);
        const yearEntries = Object.entries(stats.yearCounts);
        
        // Calculate total to distribute students properly
        const totalStudents = stats.totalStudents || 0;
        
        // Create student objects with both department and year info
        // Distribute evenly across departments and years
        let studentIndex = 0;
        
        for (const [deptName, deptCount] of deptEntries) {
          for (let i = 0; i < deptCount; i++) {
            // Assign a year based on distribution
            const yearIndex = studentIndex % yearEntries.length;
            const year = yearEntries[yearIndex] ? yearEntries[yearIndex][0] : '2026';
            
            students.push({ 
              department: { name: deptName },
              batchYear: year
            });
            studentIndex++;
          }
        }
        
        setStatsStudents(students);
      } else {
        // Fallback to regular stats if cached version fails
        const response = await studentAPI.getAllStudents();
        if (response.data.success) {
          setStatsStudents(response.data.data || []);
        }
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      // Fallback to regular stats
      try {
        const response = await studentAPI.getAllStudents();
        if (response.data.success) {
          setStatsStudents(response.data.data || []);
        }
      } catch (fallbackErr) {
        console.error('Fallback stats fetch failed:', fallbackErr);
      }
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch stats on component mount
  useEffect(() => {
    fetchStats();
  }, []);

  const { departmentCounts, yearCounts } = useMemo(() => {
    // Use statsStudents for accurate counts
    if (!statsStudents || !Array.isArray(statsStudents)) {
      return {
        departmentCounts: {},
        yearCounts: {}
      };
    }

    const deptCounts = statsStudents.reduce((acc, student) => {
      const deptKey = typeof student.department === 'object' && student.department?.name 
        ? student.department.name 
        : student.department || 'Unknown';
      // Only count students with valid departments
      if (deptKey && deptKey !== 'Unknown') {
        acc[deptKey] = (acc[deptKey] || 0) + 1;
      }
      return acc;
    }, {});
    const yrCounts = statsStudents.reduce((acc, student) => {
      acc[student.batchYear] = (acc[student.batchYear] || 0) + 1;
      return acc;
    }, {});

    return {
      departmentCounts: deptCounts,
      yearCounts: yrCounts
    };
  }, [statsStudents]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const isMongoId = (value) => typeof value === 'string' && /^[a-fA-F0-9]{24}$/.test(value);

  const resolveDepartmentValue = (rawValue) => {
    if (!rawValue) return null;
    // If already an ObjectId, return as is
    if (isMongoId(rawValue)) return rawValue;

    // Try find in options by name/code/value
    const found = (departmentOptions || []).find((dept) =>
      dept?._id === rawValue ||
      dept?.code === rawValue ||
      dept?.name === rawValue ||
      dept?.value === rawValue
    );

    // Prefer _id if available, else fall back to provided raw value (backend accepts code/name for students)
    return found?._id || rawValue;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // scholarId auto-generated server-side

    if (!formData.personalEmail.match(/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/)) {
      toast.error('Invalid email address');
      return;
    }

    if (!formData.contactNumber.match(/^[0-9]{10,15}$/)) {
      toast.error('Invalid contact number');
      return;
    }

    if (!formData.batchYear.match(/^20\d{2}$/)) {
      toast.error('Invalid batch year');
      return;
    }

    try {
      if (isEditing) {
        const departmentValue = resolveDepartmentValue(formData.department);
        if (!departmentValue) {
          toast.error('Please select a valid department');
          return;
        }

        const studentData = {
          fullName: formData.fullName,
          personalEmail: formData.personalEmail,
          contactNumber: formData.contactNumber,
          semester: formData.semester,
          section: formData.section,
          batchYear: formData.batchYear,
          department: departmentValue,
          address: formData.address
        };
        
        console.log('📤 Sending student update data:', studentData);
        
        const response = await studentAPI.updateStudent(currentStudent, studentData);
        if (response.data.success) {
          setStudents(students.map(student =>
            student._id === currentStudent ? response.data.data : student
          ));
          toast.success('Student updated successfully');
        } else {
          toast.error(response.data.message || 'Failed to update student');
        }
      } else {
        const departmentValue = resolveDepartmentValue(formData.department);
        if (!departmentValue) {
          toast.error('Please select a valid department');
          return;
        }

        const studentData = {
          fullName: formData.fullName,
          personalEmail: formData.personalEmail,
          contactNumber: formData.contactNumber,
          semester: formData.semester,
          section: formData.section,
          batchYear: formData.batchYear,
          department: departmentValue,
          address: formData.address
        };
        
        console.log('📤 Sending student data:', studentData);
        
        const response = await studentAPI.createStudent(studentData);
        if (response.data.success) {
          setStudents([...students, response.data.data]);
          toast.success('Student added successfully');
          // Refresh stats after creation
          fetchStats();
        } else {
          toast.error(response.data.message || 'Failed to add student');
        }
      }

      // Reset form
      setFormData({
        fullName: '',
        personalEmail: '',
        contactNumber: '',
        semester: 'Semester 1',
        section: 'A',
        batchYear: new Date().getFullYear().toString(),
        department: '',
        address: '',
        photo: ''
      });

      setIsEditing(false);
      setCurrentStudent(null);
      setShowAddForm(false);
    } catch (err) {
      toast.error('An error occurred');
      console.error('Error saving student:', err);
    }
  };

  const handleEdit = (student) => {
    setFormData({
      fullName: student.fullName,
      personalEmail: student.personalEmail || student.email,
      contactNumber: student.contactNumber,
      semester: student.semester,
      section: student.section,
      batchYear: student.batchYear,
      department: (typeof student.department === 'object' && (student.department?._id || student.department?.code || student.department?.name))
        || student.department,
      address: student.address,
      photo: student.photo
    });
    setIsEditing(true);
    setCurrentStudent(student._id);
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
              const response = await studentAPI.deleteStudent(id);
      if (response.data.success) {
        setStudents(students.filter(student => student._id !== id));
        toast.success('Student deleted successfully');
        // Refresh stats after deletion
        fetchStats();
      } else {
        toast.error(response.data.message || 'Failed to delete student');
      }
      } catch (err) {
        toast.error('An error occurred');
        console.error('Error deleting student:', err);
      }
    }
  };

  const handleBulkUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setBulkUploading(true);
      setBulkUploadPercent(0);
      const response = await studentAPI.bulkUploadStudents(formData, (progressEvent) => {
        if (!progressEvent.total) return;
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setBulkUploadPercent(percent);
      });
      if (response.data.success) {
        await fetchStudents();
        const { successful, failed } = response.data.data;
        toast.success(`✅ Uploaded: ${successful} | Failed: ${failed}`);
        if (failed > 0) console.log('Upload errors:', response.data.data.errors);
        
        // Refresh stats after bulk upload
        fetchStats();
        
        // Navigate to dashboard after successful upload
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500); // Wait 1.5 seconds for user to see success message
      } else {
        toast.error(response.data.message || 'Failed to upload students');
      }
    } catch (err) {
      toast.error('Failed to upload students');
      console.error('Error uploading students:', err);
    }

    // Reset file input
    event.target.value = null;
    setBulkUploading(false);
  };

  const handleBulkDelete = async () => {
    if (selectedStudents.length === 0) {
      toast.warning('Please select students to delete');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete ${selectedStudents.length} selected students?`)) {
      try {
        const response = await studentAPI.bulkDeleteStudents(selectedStudents);
        if (response.data.success) {
          setStudents(students.filter(student => !selectedStudents.includes(student._id)));
          setSelectedStudents([]);
          toast.success(`Successfully deleted ${selectedStudents.length} students`);
          // Refresh stats after bulk deletion
          fetchStats();
        } else {
          toast.error(response.data.message || 'Failed to delete students');
        }
      } catch (err) {
        toast.error('An error occurred');
        console.error('Error deleting students:', err);
      }
    }
  };

  const handleSelectStudent = (id) => {
    const newSelected = selectedStudents.includes(id)
      ? selectedStudents.filter(studentId => studentId !== id)
      : [...selectedStudents, id];
    setSelectedStudents(newSelected);
  };

  const handleSelectAll = (e) => {
    const filteredStudents = students.filter(student => {
      const deptMatch = filterDepartment === '' || 
        (typeof student.department === 'object' && student.department?.name === filterDepartment) ||
        (typeof student.department === 'string' && student.department === filterDepartment);
      
      return student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        deptMatch &&
        (filterYear === '' || student.batchYear === filterYear) &&
        (filterSemester === '' || student.semester === filterSemester);
    });
    
    if (e.target.checked) {
      const allIds = filteredStudents.map(student => student._id);
      setSelectedStudents(allIds);
    } else {
      setSelectedStudents([]);
    }
  };

  const handleDepartmentClick = (department) => {
    setFilterDepartment(filterDepartment === department ? '' : department);
  };

  const handleTotalStudentsClick = () => {
    setFilterDepartment('');
    setFilterYear('');
    setFilterSemester('');
    setSearchTerm('');
  };

  const handleBatchYearClick = (year) => {
    // Toggle behavior: if same year clicked, clear filters
    if (filterYear === year) {
      setFilterYear('');
      setFilterSemester('');
      return;
    }

    // Compute semesters for the selected batch year (passout year)
    const passoutYear = Number(year);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11
    const currentAcademicYear = currentMonth >= 6 ? currentYear : currentYear - 1; // Academic year starts July
    const entryYear = passoutYear - 4;
    const yearsSinceEntry = currentAcademicYear - entryYear; // 0..3
    let sem1 = 1;
    if (yearsSinceEntry <= 0) sem1 = 1;
    else if (yearsSinceEntry === 1) sem1 = 3;
    else if (yearsSinceEntry === 2) sem1 = 5;
    else sem1 = 7;
    const sem2 = sem1 + 1;

    // Set filters
    setFilterYear(year);
    // Store as comma-separated list to keep backward compatibility with string state
    setFilterSemester(`Semester ${sem1},Semester ${sem2}`);
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const generatePassword = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleSendCredentials = async () => {
    if (selectedStudents.length === 0) {
      toast.warning('Please select students to send credentials');
      return;
    }

    // Confirm with count
    const count = selectedStudents.length;
    const confirmed = window.confirm(
      `Send login credentials to ${count} student${count > 1 ? 's' : ''}?\n\n` +
      `This will generate random passwords and update their accounts.`
    );
    if (!confirmed) return;

    const selectedData = students
      .filter(student => selectedStudents.includes(student._id))
      .map(student => ({
        id: student._id,
        email: student.personalEmail || student.email,
        scholarId: student.scholarId,
        password: generatePassword(),
        name: student.fullName
      }));

    console.log(`📨 Sending credentials to ${selectedData.length} students...`);

    // Process in batches of 10 for faster response
    const BATCH_SIZE = 10;
    const batches = [];
    for (let i = 0; i < selectedData.length; i += BATCH_SIZE) {
      batches.push(selectedData.slice(i, i + BATCH_SIZE));
    }

    const allSuccessful = [];
    const allFailed = [];
    let processedCount = 0;

    try {
      const toastId = toast.info(`Processing 0/${selectedData.length} students...`, { autoClose: false });

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`📦 Processing batch ${i + 1}/${batches.length} (${batch.length} student${batch.length > 1 ? 's' : ''})`);
        
        try {
          const response = await studentAPI.sendCredentials(batch);
          
          if (response.data.success) {
            const { successful = [], failed = [] } = response.data.data;
            allSuccessful.push(...successful);
            allFailed.push(...failed);
            processedCount += batch.length;
            
            // Update progress
            toast.update(toastId, {
              render: `Processing ${processedCount}/${selectedData.length} students...`,
            });
          }
        } catch (batchError) {
          console.error(`❌ Batch ${i + 1} failed:`, batchError);
          // Mark all in batch as failed
          batch.forEach(item => {
            allFailed.push({ 
              email: item.email, 
              error: batchError.response?.data?.message || batchError.message 
            });
          });
          processedCount += batch.length;
        }
      }

      toast.dismiss(toastId);

      // Update students with credentials sent status
      setStudents(students.map(student => {
        const isSelected = selectedStudents.includes(student._id);
        if (isSelected) {
          const wasSuccessful = allSuccessful.some(s => s.email === (student.personalEmail || student.email));
          return {
            ...student,
            credentialsSent: wasSuccessful,
            credentialsSentAt: wasSuccessful ? new Date().toISOString() : null
          };
        }
        return student;
      }));

      // Clear selection
      setSelectedStudents([]);

      // Show final message
      if (allFailed.length === 0) {
        toast.success(`✅ Credentials sent successfully to ${allSuccessful.length} students!`);
      } else {
        toast.warning(
          `Credentials sent to ${allSuccessful.length} students. ${allFailed.length} failed.`,
          { autoClose: 7000 }
        );
        console.warn('Failed credentials:', allFailed);
      }
    } catch (err) {
      toast.error('An error occurred while sending credentials');
      console.error('Error sending credentials:', err);
    }
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterDepartment, filterYear, filterSemester]);

  // Since we're doing server-side filtering, students are already filtered
  const filteredStudents = students;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading students...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Students</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchStudents}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center mb-2">
              <button 
                onClick={handleBackToDashboard}
                className="flex items-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:opacity-90 transition shadow-md"
              >
                <FiArrowLeft className="mr-1" /> Back to Dashboard
              </button>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center ml-3">
                <FiUser className="mr-3 text-blue-600" /> Student Management
              </h1>
            </div>
            <p className="text-gray-600 ml-10">Manage all student records and information</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-4 flex items-center">
            <FiHome className="text-blue-600 mr-2" />
            <span className="font-medium">Dashboard /</span>
            <span className="text-blue-600 font-medium ml-1">Students</span>
          </div>
        </div>

        <StatsCards
          departments={departmentCounts}
          currentYearStudents={yearCounts}
          onDepartmentClick={handleDepartmentClick}
          onTotalStudentsClick={handleTotalStudentsClick}
          onBatchYearClick={handleBatchYearClick}
        />

        <ActionBar
          onAddStudent={() => setShowAddForm(true)}
          onBulkUpload={handleBulkUpload}
          onBulkDelete={handleBulkDelete}
          onSendCredentials={handleSendCredentials}
          onExport={handleExportStudents}
          selectedStudents={selectedStudents}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterDepartment={filterDepartment}
          setFilterDepartment={setFilterDepartment}
          filterYear={filterYear}
          setFilterYear={setFilterYear}
          filterSemester={filterSemester}
          setFilterSemester={setFilterSemester}
          departmentOptions={departmentOptions}
          userRole={currentUser?.role}
          currentUser={currentUser}
        />

        {showAddForm && (
            <StudentForm
            formData={formData}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            isEditing={isEditing}
            setShowAddForm={setShowAddForm}
            setFormData={setFormData}
            setIsEditing={setIsEditing}
            onClose={() => {
              setShowAddForm(false);
              setIsEditing(false);
              setCurrentStudent(null);
              setFormData(DEFAULT_STUDENT_FORM);
            }}
              departments={departmentOptions}
          />
        )}

        <StudentTable
          filteredStudents={filteredStudents}
          students={students}
          selectedStudents={selectedStudents}
          handleSelectStudent={handleSelectStudent}
          handleSelectAll={handleSelectAll}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          departments={departmentOptions}
        />

        {/* Pagination Controls */}
        <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-4 mt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalStudents)} of {totalStudents} students
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Page size:</label>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                First
              </button>
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              
              <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded">
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Last
              </button>
            </div>
          </div>
        </div>

        <Footer totalStudents={totalStudents} />
      </div>

      {bulkUploading && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg p-6 w-80 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <div className="font-semibold mb-2">Uploading students...</div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${bulkUploadPercent}%` }}></div>
            </div>
            <div className="text-sm text-gray-600 mt-2">
              {bulkUploadPercent < 100 ? `${bulkUploadPercent}%` : 'Processing on server...'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
