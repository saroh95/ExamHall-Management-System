// Sample CSV template for bulk uploading students
export const generateStudentCSVTemplate = () => {
  const headers = [
    'fullName',
    'personalEmail',
    'contactNumber',
    'semester',
    'section',
    'batchYear',
    'department',
    'address',
    'password'
  ];

  const sampleData = [
    {
      fullName: 'Ananya Gupta',
      personalEmail: 'ananya.gupta@example.com',
      contactNumber: '9123456789',
      semester: 'Semester 1',
      section: 'A',
      batchYear: '2026',
      department: 'CSE', // accepts code or name
      address: '123 Main St, City',
      password: ''
    },
    {
      fullName: 'Rahul Sharma',
      personalEmail: 'rahul.sharma@example.com',
      contactNumber: '9876543210',
      semester: 'Semester 2',
      section: 'B',
      batchYear: '2025',
      department: 'Electrical Engineering',
      address: '456 High St, City',
      password: ''
    }
  ];

  const csvContent = [
    headers.join(','),
    ...sampleData.map(row => headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  return csvContent;
};

export const getStudentCSVInstructions = () => ({
  requiredFields: [
    'fullName - Full name',
    'personalEmail - Personal email (valid email)',
    'contactNumber - 10-15 digits',
    'semester - Semester 1..8 or number 1..8',
    'section - A..F',
    'batchYear - 20xx',
    'department - Department code or name'
  ],
  optionalFields: [
    'address - Address',
    'password - Optional; if empty a default will be generated'
  ]
});


