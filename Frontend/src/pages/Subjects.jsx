import React, { useState, useEffect } from 'react';
import { FiBook, FiArrowLeft, FiHome } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { subjectAPI } from '../services/api';
import StatsCards from '../components/Subjects/StatsCards';
import ActionBar from '../components/Subjects/ActionBar';
import SubjectForm from '../components/Subjects/SubjectForm';
import SubjectTable from '../components/Subjects/SubjectTable';
import Footer from '../components/Subjects/Footer';

const SubjectManagement = () => {
  const navigate = useNavigate();
  
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState(null);
  const [departmentFilter, setDepartmentFilter] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    semester: '1',
    department: 'CSE',
    credits: '',
    type: 'regular'
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentSubject, setCurrentSubject] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  const departments = [
    { value: 'CSE', label: 'Computer Science Engineering' },
    { value: 'EEE', label: 'Electrical Engineering' },
    { value: 'MECH', label: 'Mechanical Engineering' }
  ];

  const semesters = [
    { value: '1', label: 'Semester 1' },
    { value: '2', label: 'Semester 2' },
    { value: '3', label: 'Semester 3' },
    { value: '4', label: 'Semester 4' },
    { value: '5', label: 'Semester 5' },
    { value: '6', label: 'Semester 6' },
    { value: '7', label: 'Semester 7' },
    { value: '8', label: 'Semester 8' }
  ];

  // Fetch subjects on component mount
  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await subjectAPI.getSubjects();
      if (response.data.success) {
        console.log('📥 Fetched subjects:', response.data.data);
        setSubjects(response.data.data || []);
      } else {
        setError(response.data.message || 'Failed to fetch subjects');
        toast.error(response.data.message || 'Failed to fetch subjects');
      }
    } catch (err) {
      setError('Failed to fetch subjects');
      toast.error('Failed to fetch subjects');
      console.error('Error fetching subjects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log('🔍 Form input change:', { name, value });
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🔍 Form submitted with data:', formData);
    try {
      if (isEditing) {
        // Transform formData to match backend expectations for update
        const selectedDepartment = departments.find(dept => 
          dept.value === formData.department || dept.label === formData.department
        );
        
        if (!selectedDepartment) {
          toast.error('Please select a valid department');
          return;
        }

        // Map frontend type to backend type
        const typeMapping = {
          'Core': 'regular',
          'Core Elective': 'core_elective',
          'Open Elective': 'open_elective'
        };

        console.log('🔍 Debug formData:', formData);
        console.log('🔍 formData.semester:', formData.semester, 'type:', typeof formData.semester);
        
        // Map department code to a placeholder ObjectId
        // In a real application, you'd fetch departments from the backend
        const departmentMapping = {
          'CSE': '6892e4e21779d7960574fe51', // Placeholder for CSE
          'EEE': '6892e4e21779d7960574fe52', // Placeholder for EEE  
          'MECH': '6892e4e21779d7960574fe53' // Placeholder for MECH
        };
        
        const subjectData = {
          code: formData.code,
          name: formData.name,
          semesterId: parseInt(formData.semester) || 1, // Default to 1 if parsing fails
          department: formData.department || 'CSE', // Use actual form data
          type: typeMapping[formData.type] || 'regular',
          credits: parseInt(formData.credits) || 3
        };
        
        console.log('📤 Sending updated subject data:', subjectData);
        
        const response = await subjectAPI.updateSubject(currentSubject, subjectData);
        if (response.data.success) {
          console.log('✅ Updated subject response:', response.data.data);
          // Refresh the subjects list to get populated data
          await fetchSubjects();
          toast.success('Subject updated successfully');
        } else {
          toast.error(response.data.message || 'Failed to update subject');
        }
      } else {
        // Transform formData to match backend expectations
        const selectedDepartment = departments.find(dept => 
          dept.value === formData.department || dept.label === formData.department
        );
        
        if (!selectedDepartment) {
          toast.error('Please select a valid department');
          return;
        }

        // Map frontend type to backend type
        const typeMapping = {
          'Core': 'regular',
          'Core Elective': 'core_elective',
          'Open Elective': 'open_elective'
        };

        console.log('🔍 Debug formData:', formData);
        console.log('🔍 formData.semester:', formData.semester, 'type:', typeof formData.semester);
        
        // Map department code to a placeholder ObjectId
        // In a real application, you'd fetch departments from the backend
        const departmentMapping = {
          'CSE': '6892e4e21779d7960574fe51', // Placeholder for CSE
          'EEE': '6892e4e21779d7960574fe52', // Placeholder for EEE  
          'MECH': '6892e4e21779d7960574fe53' // Placeholder for MECH
        };
        
        const subjectData = {
          code: formData.code,
          name: formData.name,
          semesterId: parseInt(formData.semester) || 1, // Default to 1 if parsing fails
          department: formData.department || 'CSE', // Use actual form data
          type: typeMapping[formData.type] || 'regular',
          credits: parseInt(formData.credits) || 3
        };
        
        console.log('📤 Sending subject data:', subjectData);
        console.log('🔍 Department mapping:', departmentMapping[formData.department]);
        console.log('🔍 Selected department:', formData.department);
        
        const response = await subjectAPI.createSubject(subjectData);
        if (response.data.success) {
          console.log('✅ Created subject response:', response.data.data);
          // Refresh the subjects list to get populated data
          await fetchSubjects();
          toast.success('Subject added successfully');
        } else {
          toast.error(response.data.message || 'Failed to add subject');
        }
      }
      setFormData({ 
        code: '', 
        name: '', 
        semester: '1',
        department: 'CSE', 
        credits: '', 
        type: 'regular' 
      });
      setIsEditing(false);
      setCurrentSubject(null);
      setShowAddForm(false);
    } catch (err) {
      toast.error('Failed to save subject');
      console.error('Error saving subject:', err);
    }
  };

  const handleEdit = (subject) => {
    // Map department name back to code
    const departmentNameToCode = {
      'Computer Science Engineering': 'CSE',
      'Electrical Engineering': 'EEE',
      'Mechanical Engineering': 'MECH'
    };
    
    setFormData({
      code: subject.code,
      name: subject.name,
      semester: subject.semesterId?.toString() || '1',
      department: subject.departmentId && subject.departmentId.length > 0 
        ? departmentNameToCode[subject.departmentId[0]?.name] || 'CSE'
        : 'CSE',
      credits: subject.credits,
      type: subject.type // Use the backend type directly
    });
    setIsEditing(true);
    setCurrentSubject(subject._id);
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this subject?')) {
      try {
        const response = await subjectAPI.deleteSubject(id);
        if (response.data.success) {
          setSubjects(subjects.filter(subject => subject._id !== id));
          toast.success('Subject deleted successfully');
        } else {
          toast.error(response.data.message || 'Failed to delete subject');
        }
      } catch (err) {
        toast.error('Failed to delete subject');
        console.error('Error deleting subject:', err);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedSubjects.length === 0) {
      toast.warning('Please select subjects to delete');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete ${selectedSubjects.length} selected subjects?`)) {
      try {
        // Note: You might need to implement bulk delete in the backend
        // For now, we'll delete them one by one
        for (const subjectId of selectedSubjects) {
          await subjectAPI.deleteSubject(subjectId);
        }
        setSubjects(subjects.filter(subject => !selectedSubjects.includes(subject._id)));
        setSelectedSubjects([]);
        setShowBulkActions(false);
        toast.success(`${selectedSubjects.length} subjects deleted successfully`);
      } catch (err) {
        toast.error('Failed to delete selected subjects');
        console.error('Error bulk deleting subjects:', err);
      }
    }
  };

  const handleBulkUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await subjectAPI.bulkUpload(formData);
      if (response.data.success) {
        // Refresh the subjects list
        await fetchSubjects();
        toast.success(`✅ Successfully uploaded ${response.data.data.successful} subjects!`);
        
        if (response.data.data.failed > 0) {
          toast.warning(`${response.data.data.failed} subjects failed to upload. Check the console for details.`);
          console.log('Upload errors:', response.data.data.errors);
        }
        
        // Navigate to dashboard after successful upload
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500); // Wait 1.5 seconds for user to see success message
      } else {
        toast.error(response.data.message || 'Failed to upload subjects');
      }
    } catch (err) {
      toast.error('Failed to upload subjects');
      console.error('Error uploading subjects:', err);
    }

    // Reset file input
    event.target.value = null;
  };

  const handleExportSubjects = () => {
    if (!subjects || subjects.length === 0) {
      toast.info('No subjects to export');
      return;
    }
    const headers = [
      'code',
      'name',
      'semesterId',
      'department',
      'type',
      'credits',
      'theoryHours',
      'practicalHours',
      'tutorialHours',
      'totalHours',
      'description'
    ];

    const toDeptCode = (subject) => {
      if (subject.department) return subject.department;
      if (subject.departmentId && subject.departmentId.length > 0) {
        return subject.departmentId[0]?.code || subject.departmentId[0]?.name || '';
      }
      return '';
    };

    const rows = subjects.map(s => ({
      code: s.code || '',
      name: s.name || '',
      semesterId: s.semesterId ?? '',
      department: toDeptCode(s),
      type: s.type || 'regular',
      credits: s.credits ?? '',
      theoryHours: s.theoryHours ?? '',
      practicalHours: s.practicalHours ?? '',
      tutorialHours: s.tutorialHours ?? '',
      totalHours: s.totalHours ?? '',
      description: s.description || ''
    }));

    const csv = [
      headers.join(','),
      ...rows.map(r => headers.map(h => `"${(r[h] ?? '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subjects_export.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleSelectSubject = (id) => {
    const newSelected = selectedSubjects.includes(id)
      ? selectedSubjects.filter(subjectId => subjectId !== id)
      : [...selectedSubjects, id];
    
    setSelectedSubjects(newSelected);
    setShowBulkActions(newSelected.length > 0);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedSubjects(filteredSubjects.map(subject => subject._id));
      setShowBulkActions(true);
    } else {
      setSelectedSubjects([]);
      setShowBulkActions(false);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleTypeClick = (type) => {
    setTypeFilter(type === 'all' ? null : type);
    setDepartmentFilter(null);
    setSearchTerm('');
  };

  const handleDepartmentClick = (department) => {
    setDepartmentFilter(department);
    setTypeFilter(null);
    setSearchTerm('');
  };

  const handleTotalClick = () => {
    setTypeFilter(null);
    setDepartmentFilter(null);
    setSearchTerm('');
  };

  const filteredSubjects = subjects.filter(subject => {
    // Apply search term filter
    const matchesSearch = 
      (subject.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (subject.departmentId && subject.departmentId.length > 0 
        ? (subject.departmentId[0]?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
        : false) ||
      (subject.code || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply type filter if active
    const matchesType = typeFilter ? subject.type === typeFilter : true;
    
    // Apply department filter if active
    const matchesDepartment = departmentFilter ? 
      (subject.departmentId && subject.departmentId.length > 0 
        ? subject.departmentId[0]?.name === departmentFilter
        : false) : true;
    
    return matchesSearch && matchesType && matchesDepartment;
  });

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
                <FiBook className="mr-3 text-blue-600" /> Subject Management
              </h1>
            </div>
            <p className="text-gray-600 ml-10">Manage all subjects and course information</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-4 flex items-center">
            <FiHome className="text-blue-600 mr-2" />
            <span className="font-medium">Dashboard /</span>
            <span className="text-blue-600 font-medium ml-1">Subjects</span>
          </div>
        </div>

        <StatsCards 
          subjects={subjects}
          onTypeClick={handleTypeClick}
          onDepartmentClick={handleDepartmentClick}
          onTotalClick={handleTotalClick}
        />
        
        <ActionBar 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          showAddForm={showAddForm}
          setShowAddForm={setShowAddForm}
          setIsEditing={setIsEditing}
          setFormData={setFormData}
          showBulkActions={showBulkActions}
          selectedSubjects={selectedSubjects}
          handleBulkDelete={handleBulkDelete}
          onBulkUpload={handleBulkUpload}
          onExportSubjects={handleExportSubjects}
          departments={departments}
          typeFilter={typeFilter}
          departmentFilter={departmentFilter}
          onClearFilters={handleTotalClick}
        />

        {showAddForm && (
          <SubjectForm 
            formData={formData}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            isEditing={isEditing}
            setShowAddForm={setShowAddForm}
            setFormData={setFormData}
            setIsEditing={setIsEditing}
            departments={departments}
            semesters={semesters}
          />
        )}

        <SubjectTable 
          filteredSubjects={filteredSubjects}
          subjects={subjects}
          selectedSubjects={selectedSubjects}
          handleSelectSubject={handleSelectSubject}
          handleSelectAll={handleSelectAll}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          searchTerm={searchTerm}
          setShowAddForm={setShowAddForm}
          setSearchTerm={setSearchTerm}
          typeFilter={typeFilter}
          departmentFilter={departmentFilter}
          semesters={semesters}
        />
        
        <Footer />
      </div>
    </div>
  );
};

export default SubjectManagement;