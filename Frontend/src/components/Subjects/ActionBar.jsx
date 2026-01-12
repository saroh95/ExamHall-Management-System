import React from 'react';
import { FiSearch, FiPlus, FiTrash2, FiUpload, FiDownload } from 'react-icons/fi';
import { generateSubjectCSVTemplate } from '../../utils/subjectCSVTemplate';

const ActionBar = ({
  searchTerm,
  setSearchTerm,
  showAddForm,
  setShowAddForm,
  setIsEditing,
  setFormData,
  showBulkActions,
  selectedSubjects,
  handleBulkDelete,
  onBulkUpload,
  onExportSubjects
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="w-full md:w-auto">
          <div className="relative">
            <FiSearch className="absolute left-3 top-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, code or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-96 pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          {showBulkActions && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:opacity-90 transition shadow-md"
            >
              <FiTrash2 className="mr-2" /> Remove Selected ({selectedSubjects.length})
            </button>
          )}
          
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setIsEditing(false);
              setFormData({ code: '', name: '', department: '', credits: '', type: 'regular' });
            }}
            className="flex items-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:opacity-90 transition shadow-md"
          >
            <FiPlus className="mr-2" /> {showAddForm ? 'Cancel' : 'Add Subject'}
          </button>
          
          <button
            onClick={() => {
              const csvContent = generateSubjectCSVTemplate();
              const blob = new Blob([csvContent], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'subjects_template.csv';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              window.URL.revokeObjectURL(url);
            }}
            className="flex items-center px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:opacity-90 transition shadow-md"
          >
            <FiDownload className="mr-2" /> Download Template
          </button>

          <button
            onClick={onExportSubjects}
            className="flex items-center px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-700 text-white rounded-lg hover:opacity-90 transition shadow-md"
          >
            <FiDownload className="mr-2" /> Export Subjects
          </button>
          
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