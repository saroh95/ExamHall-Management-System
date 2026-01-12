import React, { useState } from 'react';
import { FiX, FiSave, FiUpload, FiTrash2, FiUser } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { studentAPI } from '../../services/api';
import { 
  DEPARTMENT_OPTIONS, 
  SEMESTER_OPTIONS, 
  PHOTO_UPLOAD, 
  validateFile, 
  formatFileSize,
  DEFAULT_STUDENT_FORM 
} from '../../constants/student';

const StudentForm = ({
  formData,
  handleInputChange,
  handleSubmit,
  isEditing,
  setShowAddForm,
  setFormData,
  setIsEditing,
  onClose,
  semesters = SEMESTER_OPTIONS,
  departments = DEPARTMENT_OPTIONS
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(formData.photo || null);
  const [isUploading, setIsUploading] = useState(false);

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const errors = validateFile(file);
    if (errors.length > 0) {
      toast.error(errors.join(', '));
      return;
    }

    setSelectedPhoto(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoUpload = async (studentId) => {
    if (!selectedPhoto || !studentId) return null;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', selectedPhoto);
      
      const response = await studentAPI.uploadPhoto(studentId, formData);
      toast.success('Photo uploaded successfully!');
      return response.data.data.photoUrl;
    } catch (error) {
      console.error('Photo upload error:', error);
      toast.error('Failed to upload photo');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handlePhotoDelete = async (studentId) => {
    if (!studentId) return;

    try {
      await studentAPI.deletePhoto(studentId);
      setPhotoPreview(null);
      setSelectedPhoto(null);
      setFormData(prev => ({ ...prev, photo: '' }));
      toast.success('Photo deleted successfully!');
    } catch (error) {
      console.error('Photo delete error:', error);
      toast.error('Failed to delete photo');
    }
  };

  const resetForm = () => {
    // Use onClose if available, otherwise use setShowAddForm
    if (onClose) {
      onClose();
    } else {
      setShowAddForm(false);
      setIsEditing(false);
      setFormData(DEFAULT_STUDENT_FORM);
    }
    
    setSelectedPhoto(null);
    setPhotoPreview(null);
  };
  return (
    <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          {isEditing ? 'Edit Student' : 'Add New Student'}
        </h2>
        <button
          onClick={resetForm}
          className="text-gray-500 hover:text-gray-700"
        >
          <FiX size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Photo Upload Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Profile Photo</label>
          <div className="flex items-center space-x-4">
            {/* Photo Preview */}
            <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
              {photoPreview ? (
                <img 
                  src={photoPreview} 
                  alt="Student" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <FiUser size={32} className="text-gray-400" />
              )}
            </div>
            
            {/* Upload Controls */}
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <label className="cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                  <FiUpload className="mr-2" />
                  Choose Photo
                  <input
                    type="file"
                    accept={PHOTO_UPLOAD.ACCEPT_STRING}
                    onChange={handlePhotoSelect}
                    className="sr-only"
                  />
                </label>
                
                {photoPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      if (isEditing && formData._id) {
                        handlePhotoDelete(formData._id);
                      } else {
                        setPhotoPreview(null);
                        setSelectedPhoto(null);
                      }
                    }}
                    className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                  >
                    <FiTrash2 className="mr-2" />
                    Remove
                  </button>
                )}
              </div>
              
              <p className="mt-1 text-xs text-gray-500">
                Max size: {formatFileSize(PHOTO_UPLOAD.MAX_SIZE)}. Formats: JPG, PNG, GIF
              </p>
              
              {selectedPhoto && (
                <p className="mt-1 text-xs text-green-600">
                  Selected: {selectedPhoto.name} ({formatFileSize(selectedPhoto.size)})
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Scholar ID is auto-generated; field removed */}

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name*</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
              maxLength="100"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email*</label>
             <input
             type="email"
             name="personalEmail"
             value={formData.personalEmail}
             onChange={handleInputChange}
             className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
             required
              pattern="^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$"
             title="Must be a valid email address"
            />
          </div>


          {/* Contact Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number*</label>
            <input
              type="tel"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
              pattern="[0-9]{10,15}"
              title="10-15 digit phone number"
            />
          </div>

          {/* Semester */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Semester*</label>
            <select
              name="semester"
              value={formData.semester}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            >
              {semesters.map(sem => (
                <option key={sem} value={sem}>{sem}</option>
              ))}
            </select>
          </div>

          {/* Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Section*</label>
            <input
              type="text"
              name="section"
              value={formData.section}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
              maxLength="2"
              pattern="[A-Z]{1,2}"
              title="1-2 uppercase letters"
            />
          </div>

          {/* Batch Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Batch Year*</label>
            <input
              type="text"
              name="batchYear"
              value={formData.batchYear}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
              pattern="20\d{2}"
              title="Must be a valid year (e.g., 2023)"
            />
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department*</label>
            <select
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={(dept._id || dept.value || dept.code)} value={(dept._id || dept.code || dept.value)}>
                  {dept.name || dept.label}
                </option>
              ))}
            </select>
          </div>

          {/* Address */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FiSave className="inline mr-1" />
            {isUploading ? 'Uploading...' : (isEditing ? 'Update Student' : 'Save Student')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StudentForm;