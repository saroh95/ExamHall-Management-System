import React from 'react';
import { 
  FiUsers, 
  FiCpu, 
  FiRadio, 
  FiBook, 
  FiCalendar,
  FiZap,
  FiTool,
  FiCode,
  FiAward
} from 'react-icons/fi';

const StatsCards = ({
  departments = {},
  currentYearStudents,
  onDepartmentClick,
  onTotalStudentsClick,
  onBatchYearClick
}) => {
  // Build batches dynamically from provided student batch years (top 4 by year desc)
  const sortedYears = Object.keys(currentYearStudents || {})
    .filter(Boolean)
    .sort((a, b) => Number(b) - Number(a));
  const topYears = sortedYears.slice(0, 4);
  const batches = topYears.map((y) => ({ year: y, name: `Batch ${y}` }));

  // Department icons and colors mapping
  const departmentConfig = {
    CSE: { icon: <FiCpu size={24} />, color: 'blue' },
    'Computer Science': { icon: <FiCpu size={24} />, color: 'blue' },
    ECE: { icon: <FiRadio size={24} />, color: 'purple' },
    'Electronics & Communication': { icon: <FiRadio size={24} />, color: 'purple' },
    EE: { icon: <FiZap size={24} />, color: 'yellow' },
    'Electrical & Electronics': { icon: <FiZap size={24} />, color: 'yellow' },
    ME: { icon: <FiTool size={24} />, color: 'red' },
    'Mechanical': { icon: <FiTool size={24} />, color: 'red' },
    CE: { icon: <FiCode size={24} />, color: 'green' },
    'Civil': { icon: <FiCode size={24} />, color: 'green' },
    EIE: { icon: <FiAward size={24} />, color: 'indigo' },
    'Electronics & Instrumentation': { icon: <FiAward size={24} />, color: 'indigo' },
    IT: { icon: <FiCpu size={24} />, color: 'teal' },
    'Information Technology': { icon: <FiCpu size={24} />, color: 'teal' }
  };

  // Calculate total students across all departments
  const totalStudents = Object.values(departments).reduce((sum, count) => sum + count, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {/* Total Students Card */}
      <div 
        className="bg-white rounded-xl shadow-md p-6 border-l-4 border-gray-500 cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => onTotalStudentsClick && onTotalStudentsClick()}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Students</p>
            <p className="text-2xl font-semibold text-gray-800">{totalStudents}</p>
          </div>
          <div className="p-3 rounded-full bg-gray-100 text-gray-600">
            <FiUsers size={24} />
          </div>
        </div>
      </div>

      {/* Department Cards */}
      {Object.entries(departments).map(([dept, count]) => {
        const config = departmentConfig[dept] || { icon: <FiBook size={24} />, color: 'gray' };
        const colorClass = `border-${config.color}-500 bg-${config.color}-100 text-${config.color}-600`;
        
        return count > 0 ? (
          <div 
            key={dept} 
            className={`bg-white rounded-xl shadow-md p-6 border-l-4 border-${config.color}-500 cursor-pointer hover:shadow-lg transition-shadow`}
            onClick={() => onDepartmentClick && onDepartmentClick(dept)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{dept} Students</p>
                <p className="text-2xl font-semibold text-gray-800">{count}</p>
              </div>
              <div className={`p-3 rounded-full ${colorClass}`}>
                {config.icon}
              </div>
            </div>
          </div>
        ) : null;
      })}

      {/* Current Batch Years - Clickable */}
      <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-indigo-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Current Batches</p>
            <div className="text-sm text-gray-800 space-y-2 mt-2">
              {batches.map(batch => (
                <div
                  key={batch.year}
                  onClick={() => onBatchYearClick?.(batch.year)} // ✅ Makes it clickable
                  className="flex justify-between cursor-pointer hover:text-indigo-700 hover:underline transition"
                >
                  <span>{batch.name}</span>
                  <span className="font-semibold">
                    {currentYearStudents[batch.year] || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
            <FiCalendar size={24} />
          </div>
        </div>
      </div>
    </div>
  );
};


export default StatsCards;