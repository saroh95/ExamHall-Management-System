import React from 'react';
import { DEPARTMENT_OPTIONS as SHARED_DEPARTMENTS } from '../../constants/shared';
import { FiPlus, FiX } from 'react-icons/fi';

const SubjectForm = ({
  formData,
  handleInputChange,
  handleSubmit,
  isEditing,
  setShowAddForm,
  setFormData,
  setIsEditing
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 transition-all duration-300 border border-blue-100">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          <FiPlus className="mr-2" /> {isEditing ? 'Edit Subject' : 'Add New Subject'}
        </h2>
        <button 
          onClick={() => setShowAddForm(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          <FiX className="h-5 w-5" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject Code *</label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              required
              placeholder="Enter subject code (e.g., CS101)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              required
              placeholder="Enter subject name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
            <select
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              required
            >
              <option value="">Select Department</option>
              {SHARED_DEPARTMENTS.map((dept) => (
                <option key={dept.code} value={dept.code}>{dept.label || `${dept.name} (${dept.code})`}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Semester *</label>
            <select
              name="semester"
              value={formData.semester}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              required
            >
              <option value="">Select Semester</option>
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
              <option value="3">Semester 3</option>  
              <option value="4">Semester 4</option>
              <option value="5">Semester 5</option>
              <option value="6">Semester 6</option>
              <option value="7">Semester 7</option>    
              <option value="8">Semester 8</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Credits *</label>
            <select
              name="credits"
              value={formData.credits}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              required
            >
              <option value="">Select Credits</option>
              <option value="1">1 Credit</option>
              <option value="2">2 Credits</option>
              <option value="3">3 Credits</option>
              <option value="4">4 Credits</option>
              <option value="5">5 Credits</option>
            </select>
          </div>
         
        </div>
        <div className="flex justify-between pt-6 border-t border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject Type</label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="regular"
                  checked={formData.type === 'regular'}
                  onChange={handleInputChange}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2">Regular</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="core_elective"
                  checked={formData.type === 'core_elective'}
                  onChange={handleInputChange}
                  className="text-purple-600 focus:ring-purple-500"
                />
                <span className="ml-2">Core Elective</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="open_elective"
                  checked={formData.type === 'open_elective'}
                  onChange={handleInputChange}
                  className="text-green-600 focus:ring-green-500"
                />
                <span className="ml-2">Open Elective</span>
              </label>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowAddForm(false);
              setIsEditing(false);
              setFormData({ code: '', name: '', department: '',semester:'', credits: '', type: 'regular' });
            }}
            className=" ml-160 px-6 py-2.5 border  border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 shadow-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:opacity-90 transition shadow-md"
          >
            {isEditing ? 'Update Subject' : 'Add Subject'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubjectForm;