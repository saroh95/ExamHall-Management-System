import React, { useState } from 'react';
import { FiBook, FiEdit2, FiTrash2, FiPlus, FiChevronUp, FiChevronDown } from 'react-icons/fi';

const SubjectTable = ({
  filteredSubjects,
  subjects,
  selectedSubjects,
  handleSelectSubject,
  handleSelectAll,
  handleEdit,
  handleDelete,
  searchTerm,
  setShowAddForm,
  setSearchTerm
}) => {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState({
    key: 'code',
    direction: 'ascending'
  });

  // Apply sorting
  const sortedSubjects = [...filteredSubjects].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? 1 : -1;
    }
    return 0;
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedSubjects.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedSubjects.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Handle sort request
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  // Get sort icon
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' 
      ? <FiChevronUp className="ml-1 inline" /> 
      : <FiChevronDown className="ml-1 inline" />;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold text-gray-800">Subject List</h2>
        <div className="text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
          Showing <span className="font-medium">{currentItems.length}</span> of{' '}
          <span className="font-medium">{sortedSubjects.length}</span> subjects
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-12 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input 
                  type="checkbox" 
                  className="rounded text-blue-600 focus:ring-blue-500"
                  onChange={handleSelectAll}
                  checked={selectedSubjects.length === filteredSubjects.length && filteredSubjects.length > 0}
                />
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('code')}
              >
                <span className="flex items-center">
                  Subject Code
                  {getSortIcon('code')}
                </span>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('name')}
              >
                <span className="flex items-center">
                  Subject Name
                  {getSortIcon('name')}
                </span>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('semesterId')}
              >
                <span className="flex items-center">
                  Semester
                  {getSortIcon('semesterId')}
                </span>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('departmentId')}
              >
                <span className="flex items-center">
                  Department
                  {getSortIcon('departmentId')}
                </span>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('credits')}
              >
                <span className="flex items-center">
                  Credits
                  {getSortIcon('credits')}
                </span>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('type')}
              >
                <span className="flex items-center">
                  Type
                  {getSortIcon('type')}
                </span>
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentItems.length > 0 ? currentItems.map((subject) => (
              <tr key={subject.id} className="hover:bg-blue-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input 
                    type="checkbox" 
                    className="rounded text-blue-600 focus:ring-blue-500"
                    checked={selectedSubjects.includes(subject.id)}
                    onChange={() => handleSelectSubject(subject.id)}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{subject.code}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{subject.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {subject.semesterId ? `Semester ${subject.semesterId}` : 'N/A'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {(() => {
                      console.log('🔍 Subject department data:', {
                        subjectId: subject._id,
                        departmentId: subject.departmentId,
                        department: subject.department,
                        departmentIdType: typeof subject.departmentId,
                        departmentIdLength: subject.departmentId ? subject.departmentId.length : 'null'
                      });
                      
                      if (subject.departmentId && subject.departmentId.length > 0) {
                        console.log('🔍 Department object:', subject.departmentId[0]);
                        return subject.departmentId[0].name || 'N/A';
                      } else if (subject.department === 'CSE') {
                        return 'Computer Science Engineering';
                      } else if (subject.department === 'EEE') {
                        return 'Electrical Engineering';
                      } else if (subject.department === 'MECH') {
                        return 'Mechanical Engineering';
                      } else if (subject.department === 'CIVIL') {
                        return 'Civil Engineering';
                      } else {
                        return subject.department || 'N/A';
                      }
                    })()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{subject.credits}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    subject.type === 'regular' 
                      ? 'bg-green-100 text-green-800' 
                      : subject.type === 'core_elective'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {subject.type === 'regular' ? 'Regular' : 
                     subject.type === 'core_elective' ? 'Core Elective' : 
                     subject.type === 'open_elective' ? 'Open Elective' : 
                     subject.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => handleEdit(subject)}
                      className="text-blue-600 hover:text-blue-900 p-1.5 rounded-full hover:bg-blue-100"
                      title="Edit"
                    >
                      <FiEdit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to remove ${subject.name}?`)) {
                          handleDelete(subject.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-900 p-1.5 rounded-full hover:bg-red-100"
                      title="Remove"
                    >
                      <FiTrash2 className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="8" className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <FiBook className="h-20 w-20 text-gray-200 mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">
                      {searchTerm ? 'No matching subjects found' : 'No subjects available'}
                    </h3>
                    <p className="text-gray-500 max-w-md mb-4">
                      {searchTerm 
                        ? `No subjects match your search for "${searchTerm}"` 
                        : 'Get started by adding a new subject'}
                    </p>
                    <button
                      onClick={() => {
                        setShowAddForm(true);
                        setSearchTerm('');
                      }}
                      className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:opacity-90 transition flex items-center shadow-md"
                    >
                      <FiPlus className="mr-2" /> Add New Subject
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {sortedSubjects.length > itemsPerPage && (
        <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
            <span className="font-medium">
              {Math.min(indexOfLastItem, sortedSubjects.length)}
            </span> of{' '}
            <span className="font-medium">{sortedSubjects.length}</span> results
          </div>
          <div className="inline-flex rounded-md shadow-sm">
            <button
              onClick={() => paginate(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                currentPage === 1 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              Previous
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
              <button
                key={number}
                onClick={() => paginate(number)}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${
                  currentPage === number
                    ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                {number}
              </button>
            ))}
            
            <button
              onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectTable;