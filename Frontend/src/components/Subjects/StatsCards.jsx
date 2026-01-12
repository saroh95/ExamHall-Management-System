import React from 'react';
import { 
  FiBook, 
  FiBookOpen, 
  FiLayers, 
  FiUsers,
  FiCpu,
  FiRadio,
  FiZap,
  FiTool,
  FiCode,
  FiAward
} from 'react-icons/fi';

const StatsCards = ({
  subjects = [],
  onTypeClick,
  onDepartmentClick,
  onTotalClick
}) => {
  // Calculate statistics
  const totalSubjects = subjects.length;
  const regularSubjects = subjects.filter(s => s.type === 'regular').length;
  const coreElectiveSubjects = subjects.filter(s => s.type === 'core_elective').length;
  const openElectiveSubjects = subjects.filter(s => s.type === 'open_elective').length;
  const totalElectiveSubjects = coreElectiveSubjects + openElectiveSubjects;
  
  // Calculate department counts
  const departmentCounts = subjects.reduce((acc, subject) => {
    let deptName = 'Unknown';
    
    // Handle different department data structures
    if (subject.departmentId && subject.departmentId.length > 0) {
      // If it's a populated department object
      if (subject.departmentId[0] && typeof subject.departmentId[0] === 'object') {
        deptName = subject.departmentId[0].name || subject.departmentId[0].code || 'Unknown';
      } else {
        deptName = 'Unknown';
      }
    } else if (subject.department) {
      // If it's a string department field
      deptName = subject.department;
    }
    
    acc[deptName] = (acc[deptName] || 0) + 1;
    return acc;
  }, {});

  // Department icons and colors mapping
  const departmentConfig = {
    'Computer Science Engineering': { icon: <FiCpu size={24} />, color: 'blue' },
    'CSE': { icon: <FiCpu size={24} />, color: 'blue' },
    'Electrical Engineering': { icon: <FiZap size={24} />, color: 'yellow' },
    'EEE': { icon: <FiZap size={24} />, color: 'yellow' },
    'Mechanical Engineering': { icon: <FiTool size={24} />, color: 'red' },
    'MECH': { icon: <FiTool size={24} />, color: 'red' },
    'Civil Engineering': { icon: <FiCode size={24} />, color: 'green' },
    'CIVIL': { icon: <FiCode size={24} />, color: 'green' },
    'Electronics & Communication': { icon: <FiRadio size={24} />, color: 'purple' },
    'ECE': { icon: <FiRadio size={24} />, color: 'purple' },
    'Electronics & Instrumentation': { icon: <FiAward size={24} />, color: 'indigo' },
    'EIE': { icon: <FiAward size={24} />, color: 'indigo' }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {/* Total Subjects Card */}
      <div 
        className="bg-white rounded-xl shadow-md p-6 border-l-4 border-gray-500 cursor-pointer hover:shadow-lg transition-transform hover:scale-[1.02]"
        onClick={() => onTotalClick && onTotalClick()}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Subjects</p>
            <p className="text-2xl font-semibold text-gray-800">{totalSubjects}</p>
          </div>
          <div className="p-3 rounded-full bg-gray-100 text-gray-600">
            <FiBook size={24} />
          </div>
        </div>
      </div>

      {/* Regular Subjects Card */}
      <div 
        className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 cursor-pointer hover:shadow-lg transition-transform hover:scale-[1.02]"
        onClick={() => onTypeClick && onTypeClick('regular')}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Regular Subjects</p>
            <p className="text-2xl font-semibold text-gray-800">{regularSubjects}</p>
          </div>
          <div className="p-3 rounded-full bg-green-100 text-green-600">
            <FiBook size={24} />
          </div>
        </div>
      </div>

      {/* Core Elective Subjects Card */}
      <div 
        className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500 cursor-pointer hover:shadow-lg transition-transform hover:scale-[1.02]"
        onClick={() => onTypeClick && onTypeClick('core_elective')}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Core Elective</p>
            <p className="text-2xl font-semibold text-gray-800">{coreElectiveSubjects}</p>
          </div>
          <div className="p-3 rounded-full bg-purple-100 text-purple-600">
            <FiBookOpen size={24} />
          </div>
        </div>
      </div>

      {/* Open Elective Subjects Card */}
      <div 
        className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500 cursor-pointer hover:shadow-lg transition-transform hover:scale-[1.02]"
        onClick={() => onTypeClick && onTypeClick('open_elective')}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Open Elective</p>
            <p className="text-2xl font-semibold text-gray-800">{openElectiveSubjects}</p>
          </div>
          <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
            <FiBookOpen size={24} />
          </div>
        </div>
      </div>

             {/* Department Cards - Only show departments that have subjects */}
       {Object.entries(departmentCounts).map(([dept, count]) => {
         const config = departmentConfig[dept] || { icon: <FiLayers size={24} />, color: 'gray' };
         
         // Create dynamic color classes
         const getColorClasses = (color) => {
           const colorMap = {
             blue: 'border-blue-500 bg-blue-100 text-blue-600',
             purple: 'border-purple-500 bg-purple-100 text-purple-600',
             yellow: 'border-yellow-500 bg-yellow-100 text-yellow-600',
             red: 'border-red-500 bg-red-100 text-red-600',
             green: 'border-green-500 bg-green-100 text-green-600',
             indigo: 'border-indigo-500 bg-indigo-100 text-indigo-600',
             gray: 'border-gray-500 bg-gray-100 text-gray-600'
           };
           return colorMap[color] || colorMap.gray;
         };
         
         const borderColorClass = `border-l-4 border-${config.color}-500`;
         const iconColorClass = getColorClasses(config.color);
         
         return (
           <div 
             key={dept} 
             className={`bg-white rounded-xl shadow-md p-6 ${borderColorClass} cursor-pointer hover:shadow-lg transition-transform hover:scale-[1.02]`}
             onClick={() => onDepartmentClick && onDepartmentClick(dept)}
           >
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-sm font-medium text-gray-500">{dept} Subjects</p>
                 <p className="text-2xl font-semibold text-gray-800">{count}</p>
               </div>
               <div className={`p-3 rounded-full ${iconColorClass}`}>
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