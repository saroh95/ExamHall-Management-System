import React from 'react';
import { 
  FiUser, 
  FiCpu, 
  FiRadio, 
  FiBook, 
  FiZap,
  FiTool,
  FiCode,
  FiAward,
  FiClock,
  FiCheckCircle,
  FiPauseCircle
} from 'react-icons/fi';

const StatsCards = ({
  teachers = [],
  onStatusClick,
  onDepartmentClick,
  onTotalClick
}) => {
  // Department icons and colors mapping
  const departmentConfig = {
    CSE: { icon: <FiCpu size={24} />, color: 'blue' },
    'Computer Science': { icon: <FiCpu size={24} />, color: 'blue' },
    ECE: { icon: <FiRadio size={24} />, color: 'purple' },
    'Electronics': { icon: <FiRadio size={24} />, color: 'purple' },
    EE: { icon: <FiZap size={24} />, color: 'yellow' },
    'Electrical': { icon: <FiZap size={24} />, color: 'yellow' },
    ME: { icon: <FiTool size={24} />, color: 'red' },
    'Mechanical': { icon: <FiTool size={24} />, color: 'red' },
    CE: { icon: <FiCode size={24} />, color: 'green' },
    'Civil': { icon: <FiCode size={24} />, color: 'green' },
    EIE: { icon: <FiAward size={24} />, color: 'indigo' },
    'Electronics & Instrumentation': { icon: <FiAward size={24} />, color: 'indigo' }
  };

  // Calculate department counts
  const departmentCounts = teachers.reduce((acc, teacher) => {
    const deptName = teacher.department?.name || teacher.department || 'Unknown';
    acc[deptName] = (acc[deptName] || 0) + 1;
    return acc;
  }, {});

  // Status counts
  const statusCounts = {
    Active: teachers.filter(t => t.status === 'Active' || t.isActive === true).length,
    'On Leave': teachers.filter(t => t.status === 'On Leave').length,
    Inactive: teachers.filter(t => t.status === 'Inactive' || t.isActive === false).length
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {/* Total Teachers Card */}
      <div 
        className="bg-white rounded-xl shadow-md p-6 border-l-4 border-gray-500 cursor-pointer hover:shadow-lg transition-transform hover:scale-[1.02]"
        onClick={() => onTotalClick && onTotalClick()}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Teachers</p>
            <p className="text-2xl font-semibold text-gray-800">{teachers.length}</p>
          </div>
          <div className="p-3 rounded-full bg-gray-100 text-gray-600">
            <FiUser size={24} />
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div 
        className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 cursor-pointer hover:shadow-lg transition-transform hover:scale-[1.02]"
        onClick={() => onStatusClick && onStatusClick('Active')}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Active</p>
            <p className="text-2xl font-semibold text-gray-800">{statusCounts.Active}</p>
          </div>
          <div className="p-3 rounded-full bg-green-100 text-green-600 relative">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-ping absolute top-1 right-1"></div>
            <FiCheckCircle size={24} />
          </div>
        </div>
      </div>

      <div 
        className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500 cursor-pointer hover:shadow-lg transition-transform hover:scale-[1.02]"
        onClick={() => onStatusClick && onStatusClick('On Leave')}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">On Leave</p>
            <p className="text-2xl font-semibold text-gray-800">{statusCounts['On Leave']}</p>
          </div>
          <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
            <FiClock size={24} />
          </div>
        </div>
      </div>

      <div 
        className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500 cursor-pointer hover:shadow-lg transition-transform hover:scale-[1.02]"
        onClick={() => onStatusClick && onStatusClick('Inactive')}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Inactive</p>
            <p className="text-2xl font-semibold text-gray-800">{statusCounts.Inactive}</p>
          </div>
          <div className="p-3 rounded-full bg-red-100 text-red-600">
            <FiPauseCircle size={24} />
          </div>
        </div>
      </div>

      {/* Department Cards - Only show departments that have teachers */}
      {Object.entries(departmentCounts).map(([dept, count]) => {
        const config = departmentConfig[dept] || { icon: <FiBook size={24} />, color: 'gray' };
        const colorClass = `border-${config.color}-500 bg-${config.color}-100 text-${config.color}-600`;
        
        return (
          <div 
            key={dept} 
            className={`bg-white rounded-xl shadow-md p-6 border-l-4 border-${config.color}-500 cursor-pointer hover:shadow-lg transition-transform hover:scale-[1.02]`}
            onClick={() => onDepartmentClick && onDepartmentClick(dept)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{dept} Teachers</p>
                <p className="text-2xl font-semibold text-gray-800">{count}</p>
              </div>
              <div className={`p-3 rounded-full ${colorClass}`}>
                {config.icon}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards;