import React from 'react';
import { FiSearch, FiPlus, FiTrash2, FiUpload, FiDownload } from 'react-icons/fi';
import { generateClassroomCSVTemplate } from '../../utils/classroomCSVTemplate';

const ActionBar = ({
  searchTerm,
  setSearchTerm,
  showAddForm,
  setShowAddForm,
  setIsEditing,
  setFormData,
  showBulkActions,
  handleBulkDelete,
  selectedClassrooms,
  typeFilter,
  buildingFilter,
  onClearFilters,
  onBulkUpload,
  onExport
}) => {
  // Enhanced delete handler with error prevention
  const handleDeleteClick = () => {
    if (!handleBulkDelete) {
      console.error("handleBulkDelete function is not provided");
      return;
    }
    
    if (!selectedClassrooms || selectedClassrooms.length === 0) {
      alert("Please select at least one classroom to delete");
      return;
    }
    
    handleBulkDelete();
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-blue-100">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex-1">
          <div className="relative">
            <FiSearch className="absolute left-3 top-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, code or building..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-96 pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            />
          </div>
          
          {(typeFilter || buildingFilter) && (
            <div className="flex items-center mt-2 space-x-2">
              {typeFilter && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Type: {typeFilter}
                  <button onClick={() => onClearFilters()} className="ml-1 text-green-600 hover:text-green-800">
                    &times;
                  </button>
                </span>
              )}
              {buildingFilter && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Building: {buildingFilter}
                  <button onClick={() => onClearFilters()} className="ml-1 text-purple-600 hover:text-purple-800">
                    &times;
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          {showBulkActions && (
            <button
              onClick={handleDeleteClick}
              className="flex items-center px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:opacity-90 transition shadow-md"
            >
              <FiTrash2 className="mr-2" /> 
              Remove Selected ({selectedClassrooms?.length || 0})
            </button>
          )}
          
          <button
            onClick={() => {
              const csv = generateClassroomCSVTemplate();
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'classrooms_template.csv';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              window.URL.revokeObjectURL(url);
            }}
            className="flex items-center px-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:opacity-90 transition shadow-md"
          >
            <FiDownload className="mr-2" /> Download Template
          </button>

          <label className="flex items-center px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:opacity-90 transition shadow-md cursor-pointer">
            <FiUpload className="mr-2" /> Bulk Upload
            <input type="file" accept=".csv" onChange={onBulkUpload} className="hidden" />
          </label>

          <button
            onClick={onExport}
            className="flex items-center px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-700 text-white rounded-lg hover:opacity-90 transition shadow-md"
          >
            <FiDownload className="mr-2" /> Export Classrooms
          </button>

          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setIsEditing(false);
              setFormData({
                roomCode: '',
                classroomName: '',
                building: '',
                capacity: '',
                floor: 0,
                classroomType: 'Lecture Hall',
                equipment: {
                  projector: false,
                  tv: false,
                  whiteboard: false,
                  microphone: false,
                  soundSystem: false,
                  camera: false,
                  computers: false
                },
                description: ''
              });
            }}
            className="flex items-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:opacity-90 transition shadow-md"
          >
            <FiPlus className="mr-2" /> {showAddForm ? 'Cancel' : 'Add Classroom'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActionBar;