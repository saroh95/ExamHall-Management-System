import React, { useState, useEffect } from 'react';
import { FiUser, FiHome, FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import StatsCards from '../components/Teachers/StatsCards';
import ActionBar from '../components/Teachers/ActionBar';
import TeacherForm from '../components/Teachers/TeacherForm';
import TeacherTable from '../components/Teachers/TeacherTable';
import Footer from '../components/Teachers/Footer';
import { teacherAPI, departmentAPI } from '../services/api';
import { DEFAULT_TEACHER_FORM } from '../constants/teacher';
import { useUser } from '../context/UserContext';

const TeacherManagement = () => {
  const navigate = useNavigate();
  
  const [teachers, setTeachers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [departmentFilter, setDepartmentFilter] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    phone: '',
    personalEmail: '',
    address: '',
    designation: 'Assistant Professor',
    qualification: '',
    joiningDate: '',
    status: 'Active'
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentTeacher, setCurrentTeacher] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // For stats, we need to fetch all teachers (without pagination) for accurate counts
  const [statsTeachers, setStatsTeachers] = useState([]);
  const [statsLoading, setStatsLoading] = useState(false);

  // Fetch stats data separately using cached endpoint
  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const response = await teacherAPI.getCachedStats();
      if (response.data.success) {
        // Convert cached stats to the format expected by the component
        const stats = response.data.data;
        const teachers = [];
        
        // Convert department counts to teacher-like objects for compatibility
        Object.entries(stats.departmentCounts).forEach(([deptName, count]) => {
          for (let i = 0; i < count; i++) {
            teachers.push({ department: { name: deptName } });
          }
        });
        
        // Convert designation counts to teacher-like objects
        Object.entries(stats.designationCounts).forEach(([designation, count]) => {
          for (let i = 0; i < count; i++) {
            teachers.push({ designation: designation });
          }
        });
        
        setStatsTeachers(teachers);
      } else {
        // Fallback to regular stats if cached version fails
        const response = await teacherAPI.getAllTeachers();
        if (response.data.success) {
          setStatsTeachers(response.data.data || []);
        }
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      // Fallback to regular stats
      try {
        const response = await teacherAPI.getAllTeachers();
        if (response.data.success) {
          setStatsTeachers(response.data.data || []);
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
  const [lenientImport, setLenientImport] = useState(true);

  const { isAuthenticated } = useUser();

  // Fetch teachers and departments when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchTeachers();
    fetchDepartments();
    // Ensure form is in create mode when component mounts
    forceCreateMode();
  }, [isAuthenticated]);

  // Debug state changes
  useEffect(() => {
    console.log('🔍 State debug:', {
      isEditing,
      currentTeacher,
      showAddForm,
      formData: Object.keys(formData)
    });
  }, [isEditing, currentTeacher, showAddForm]);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Fetching teachers...');
      const response = await teacherAPI.getTeachers({ page: 1, limit: 1000 });
      console.log('✅ Teachers response:', response.data);
      if (response.data.success) {
        const teachersData = response.data.data || [];
        setTeachers(teachersData);
      } else {
        setError(response.data.message || 'Failed to fetch teachers');
        toast.error(response.data.message || 'Failed to fetch teachers');
      }
    } catch (err) {
      console.error('❌ Error fetching teachers:', err);
      setError('Failed to fetch teachers');
      toast.error('Failed to fetch teachers');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await departmentAPI.getDepartments();
      if (response.data.success) {
        setDepartments(response.data.data || []);
      } else {
        console.error('Failed to fetch departments:', response.data.message);
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const isMongoId = (value) => typeof value === 'string' && /^[a-fA-F0-9]{24}$/.test(value);

  const buildTeacherPayload = (isUpdate) => {
    // Resolve departmentId: accept either MongoId or name/code
    let departmentId = null;
    if (isMongoId(formData.department)) {
      departmentId = formData.department;
    } else {
      const selectedDepartment = departments.find(
        (dept) => dept.name === formData.department || dept.code === formData.department
      );
      if (selectedDepartment) {
        departmentId = selectedDepartment._id;
      }
    }

    const maybeIsoDate = formData.joiningDate
      ? new Date(formData.joiningDate).toISOString()
      : undefined;

    // For update, include only provided fields
    const payload = {};

    if (formData.name) payload.fullName = formData.name;
    if (formData.personalEmail) payload.personalEmail = formData.personalEmail;
    if (formData.phone) payload.phone = formData.phone;
    if (departmentId) payload.department = departmentId;
    if (formData.address) payload.address = formData.address;
    if (formData.designation) payload.designation = formData.designation;
    if (formData.qualification) payload.qualification = formData.qualification;
    if (formData.specialization) payload.specialization = formData.specialization;
    if (maybeIsoDate) payload.joiningDate = maybeIsoDate;

    // For create, all required must be present; validation happens before call
    return payload;
  };

  const resetForm = () => {
    console.log('🔄 Resetting form to create mode');
    setFormData({ 
      name: '', 
      email: '', 
      department: '', 
      phone: '', 
      personalEmail: '', 
      address: '',
      designation: 'Assistant Professor',
      qualification: '',
      specialization: '',
      joiningDate: '',
      status: 'Active'
    });
    setIsEditing(false);
    setCurrentTeacher(null);
    setShowAddForm(false);
  };

  const forceCreateMode = () => {
    console.log('🔄 Force resetting to create mode');
    setIsEditing(false);
    setCurrentTeacher(null);
    setFormData({ 
      name: '', 
      email: '', 
      department: '', 
      phone: '', 
      personalEmail: '', 
      address: '',
      designation: 'Assistant Professor',
      qualification: '',
      specialization: '',
      joiningDate: '',
      status: 'Active'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🔍 Form submission debug:', {
      isEditing,
      currentTeacher,
      formData: Object.keys(formData)
    });
    
    // If updating, ensure the ID exists in current list
    if (isEditing) {
      if (!currentTeacher) {
        toast.error('No teacher selected for update');
        return;
      }
      const exists = teachers.some((t) => t._id === currentTeacher);
      if (!exists) {
        toast.error('Selected teacher not found');
        return;
      }
    }
    
    try {
      if (isEditing) {
        // Update flow
        const payload = buildTeacherPayload(true);
        console.log('📝 Updating teacher', currentTeacher, payload);
        const response = await teacherAPI.updateTeacher(currentTeacher, payload);
        if (response.data.success) {
          setTeachers(
            teachers.map((t) => (t._id === currentTeacher ? response.data.data : t))
          );
          toast.success('Teacher updated successfully');
          resetForm();
        } else {
          toast.error(response.data.message || 'Failed to update teacher');
        }
      } else {
        // Create flow with validations
        // Validate required fields before building payload
        const phoneRegex = /^[0-9]{10,15}$/;
        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

        if (!formData.name || !formData.personalEmail || !formData.phone || !formData.address ||
            !formData.designation || !formData.qualification || !formData.joiningDate) {
          toast.error('Please fill in all required fields');
          return;
        }
        if (!phoneRegex.test(formData.phone)) {
          toast.error('Phone number must be 10-15 digits');
          return;
        }
        if (!emailRegex.test(formData.personalEmail)) {
          toast.error('Please enter a valid email address');
          return;
        }

        const payload = buildTeacherPayload(false);
        if (!payload.department) {
          toast.error('Please select a valid department');
          return;
        }

        console.log('➕ Creating teacher with payload:', payload);
        console.log('➕ Form data:', formData);
        const response = await teacherAPI.createTeacher(payload);
        if (response.data.success) {
          setTeachers([...teachers, response.data.data]);
          toast.success('Teacher added successfully');
          resetForm();
        } else {
          toast.error(response.data.message || 'Failed to add teacher');
        }
      }
    } catch (err) {
      console.error('❌ Error creating teacher:', err);
      if (err.response?.data?.message) {
        toast.error(`Backend Error: ${err.response.data.message}`);
      } else if (err.response?.data?.errors) {
        // Handle validation errors
        const errorMessages = err.response.data.errors.map(error => error.msg).join(', ');
        toast.error(`Validation Errors: ${errorMessages}`);
      } else {
        toast.error('Failed to save teacher');
      }
    }
  };

  const handleEdit = (teacher) => {
    setFormData({
      name: teacher.fullName || teacher.name,
      email: teacher.instituteEmail || teacher.email,
      department: teacher.department?.name || teacher.department?._id || teacher.department || '',
      phone: teacher.phone,
      personalEmail: teacher.personalEmail || '',
      address: teacher.address || '',
      designation: teacher.designation || 'Assistant Professor',
      qualification: teacher.qualification || '',
      joiningDate: teacher.joiningDate ? new Date(teacher.joiningDate).toISOString().slice(0, 10) : '',
      status: teacher.status || (teacher.isActive ? 'Active' : 'Inactive')
    });
    setIsEditing(true);
    setCurrentTeacher(teacher._id);
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      try {
        const response = await teacherAPI.deleteTeacher(id);
        if (response.data.success) {
          setTeachers(teachers.filter(teacher => teacher._id !== id));
          toast.success('Teacher deleted successfully');
        } else {
          toast.error(response.data.message || 'Failed to delete teacher');
        }
      } catch (err) {
        toast.error('Failed to delete teacher');
        console.error('Error deleting teacher:', err);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTeachers.length === 0) {
      toast.warning('Please select teachers to delete');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete ${selectedTeachers.length} selected teachers?`)) {
      try {
        const response = await teacherAPI.bulkDeleteTeachers(selectedTeachers);
        if (response.data.success) {
          setTeachers(teachers.filter(teacher => !selectedTeachers.includes(teacher._id)));
          setSelectedTeachers([]);
          setShowBulkActions(false);
          toast.success(`Successfully deleted ${selectedTeachers.length} teachers`);
        } else {
          toast.error(response.data.message || 'Failed to delete teachers');
        }
      } catch (err) {
        toast.error('An error occurred');
        console.error('Error deleting teachers:', err);
      }
    }
  };

  const handleSelectTeacher = (id) => {
    const newSelected = selectedTeachers.includes(id)
      ? selectedTeachers.filter(teacherId => teacherId !== id)
      : [...selectedTeachers, id];
    
    setSelectedTeachers(newSelected);
    setShowBulkActions(newSelected.length > 0);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedTeachers(filteredTeachers.map(teacher => teacher._id));
      setShowBulkActions(true);
    } else {
      setSelectedTeachers([]);
      setShowBulkActions(false);
    }
  };

  const generatePassword = () => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$';
    return Array.from({ length: 10 }, () =>
      charset.charAt(Math.floor(Math.random() * charset.length))
    ).join('');
  };

  const handleSendCredentials = async () => {
    if (selectedTeachers.length === 0) {
      toast.warning('Please select at least one teacher to send credentials.');
      return;
    }

    // Confirm with count
    const count = selectedTeachers.length;
    const confirmed = window.confirm(
      `Send login credentials to ${count} teacher${count > 1 ? 's' : ''}?\n\n` +
      `This will generate random passwords and update their accounts.`
    );
    if (!confirmed) return;

    const selectedData = teachers
      .filter(teacher => selectedTeachers.includes(teacher._id))
      .map(teacher => ({
        email: teacher.personalEmail || teacher.email,
        password: generatePassword(),
        name: teacher.fullName || teacher.name
      }));

    console.log(`📨 Sending credentials to ${selectedData.length} teachers...`);

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
      const toastId = toast.info(`Processing 0/${selectedData.length} teachers...`, { autoClose: false });

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`📦 Processing batch ${i + 1}/${batches.length} (${batch.length} teacher${batch.length > 1 ? 's' : ''})`);
        
        try {
          const response = await teacherAPI.sendCredentials(batch);
          
          if (response.data.success) {
            const { successful = [], failed = [] } = response.data.data;
            allSuccessful.push(...successful);
            allFailed.push(...failed);
            processedCount += batch.length;
            
            // Update progress
            toast.update(toastId, {
              render: `Processing ${processedCount}/${selectedData.length} teachers...`,
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

      // Update teachers with credentials sent status
      setTeachers(teachers.map(teacher => {
        const isSelected = selectedTeachers.includes(teacher._id);
        if (isSelected) {
          const wasSuccessful = allSuccessful.some(s => s.email === (teacher.personalEmail || teacher.email));
          return {
            ...teacher,
            credentialsSent: wasSuccessful,
            credentialsSentAt: wasSuccessful ? new Date().toISOString() : null
          };
        }
        return teacher;
      }));

      // Clear selection
      setSelectedTeachers([]);
      setShowBulkActions(false);

      // Show final message
      if (allFailed.length === 0) {
        toast.success(`✅ Credentials sent successfully to ${allSuccessful.length} teachers!`);
      } else {
        toast.warning(
          `Credentials sent to ${allSuccessful.length} teachers. ${allFailed.length} failed.`,
          { autoClose: 7000 }
        );
        console.warn('Failed credentials:', allFailed);
      }
    } catch (error) {
      console.error('Error sending credentials:', error);
      toast.error(`❌ Failed to send credentials: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleExportTeachers = async () => {
    try {
      const res = await teacherAPI.exportCSV();
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'teachers.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      toast.error('Failed to export teachers');
    }
  };

  const handleBulkUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsUploading(true);
      setUploadProgress(0);
      console.log('🚀 Starting teacher bulk upload...');
      const response = await teacherAPI.bulkUpload(formData, {
        onUploadProgress: (progressEvent) => {
          console.log('📊 Upload progress:', progressEvent);
          if (!progressEvent || !progressEvent.total) return;
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`📊 Progress: ${percent}%`);
          setUploadProgress(percent);
        },
        lenient: lenientImport
      });
      console.log('📊 Upload response:', response.data);
      if (response.data.success) {
        await fetchTeachers();
        const { successful, failed } = response.data.data;
        toast.success(`✅ Uploaded: ${successful} | Failed: ${failed}`);
        if (failed > 0) {
          console.log('Upload errors:', response.data.data.errors);
          toast.warning(`${failed} teachers failed to upload. Downloading error report...`);
          try {
            const errors = response.data.data.errors || [];
            const header = 'row,reason';
            const csvLines = [header, ...errors.map((e, idx) => {
              const reason = (e.error || '').replace(/\n|\r|,/g, ' ');
              return `${idx + 1},${reason}`;
            })];
            const blob = new Blob([csvLines.join('\n')], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'teacher_upload_errors.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
          } catch (e) {
            console.warn('Failed to generate error CSV', e);
          }
        }
        
        // Refresh stats after bulk upload
        fetchStats();
        
        // Navigate to dashboard after successful upload
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500); // Wait 1.5 seconds for user to see success message
      } else {
        toast.error(response.data.message || 'Failed to upload teachers');
      }
    } catch (err) {
      toast.error('Failed to upload teachers');
      console.error('Error uploading teachers:', err);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      
      // Reset file input
      event.target.value = null;
    }
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleStatusClick = (status) => {
    setStatusFilter(status);
    setDepartmentFilter(null);
    setSearchTerm('');
  };

  const handleDepartmentClick = (department) => {
    setDepartmentFilter(department);
    setStatusFilter(null);
    setSearchTerm('');
  };

  const handleTotalClick = () => {
    setStatusFilter(null);
    setDepartmentFilter(null);
    setSearchTerm('');
  };

  const filteredTeachers = teachers.filter(teacher => {
    // Apply search term filter
    const matchesSearch = 
      (teacher.fullName || teacher.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (teacher.department?.name || teacher.department || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (teacher.instituteEmail || teacher.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (teacher.personalEmail && teacher.personalEmail.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Apply status filter if active
    const teacherStatus = teacher.status || (teacher.isActive ? 'Active' : 'Inactive');
    const matchesStatus = statusFilter ? teacherStatus === statusFilter : true;
    
    // Apply department filter if active
    const teacherDepartment = teacher.department?.name || teacher.department;
    const matchesDepartment = departmentFilter ? teacherDepartment === departmentFilter : true;
    
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading teachers...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Teachers</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchTeachers}
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
                <FiUser className="mr-3 text-blue-600" /> Teacher Management
              </h1>
            </div>
            <p className="text-gray-600 ml-10">Manage all faculty members and their information</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-4 flex items-center">
            <FiHome className="text-blue-600 mr-2" />
            <span className="font-medium">Dashboard /</span>
            <span className="text-blue-600 font-medium ml-1">Teachers</span>
          </div>
        </div>

        <StatsCards 
          teachers={teachers}
          onStatusClick={handleStatusClick}
          onDepartmentClick={handleDepartmentClick}
          onTotalClick={handleTotalClick}
        />
        
                 <ActionBar 
           searchTerm={searchTerm}
           setSearchTerm={setSearchTerm}
           showAddForm={showAddForm}
           setShowAddForm={(show) => {
             if (show) {
               // Ensure we're in create mode when opening the form
               forceCreateMode();
             }
             setShowAddForm(show);
           }}
           setIsEditing={setIsEditing}
           setFormData={setFormData}
           showBulkActions={showBulkActions}
           selectedTeachers={selectedTeachers}
           handleBulkDelete={handleBulkDelete}
           handleSendCredentials={handleSendCredentials}
           departments={departments}
           statusFilter={statusFilter}
           departmentFilter={departmentFilter}
           onClearFilters={handleTotalClick}
           onBulkUpload={handleBulkUpload}
          onExport={handleExportTeachers}
         />

        <div className="mt-2 mb-4 flex items-center gap-2">
          <input id="lenient-import" type="checkbox" checked={lenientImport} onChange={(e) => setLenientImport(e.target.checked)} />
          <label htmlFor="lenient-import" className="text-sm text-gray-700">Lenient import (auto-fill missing phone/address/qualification/date, use email or generate if missing)</label>
        </div>

        {showAddForm && (
          <TeacherForm 
            formData={formData}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            isEditing={isEditing}
            setShowAddForm={setShowAddForm}
            setFormData={setFormData}
            setIsEditing={setIsEditing}
            departments={departments}
          />
        )}

        <TeacherTable 
          filteredTeachers={filteredTeachers}
          teachers={teachers}
          selectedTeachers={selectedTeachers}
          handleSelectTeacher={handleSelectTeacher}
          handleSelectAll={handleSelectAll}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          searchTerm={searchTerm}
          setShowAddForm={setShowAddForm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          departmentFilter={departmentFilter}
        />
        
        <Footer />
      </div>
      {isUploading && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg p-6 w-80 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <div className="font-semibold mb-2">Uploading teachers...</div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
            </div>
            <div className="text-sm text-gray-600 mt-2">
              {uploadProgress < 100 ? `${uploadProgress}%` : 'Processing on server...'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherManagement;