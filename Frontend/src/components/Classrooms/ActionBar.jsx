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
  selectedClassrooms,
  handleBulkDelete,
  onBulkUpload,
  onExportClassrooms,
  buildingFilter,
  setBuildingFilter,
  typeFilter,
  setTypeFilter,
  buildingOptions = [],
  typeOptions = []
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="w-full md:w-auto flex-1">
          <div className="relative">
            <FiSearch className="absolute left-3 top-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by room number, building..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-96 pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          {/* Filters */}
          {buildingOptions.length > 0 && (
            <select
              value={buildingFilter || ''}
              onChange={(e) => setBuildingFilter(e.target.value || null)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Buildings</option>
              {buildingOptions.map(building => (
                <option key={building} value={building}>{building}</option>
              ))}
            </select>
          )}

          {typeOptions.length > 0 && (
            <select
              value={typeFilter || ''}
              onChange={(e) => setTypeFilter(e.target.value || null)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              {typeOptions.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          )}

          {showBulkActions && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:opacity-90 transition shadow-md"
            >
              <FiTrash2 className="mr-2" /> Remove Selected ({selectedClassrooms.length})
            </button>
          )}
          
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setIsEditing(false);
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
            }}
            className="flex items-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:opacity-90 transition shadow-md"
          >
            <FiPlus className="mr-2" /> {showAddForm ? 'Cancel' : 'Add Classroom'}
          </button>
          
          <button
            onClick={() => {
              const csvContent = generateClassroomCSVTemplate();
              const blob = new Blob([csvContent], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'classrooms_template.csv';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              window.URL.revokeObjectURL(url);
            }}
            className="flex items-center px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:opacity-90 transition shadow-md"
          >
            <FiDownload className="mr-2" /> Download Template
          </button>

          {onExportClassrooms && (
            <button
              onClick={onExportClassrooms}
              className="flex items-center px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-700 text-white rounded-lg hover:opacity-90 transition shadow-md"
            >
              <FiDownload className="mr-2" /> Export Classrooms
            </button>
          )}
          
          <label className="flex items-center px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:opacity-90 transition shadow-md cursor-pointer">
            <FiUpload className="mr-2" /> Bulk Upload
            <input
              type="file"
              accept=".csv"
              onChange={onBulkUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
};

export default ActionBar;

