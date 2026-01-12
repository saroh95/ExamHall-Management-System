import React from 'react';
import { FiUser, FiEdit2, FiTrash2, FiUserPlus } from 'react-icons/fi';

const TeacherTable = ({
  filteredTeachers,
  teachers,
  selectedTeachers,
  handleSelectTeacher,
  handleSelectAll,
  handleEdit,
  handleDelete,
  searchTerm,
  setShowAddForm,
  setSearchTerm
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold text-gray-800">Teacher List</h2>
        <div className="text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
          Showing <span className="font-medium">{filteredTeachers.length}</span> of <span className="font-medium">{teachers.length}</span> teachers
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
                  checked={filteredTeachers.length > 0 && selectedTeachers.length === filteredTeachers.length}
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTeachers.length > 0 ? filteredTeachers.map((teacher) => (
              <tr key={teacher._id} className={`hover:bg-blue-50 transition-colors ${
                selectedTeachers.includes(teacher._id) ? 'bg-blue-50' : ''
              }`}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input 
                    type="checkbox" 
                    className="rounded text-blue-600 focus:ring-blue-500"
                    checked={selectedTeachers.includes(teacher._id)}
                    onChange={() => handleSelectTeacher(teacher._id)}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-medium">
                      {(teacher.fullName || teacher.name).charAt(0)}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{teacher.fullName || teacher.name}</div>
                      <div className="text-sm text-gray-500">{teacher.instituteEmail || teacher.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{teacher.phone}</div>
                  <div className="text-sm text-gray-500">{teacher.personalEmail || 'No personal email'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{teacher.department?.name || teacher.department}</div>
                  <div className="text-xs text-gray-500">
                    {teacher.department?.code || 
                     (teacher.department?.name === 'Computer Science' ? 'CSE' : 
                      teacher.department?.name === 'Mathematics' ? 'MATH' : 
                      teacher.department?.name === 'Mechanical Engineering' ? 'ME' : 
                      teacher.department?.name === 'Civil Engineering' ? 'CE' : 
                      teacher.department?.name === 'Electrical Engineering' ? 'EE' : 'ENG')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    (teacher.isActive === true || teacher.status === 'Active')
                      ? 'bg-green-100 text-green-800' 
                      : teacher.status === 'On Leave' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-red-100 text-red-800'
                  }`}>
                    {teacher.status || (teacher.isActive ? 'Active' : 'Inactive')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => handleEdit(teacher)}
                      className="text-blue-600 hover:text-blue-900 p-1.5 rounded-full hover:bg-blue-100"
                      title="Edit"
                    >
                      <FiEdit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to remove ${teacher.fullName || teacher.name}?`)) {
                          handleDelete(teacher._id);
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
                <td colSpan="6" className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <FiUser className="h-20 w-20 text-gray-200 mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">No teachers found</h3>
                    <p className="text-gray-500 max-w-md mb-4">
                      {searchTerm ? `No teachers match your search for "${searchTerm}"` : 'Your teacher list is empty'}
                    </p>
                    <button
                      onClick={() => {
                        setShowAddForm(true);
                        setSearchTerm('');
                      }}
                      className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:opacity-90 transition flex items-center shadow-md"
                    >
                      <FiUserPlus className="mr-2" /> Add New Teacher
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {filteredTeachers.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">1</span> to <span className="font-medium">8</span> of{' '}
            <span className="font-medium">{filteredTeachers.length}</span> results
          </div>
          <div className="inline-flex rounded-md shadow-sm">
            <button
              className="relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
            >
              1
            </button>
            <button
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-blue-50 text-sm font-medium text-blue-600 hover:bg-blue-100"
            >
              2
            </button>
            <button
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
            >
              3
            </button>
            <button
              className="relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherTable;