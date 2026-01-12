import React, { useState, useEffect } from 'react';
import { FiHome, FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { classroomAPI } from '../services/api';
import ActionBar from '../components/Classrooms/ActionBar';
import ClassroomForm from '../components/Classroom/ClassroomForm';
import ClassroomTable from '../components/Classroom/ClassroomTable';

const Classrooms = () => {
  const navigate = useNavigate();
  
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [buildingFilter, setBuildingFilter] = useState(null);
  const [typeFilter, setTypeFilter] = useState(null);
  const [formData, setFormData] = useState({
    roomNumber: '',
    building: '',
    floor: 1,
    capacity: 60,
    type: 'Classroom',
    facilities: [],
    rows: 10,
    seatsPerRow: 6
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentClassroom, setCurrentClassroom] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedClassrooms, setSelectedClassrooms] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkUploadPercent, setBulkUploadPercent] = useState(0);

  const facilityOptions = ['Projector', 'AC', 'Microphone', 'Smart Board', 'WiFi', 'Computers'];
  const classroomTypes = ['Classroom', 'Lab', 'Lecture Theatre', 'Seminar Hall'];

  // Get unique buildings and types for filters
  const buildingOptions = [...new Set(classrooms.map(c => c.building).filter(Boolean))];
  const typeOptions = [...new Set(classrooms.map(c => c.type).filter(Boolean))];

  useEffect(() => {
    fetchClassrooms();
  }, []);

  useEffect(() => {
    setShowBulkActions(selectedClassrooms.length > 0);
  }, [selectedClassrooms]);

  const fetchClassrooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await classroomAPI.getClassrooms();
      if (response.data.success) {
        setClassrooms(response.data.data || []);
      } else {
        setError(response.data.message || 'Failed to fetch classrooms');
        toast.error(response.data.message || 'Failed to fetch classrooms');
      }
    } catch (err) {
      setError('Failed to fetch classrooms');
      toast.error('Failed to fetch classrooms');
      console.error('Error fetching classrooms:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFacilityToggle = (facility) => {
    const facilities = formData.facilities.includes(facility)
      ? formData.facilities.filter(f => f !== facility)
      : [...formData.facilities, facility];
    setFormData({ ...formData, facilities });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const classroomData = {
      ...formData,
      seatingLayout: {
        rows: parseInt(formData.rows),
        seatsPerRow: parseInt(formData.seatsPerRow),
        totalSeats: parseInt(formData.capacity)
      }
    };

    try {
      if (isEditing && currentClassroom) {
        const response = await classroomAPI.updateClassroom(currentClassroom._id, classroomData);
        if (response.data.success) {
          toast.success('Classroom updated successfully');
          await fetchClassrooms();
          resetForm();
        }
      } else {
        const response = await classroomAPI.createClassroom(classroomData);
        if (response.data.success) {
          toast.success('Classroom created successfully');
          await fetchClassrooms();
          resetForm();
        }
      }
    } catch (error) {
      console.error('Error saving classroom:', error);
      toast.error(error.response?.data?.message || 'Failed to save classroom');
    }
  };

  const handleEdit = (classroom) => {
    setCurrentClassroom(classroom);
    setFormData({
      roomNumber: classroom.roomNumber,
      building: classroom.building,
      floor: classroom.floor,
      capacity: classroom.capacity,
      type: classroom.type,
      facilities: classroom.facilities || [],
      rows: classroom.seatingLayout?.rows || 10,
      seatsPerRow: classroom.seatingLayout?.seatsPerRow || 6
    });
    setIsEditing(true);
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this classroom?')) return;

    try {
      const response = await classroomAPI.deleteClassroom(id);
      if (response.data.success) {
        toast.success('Classroom deleted successfully');
        await fetchClassrooms();
      } else {
        toast.error(response.data.message || 'Failed to delete classroom');
      }
    } catch (error) {
      console.error('Error deleting classroom:', error);
      toast.error('Failed to delete classroom');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedClassrooms.length === 0) {
      toast.warning('Please select classrooms to delete');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete ${selectedClassrooms.length} selected classrooms?`)) {
      try {
        for (const classroomId of selectedClassrooms) {
          await classroomAPI.deleteClassroom(classroomId);
        }
        setClassrooms(classrooms.filter(classroom => !selectedClassrooms.includes(classroom._id)));
        setSelectedClassrooms([]);
        setShowBulkActions(false);
        toast.success(`${selectedClassrooms.length} classrooms deleted successfully`);
        await fetchClassrooms();
      } catch (err) {
        toast.error('Failed to delete selected classrooms');
        console.error('Error bulk deleting classrooms:', err);
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
      const response = await classroomAPI.bulkUploadClassrooms(formData, (progressEvent) => {
        if (!progressEvent.total) return;
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setBulkUploadPercent(percent);
      });
      if (response.data.success) {
        await fetchClassrooms();
        const { successful, failed, errors = [] } = response.data.data;
        
        if (failed === 0) {
          toast.success(`✅ Successfully uploaded ${successful} classroom(s)!`);
        } else {
          toast.warning(`⚠️ Uploaded: ${successful} | Failed: ${failed}`);
          
          // Log detailed errors for debugging
          if (errors && errors.length > 0) {
            console.group('📋 Classroom Upload Errors');
            errors.forEach((error, index) => {
              console.error(`Error ${index + 1}:`, error);
              if (error.row) {
                console.log('Row data:', error.row);
              }
              if (error.error) {
                console.log('Error message:', error.error);
              }
            });
            console.groupEnd();
            
            // Show first few errors in toast for user visibility
            const firstErrors = errors.slice(0, 3).map(e => e.error || e.message || 'Unknown error').join('; ');
            if (firstErrors) {
              toast.info(`First errors: ${firstErrors}${errors.length > 3 ? '...' : ''}`, {
                autoClose: 5000
              });
            }
          }
        }
      } else {
        toast.error(response.data.message || 'Failed to upload classrooms');
      }
    } catch (err) {
      toast.error('Failed to upload classrooms');
      console.error('Error uploading classrooms:', err);
    }

    // Reset file input
    event.target.value = null;
    setBulkUploading(false);
    setBulkUploadPercent(0);
  };

  const handleExportClassrooms = () => {
    if (!classrooms || classrooms.length === 0) {
      toast.info('No classrooms to export');
      return;
    }

    const headers = [
      'roomNumber',
      'building',
      'floor',
      'capacity',
      'type',
      'facilities',
      'rows',
      'seatsPerRow'
    ];

    const rows = classrooms.map(c => ({
      roomNumber: c.roomNumber || '',
      building: c.building || '',
      floor: c.floor || '',
      capacity: c.capacity || '',
      type: c.type || '',
      facilities: Array.isArray(c.facilities) ? c.facilities.join(',') : '',
      rows: c.seatingLayout?.rows || '',
      seatsPerRow: c.seatingLayout?.seatsPerRow || ''
    }));

    const csv = [
      headers.join(','),
      ...rows.map(r => headers.map(h => `"${(r[h] ?? '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `classrooms_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success('Classrooms exported successfully');
  };

  const handleSelectClassroom = (id) => {
    setSelectedClassrooms(prev => 
      prev.includes(id) 
        ? prev.filter(cId => cId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedClassrooms.length === filteredClassrooms.length) {
      setSelectedClassrooms([]);
    } else {
      setSelectedClassrooms(filteredClassrooms.map(c => c._id));
    }
  };

  const resetForm = () => {
    setFormData({
      roomNumber: '',
      building: '',
      floor: 1,
      capacity: 60,
      type: 'Classroom',
      facilities: [],
      rows: 10,
      seatsPerRow: 6
    });
    setCurrentClassroom(null);
    setIsEditing(false);
    setShowAddForm(false);
  };

  // Filter classrooms
  const filteredClassrooms = classrooms.filter(classroom => {
    const matchesSearch = !searchTerm || 
      classroom.roomNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      classroom.building?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBuilding = !buildingFilter || classroom.building === buildingFilter;
    const matchesType = !typeFilter || classroom.type === typeFilter;

    return matchesSearch && matchesBuilding && matchesType;
  });

  // Calculate stats
  const stats = {
    total: classrooms.length,
    available: classrooms.filter(c => c.isAvailable !== false).length,
    byType: classroomTypes.reduce((acc, type) => {
      acc[type] = classrooms.filter(c => c.type === type).length;
      return acc;
    }, {}),
    totalCapacity: classrooms.reduce((sum, c) => sum + (c.capacity || 0), 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <FiArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center">
              <FiHome className="mr-3 text-blue-600" />
              Classroom Management
            </h1>
            <p className="text-gray-600 mt-2">Manage exam halls and classrooms</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-blue-100">
            <div className="text-sm text-gray-600 mb-1">Total Classrooms</div>
            <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border border-green-100">
            <div className="text-sm text-gray-600 mb-1">Available</div>
            <div className="text-3xl font-bold text-green-600">{stats.available}</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border border-purple-100">
            <div className="text-sm text-gray-600 mb-1">Total Capacity</div>
            <div className="text-3xl font-bold text-purple-600">{stats.totalCapacity}</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border border-orange-100">
            <div className="text-sm text-gray-600 mb-1">By Type</div>
            <div className="text-lg font-semibold text-orange-600">
              {Object.entries(stats.byType).filter(([_, count]) => count > 0).length} Types
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <ActionBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          showAddForm={showAddForm}
          setShowAddForm={setShowAddForm}
          setIsEditing={setIsEditing}
          setFormData={setFormData}
          showBulkActions={showBulkActions}
          selectedClassrooms={selectedClassrooms}
          handleBulkDelete={handleBulkDelete}
          onBulkUpload={handleBulkUpload}
          onExportClassrooms={handleExportClassrooms}
          buildingFilter={buildingFilter}
          setBuildingFilter={setBuildingFilter}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          buildingOptions={buildingOptions}
          typeOptions={typeOptions}
        />

        {/* Add/Edit Form */}
        {showAddForm && (
          <ClassroomForm
            formData={formData}
            handleInputChange={handleInputChange}
            handleEquipmentChange={handleFacilityToggle}
            handleSubmit={handleSubmit}
            isEditing={isEditing}
            setShowAddForm={setShowAddForm}
            setFormData={setFormData}
            setIsEditing={setIsEditing}
            equipmentOptions={facilityOptions}
          />
        )}

        {/* Classrooms Table */}
        <ClassroomTable
          filteredClassrooms={filteredClassrooms}
          classrooms={classrooms}
          selectedClassrooms={selectedClassrooms}
          handleSelectClassroom={handleSelectClassroom}
          handleSelectAll={handleSelectAll}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
        />

        {/* Bulk Upload Progress */}
        {bulkUploading && (
          <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 border border-blue-200">
            <div className="text-sm font-medium text-gray-700 mb-2">Uploading classrooms...</div>
            <div className="w-64 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${bulkUploadPercent}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-1">{bulkUploadPercent}%</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Classrooms;
