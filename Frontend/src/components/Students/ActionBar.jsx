import React, { useState, useRef } from 'react';
import { FiSearch, FiPlus, FiTrash2, FiUpload, FiSend, FiDownload } from 'react-icons/fi';
import { generateStudentCSVTemplate } from '../../utils/studentCSVTemplate';
import { useNavigate } from 'react-router-dom';
import { canCreate, canBulkUpload, canExport } from '../../utils/permissions';

const ActionBar = ({
  searchTerm,
  setSearchTerm,
  onAddStudent,
  onBulkUpload,
  onBulkDelete,
  onSendCredentials,
  onExport,
  selectedStudents,
  filterDepartment,
  setFilterDepartment,
  filterYear,
  setFilterYear,
  filterSemester,
  setFilterSemester,
  departmentOptions,
  userRole = 'admin',
  currentUser = null
}) => {
  const [searchActive, setSearchActive] = useState(false);
  const navigate = useNavigate();
  const fileInputRef = useRef();

  return (
    <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      {/* Search Box */}
      <div className={`relative ${searchActive ? 'w-full md:w-96' : 'w-auto'}`}>
        <div className="flex items-center">
          {!searchActive && (
            <button
              onClick={() => setSearchActive(true)}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              <FiSearch size={20} />
            </button>
          )}
          {searchActive && (
            <>
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
              />
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSearchActive(false);
                }}
                className="ml-2 text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center space-x-3">
        {/* Export CSV - Check permission */}
        {canExport(currentUser) && (
          <button
            onClick={onExport}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition shadow-md"
          >
            <FiDownload className="mr-2" />
            Export CSV
          </button>
        )}
        
        {/* Download Template - Check permission */}
        {canBulkUpload(currentUser) && (
          <button
            onClick={() => {
              const csvContent = generateStudentCSVTemplate();
              const blob = new Blob([csvContent], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'students_template.csv';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              window.URL.revokeObjectURL(url);
            }}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition shadow-md"
          >
            <FiDownload className="mr-2" />
            Download Template
          </button>
        )}

        {/* Bulk Upload - Check permission */}
        {canBulkUpload(currentUser) && (
          <label className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-md cursor-pointer">
            <FiUpload className="mr-2" />
            Bulk Upload
            <input type="file" accept=".csv" onChange={onBulkUpload} className="hidden" />
          </label>
        )}

        {/* Delete Selected Students */}
        {selectedStudents && selectedStudents.length > 0 && (
          <button
            onClick={onBulkDelete}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition shadow-md"
          >
            <FiTrash2 className="mr-2" />
            Delete Selected ({selectedStudents.length})
          </button>
        )}

        {selectedStudents && selectedStudents.length > 0 && (
        <button
          onClick={onSendCredentials}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-md"
        >
        <FiSend className="mr-2" />
        Send Credentials
        </button>
        )}

        {/* Add Student - Check permission */}
        {canCreate(currentUser, 'students') && (
          <button
            onClick={onAddStudent}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md"
          >
            <FiPlus className="mr-2" />
            Add Student
          </button>
        )}
      </div>
    </div>
  );
};

export default ActionBar;
