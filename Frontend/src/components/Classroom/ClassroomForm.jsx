import React from 'react';
import { FiPlus, FiX } from 'react-icons/fi';

const ClassroomForm = ({
  formData,
  handleInputChange,
  handleEquipmentChange,
  handleSubmit,
  isEditing,
  setShowAddForm,
  setFormData,
  setIsEditing,
  equipmentOptions = []
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 transition-all duration-300 border border-blue-100">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          <FiPlus className="mr-2" /> {isEditing ? 'Edit Classroom' : 'Add New Classroom'}
        </h2>
        <button 
          onClick={() => {
            setShowAddForm(false);
            setIsEditing(false);
          }}
          className="text-gray-500 hover:text-gray-700"
        >
          <FiX className="h-5 w-5" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room Number *</label>
            <input
              type="text"
              name="roomNumber"
              value={formData.roomNumber}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              required
              placeholder="Enter room number (e.g., 101, LT-1)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Building *</label>
            <select
              name="building"
              value={formData.building}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              required
            >
              <option value="">Select Building</option>
              <option value="New Gallary">New Gallary</option>
              <option value="DOMS Building">DOMS Building</option>
              <option value="Old Gallary">Old Gallary</option>
              <option value="Indovation Building">Indovation Building</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity *</label>
            <input
              type="number"
              name="capacity"
              value={formData.capacity}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              required
              placeholder="Enter capacity"
              min="1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Floor *</label>
            <input
              type="number"
              name="floor"
              value={formData.floor}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              required
              placeholder="Enter floor number"
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              required
            >  
              <option value="Classroom">Classroom</option>
              <option value="Lab">Lab</option>
              <option value="Lecture Theatre">Lecture Theatre</option>
              <option value="Seminar Hall">Seminar Hall</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rows</label>
            <input
              type="number"
              name="rows"
              value={formData.rows}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              min="1"
              max="50"
              placeholder="Number of rows"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Seats Per Row</label>
            <input
              type="number"
              name="seatsPerRow"
              value={formData.seatsPerRow}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              min="1"
              max="50"
              placeholder="Seats per row"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Facilities</label>
            <div className="flex flex-wrap gap-2">
              {equipmentOptions && equipmentOptions.length > 0 ? equipmentOptions.map((facility) => (
                <button
                  key={facility}
                  type="button"
                  onClick={() => handleEquipmentChange(facility)}
                  className={`px-4 py-2 rounded-lg transition ${
                    formData.facilities && formData.facilities.includes(facility)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {facility}
                </button>
              )) : (
                <div className="text-gray-500 text-sm">No facility options available</div>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-end pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => {
              setShowAddForm(false);
              setIsEditing(false);
            }}
            className="mr-3 px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 shadow-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:opacity-90 transition shadow-md"
          >
            {isEditing ? 'Update Classroom' : 'Add Classroom'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClassroomForm;