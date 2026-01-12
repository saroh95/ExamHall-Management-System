import React from 'react';
import { FiSearch, FiPlus, FiUserPlus, FiUserX, FiTrash2, FiSend, FiUpload, FiDownload } from 'react-icons/fi';
import { generateTeacherCSVTemplate } from '../../utils/teacherCSVTemplate';

const ActionBar = ({
  searchTerm,
  setSearchTerm,
  showAddForm,
  setShowAddForm,
  setIsEditing,
  setFormData,
  showBulkActions,
  selectedTeachers,
  handleBulkDelete,
  handleSendCredentials,
  departments,
  statusFilter,
  departmentFilter,
  onClearFilters,
  onBulkUpload,
  onExport
}) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-4 mb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Search teachers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
          
          {(statusFilter || departmentFilter) && (
            <div className="flex items-center mt-2 space-x-2">
              {statusFilter && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Status: {statusFilter}
                  <button onClick={() => onClearFilters()} className="ml-1 text-blue-600 hover:text-blue-800">
                    &times;
                  </button>
                </span>
              )}
              {departmentFilter && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Department: {departments.find(d => d.value === departmentFilter)?.label || departmentFilter}
                  <button onClick={() => onClearFilters()} className="ml-1 text-purple-600 hover:text-purple-800">
                    &times;
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
        
        <div className="flex space-x-3">
          {selectedTeachers && selectedTeachers.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center"
            >
              <FiTrash2 className="mr-1" /> Delete Selected ({selectedTeachers.length})
            </button>
          )}

          {selectedTeachers && selectedTeachers.length > 0 && (
            <button
              onClick={handleSendCredentials}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center"
            >
              <FiSend className="mr-1" /> Send Credentials ({selectedTeachers.length})
            </button>
          )}
          
          <button
            onClick={() => {
              const csvContent = generateTeacherCSVTemplate();
              const blob = new Blob([csvContent], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'teachers_template.csv';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              window.URL.revokeObjectURL(url);
            }}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center"
          >
            <FiDownload className="mr-1" /> Download Template
          </button>

          <label className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center cursor-pointer">
            <FiUpload className="mr-1" /> Bulk Upload
            <input
              type="file"
              accept=".csv"
              onChange={onBulkUpload}
              className="hidden"
            />
          </label>

          <button
            onClick={onExport}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center"
          >
            <FiDownload className="mr-1" /> Export CSV
          </button>

          <button
            onClick={() => {
              console.log('🔄 Add Teacher button clicked - resetting form');
              setShowAddForm(true);
              setIsEditing(false);
              setFormData({
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
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center"
          >
            <FiPlus className="mr-1" /> Add Teacher
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActionBar;