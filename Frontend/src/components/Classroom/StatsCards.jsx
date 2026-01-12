import React from 'react';
import { FiHome, FiUsers, FiClock, FiMapPin } from 'react-icons/fi';

const StatsCards = ({ 
  classrooms = [], 
  onTypeClick, 
  onBuildingClick, 
  onTotalClick 
}) => {
  const lectureHalls = classrooms.filter(c => 
    (c.type === 'lecture') || (c.classroomType === 'Lecture Hall')
  );
  const laboratories = classrooms.filter(c => 
    (c.type === 'laboratory') || (c.classroomType === 'Laboratory')
  );
  const buildings = Array.from(new Set(classrooms.map(c => c.building).filter(Boolean)));

  return (
    <div className="space-y-6 mb-8">
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 transition-transform hover:scale-[1.02] cursor-pointer hover:shadow-xl"
          onClick={onTotalClick}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-gray-800">{classrooms.length}</div>
              <div className="text-gray-600">Total Classrooms</div>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FiHome className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div 
          className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 transition-transform hover:scale-[1.02] cursor-pointer hover:shadow-xl"
          onClick={() => onTypeClick('lecture')}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-gray-800">
                {lectureHalls.length}
              </div>
              <div className="text-gray-600">Lecture Halls</div>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <FiUsers className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div 
          className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500 transition-transform hover:scale-[1.02] cursor-pointer hover:shadow-xl"
          onClick={() => onTypeClick('laboratory')}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-gray-800">
                {laboratories.length}
              </div>
              <div className="text-gray-600">Laboratories</div>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <FiClock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
        
        <div 
          className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500 transition-transform hover:scale-[1.02] cursor-pointer hover:shadow-xl"
          onClick={() => onBuildingClick(buildings[0])}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-gray-800">
                {buildings.length}
              </div>
              <div className="text-gray-600">Buildings</div>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <FiMapPin className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Building Filter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {buildings.map((building, index) => {
          const buildingClassrooms = classrooms.filter(c => c.building === building);
          const buildingLectureHalls = buildingClassrooms.filter(c => 
            (c.type === 'lecture') || (c.classroomType === 'Lecture Hall')
          );
          const buildingLabs = buildingClassrooms.filter(c => 
            (c.type === 'laboratory') || (c.classroomType === 'Laboratory')
          );
          
          return (
            <div 
              key={building}
              className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500 transition-transform hover:scale-[1.02] cursor-pointer hover:shadow-lg"
              onClick={() => onBuildingClick(building)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-gray-800">{building}</div>
                <div className="bg-purple-100 p-2 rounded-full">
                  <FiMapPin className="h-4 w-4 text-purple-600" />
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Total: {buildingClassrooms.length}</span>
                  <span>Lecture: {buildingLectureHalls.length}</span>
                  <span>Lab: {buildingLabs.length}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StatsCards;