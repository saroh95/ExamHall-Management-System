// Sample CSV template for bulk uploading teachers
export const generateTeacherCSVTemplate = () => {
  const headers = [
    'fullName',
    'personalEmail',
    'phone',
    'department',
    'address',
    'designation',
    'qualification',
    'specialization',
    'joiningDate',
    'password'
  ];

  const sampleData = [
    {
      fullName: 'Alice Johnson',
      personalEmail: 'alice.johnson@example.com',
      phone: '9876543210',
      department: 'CSE', // Accepts department code or name
      address: '123 Main St, City',
      designation: 'Assistant Professor',
      qualification: 'M.Tech',
      specialization: 'Computer Networks',
      joiningDate: '2022-08-15', // ISO format YYYY-MM-DD
      password: ''
    },
    {
      fullName: 'Bob Smith',
      personalEmail: 'bob.smith@example.com',
      phone: '9123456789',
      department: 'Electrical Engineering',
      address: '456 High St, City',
      designation: 'Lecturer',
      qualification: 'M.E.',
      specialization: 'Power Systems',
      joiningDate: '2023-01-10',
      password: ''
    }
  ];

  const csvContent = [
    headers.join(','),
    ...sampleData.map(row => headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  return csvContent;
};

export const getTeacherCSVInstructions = () => ({
  requiredFields: [
    'fullName - Full name',
    'personalEmail - Personal email (valid email)',
    'phone - 10-15 digits',
    'department - Department code or name',
    'address - Address',
    'designation - One of: Professor, Associate Professor, Assistant Professor, Lecturer, Teaching Assistant',
    'qualification - Highest qualification',
    'joiningDate - Date in YYYY-MM-DD'
  ],
  optionalFields: [
    'specialization - Subject specialization',
    'password - Optional; if empty a default will be generated'
  ]
});


