// Sample CSV template for bulk uploading subjects
export const generateSubjectCSVTemplate = () => {
  const headers = [
    'code',
    'name', 
    'semesterId',
    'department',
    'type',
    'credits',
    'theoryHours',
    'practicalHours',
    'tutorialHours',
    'totalHours',
    'description'
  ];

  const sampleData = [
    {
      code: 'CS101',
      name: 'Introduction to Computer Science',
      semesterId: '1',
      department: 'CSE',
      type: 'regular',
      credits: '3',
      theoryHours: '3',
      practicalHours: '0',
      tutorialHours: '0',
      totalHours: '3',
      description: 'Basic concepts of computer science'
    },
    {
      code: 'CS201',
      name: 'Data Structures',
      semesterId: '3',
      department: 'CSE',
      type: 'regular',
      credits: '4',
      theoryHours: '3',
      practicalHours: '1',
      tutorialHours: '0',
      totalHours: '4',
      description: 'Fundamental data structures and algorithms'
    },
    {
      code: 'EE101',
      name: 'Basic Electrical Engineering',
      semesterId: '1',
      department: 'EEE',
      type: 'regular',
      credits: '3',
      theoryHours: '2',
      practicalHours: '1',
      tutorialHours: '0',
      totalHours: '3',
      description: 'Introduction to electrical engineering concepts'
    },
    {
      code: 'ME101',
      name: 'Engineering Mechanics',
      semesterId: '1',
      department: 'MECH',
      type: 'regular',
      credits: '4',
      theoryHours: '3',
      practicalHours: '1',
      tutorialHours: '0',
      totalHours: '4',
      description: 'Basic principles of engineering mechanics'
    },
    {
      code: 'CS301',
      name: 'Database Management Systems',
      semesterId: '5',
      department: 'CSE',
      type: 'core_elective',
      credits: '3',
      theoryHours: '2',
      practicalHours: '1',
      tutorialHours: '0',
      totalHours: '3',
      description: 'Database design and management'
    },
    {
      code: 'CS401',
      name: 'Web Development',
      semesterId: '7',
      department: 'CSE',
      type: 'open_elective',
      credits: '3',
      theoryHours: '2',
      practicalHours: '1',
      tutorialHours: '0',
      totalHours: '3',
      description: 'Modern web development technologies'
    }
  ];

  // Convert to CSV format
  const csvContent = [
    headers.join(','),
    ...sampleData.map(row => 
      headers.map(header => `"${row[header] || ''}"`).join(',')
    )
  ].join('\n');

  return csvContent;
};

// CSV format instructions
export const getSubjectCSVInstructions = () => {
  return {
    requiredFields: [
      'code - Subject code (2-10 uppercase alphanumeric characters)',
      'name - Subject name',
      'semesterId - Semester number (1-8)',
      'department - Department code (CSE, EEE, MECH, etc.)',
      'type - Subject type (regular, core_elective, open_elective)',
      'credits - Number of credits (1-6)'
    ],
    optionalFields: [
      'theoryHours - Theory hours (default: 3)',
      'practicalHours - Practical hours (default: 0)',
      'tutorialHours - Tutorial hours (default: 0)',
      'totalHours - Total hours (default: 3)',
      'description - Subject description'
    ],
    validTypes: ['regular', 'core_elective', 'open_elective'],
    validSemesters: ['1', '2', '3', '4', '5', '6', '7', '8'],
    validCredits: ['1', '2', '3', '4', '5', '6']
  };
};
