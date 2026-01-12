import React from 'react';

const UserStats = ({ users }) => {
  const stats = [
    { name: 'Total Users', value: users.length, icon: 'users' },
    { 
      name: 'Active Users', 
      value: users.filter(u => u.isActive !== false).length,
      icon: 'check-circle',
      color: 'text-green-500'
    },
    { 
      name: 'Inactive Users', 
      value: users.filter(u => u.isActive === false).length,
      icon: 'x-circle',
      color: 'text-red-500'
    },
    { 
      name: 'Credentials Pending', 
      value: users.filter(u => !u.credentialsSent && u.userType !== 'admin').length,
      icon: 'envelope',
      color: 'text-yellow-500'
    },
  ];

  const roleDistribution = [
    { name: 'Admins', value: users.filter(u => u.userType === 'admin').length, color: 'bg-purple-500' },
    { name: 'Teachers', value: users.filter(u => u.userType === 'teacher').length, color: 'bg-blue-500' },
    { name: 'Students', value: users.filter(u => u.userType === 'student').length, color: 'bg-green-500' },
  ];

  const getIcon = (iconName) => {
    switch (iconName) {
      case 'users':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        );
      case 'check-circle':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'x-circle':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2 2m-2-2l2-2m0 0l2-2m-2 2l-2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'envelope':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className={`text-2xl font-semibold ${stat.color || 'text-gray-800'}`}>
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-full ${stat.color || 'text-blue-500'}`}>
                {getIcon(stat.icon)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Role Distribution</h3>
        <div className="flex flex-wrap gap-2">
          {roleDistribution.map((role, index) => (
            <div key={index} className="flex items-center">
              <div className={`w-3 h-3 rounded-full ${role.color} mr-2`}></div>
              <span className="text-sm text-gray-600">
                {role.name}: {role.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserStats;