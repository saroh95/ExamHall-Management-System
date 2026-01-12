import React from 'react';
import { FiPlus, FiX } from 'react-icons/fi';
import { DESIGNATION_OPTIONS, QUALIFICATION_OPTIONS, VALIDATION_MESSAGES } from '../../constants/teacher';

const TeacherForm = ({
  formData,
  handleInputChange,
  handleSubmit,
  isEditing,
  setShowAddForm,
  setFormData,
  setIsEditing,
  departments = []
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 transition-all duration-300 border border-blue-100">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          <FiPlus className="mr-2" /> {isEditing ? 'Edit Teacher' : 'Add New Teacher'}
        </h2>
        <button 
          onClick={() => {
            setShowAddForm(false);
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
          className="text-gray-500 hover:text-gray-700"
        >
          <FiX className="h-5 w-5" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name || ''}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              required
              placeholder="Enter full name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
            <select
              name="department"
              value={formData.department || ''}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              required
            >
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name} ({dept.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone || ''}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              required
              placeholder="Enter phone number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Personal Email *</label>
            <input
              type="email"
              name="personalEmail"
              value={formData.personalEmail || ''}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              required
              placeholder="Enter personal email address"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
            <input
              type="text"
              name="address"
              value={formData.address || ''}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              required
              placeholder="Enter address"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Designation *</label>
            <select
              name="designation"
              value={formData.designation || ''}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              required
            >
              <option value="">Select Designation</option>
              {DESIGNATION_OPTIONS.map((designation) => (
                <option key={designation} value={designation}>
                  {designation}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Qualification *</label>
            <select
              name="qualification"
              value={formData.qualification || ''}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              required
            >
              <option value="">Select Qualification</option>
              {QUALIFICATION_OPTIONS.map((qualification) => (
                <option key={qualification} value={qualification}>
                  {qualification}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date *</label>
            <input
              type="date"
              name="joiningDate"
              value={formData.joiningDate || ''}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="status"
                  value="Active"
                  checked={(formData.status || 'Active') === 'Active'}
                  onChange={handleInputChange}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2">Active</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="status"
                  value="On Leave"
                  checked={(formData.status || 'Active') === 'On Leave'}
                  onChange={handleInputChange}
                  className="text-yellow-600 focus:ring-yellow-500"
                />
                <span className="ml-2">On Leave</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="status"
                  value="Inactive"
                  checked={(formData.status || 'Active') === 'Inactive'}
                  onChange={handleInputChange}
                  className="text-red-600 focus:ring-red-500"
                />
                <span className="ml-2">Inactive</span>
              </label>
            </div>
          </div>
        </div>
        <div className="flex justify-end pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => {
              setShowAddForm(false);
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
            className="mr-3 px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 shadow-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:opacity-90 transition shadow-md"
          >
            {isEditing ? 'Update Teacher' : 'Add Teacher'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TeacherForm;