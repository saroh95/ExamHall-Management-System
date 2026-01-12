import React from 'react';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';

const ClassroomTable = ({
  filteredClassrooms = [],
  classrooms = [],
  selectedClassrooms = [],
  handleSelectClassroom,
  handleSelectAll,
  handleEdit,
  handleDelete
}) => {
  const allSelected = filteredClassrooms.length > 0 && 
                     selectedClassrooms.length === filteredClassrooms.length;

  // Helper function to display facilities/equipment names
  const renderFacilities = (facilities) => {
    if (!facilities) return 'None';
    
    const facilityNames = {
      projector: 'Projector',
      whiteboard: 'Whiteboard',
      blackboard: 'Blackboard',
      air_conditioning: 'AC',
      fans: 'Fans',
      lights: 'Lights',
      computers: 'Computers',
      internet: 'Internet',
      audio_system: 'Audio',
      video_system: 'Video',
      furniture: 'Furniture',
      storage: 'Storage',
      security_camera: 'Camera',
      soundSystem: 'Sound System',
      tv: 'TV',
      microphone: 'Microphone',
      camera: 'Camera'
    };

    // Handle array format (backend) or object format (frontend mock data)
    if (Array.isArray(facilities)) {
      return (
        <div className="flex flex-wrap gap-1">
          {facilities.map((facility) => (
            <span 
              key={facility} 
              className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
            >
              {facilityNames[facility] || facility}
            </span>
          ))}
        </div>
      );
    } else if (typeof facilities === 'object') {
      return (
        <div className="flex flex-wrap gap-1">
          {Object.entries(facilities).map(([item, hasItem]) => (
            hasItem && (
              <span 
                key={item} 
                className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
              >
                {facilityNames[item] || item}
              </span>
            )
          ))}
        </div>
      );
    }
    
    return 'None';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-blue-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleSelectAll}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Code
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Classroom Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Building
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Capacity
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Equipment
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredClassrooms?.length > 0 ? (
              filteredClassrooms.map((classroom) => (
                <tr key={classroom._id || classroom.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedClassrooms.includes(classroom._id || classroom.id)}
                      onChange={() => handleSelectClassroom(classroom._id || classroom.id)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {classroom.roomNumber || classroom.roomCode}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {classroom.name || classroom.classroomName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {classroom.building}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {classroom.capacity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {classroom.type || classroom.classroomType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {renderFacilities(classroom.facilities || classroom.equipment)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(classroom)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      <FiEdit2 className="inline" />
                    </button>
                    <button
                      onClick={() => handleDelete(classroom._id || classroom.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <FiTrash2 className="inline" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                  No classrooms found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClassroomTable;