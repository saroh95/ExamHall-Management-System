/**
 * Generate CSV template for classroom bulk upload
 */
export const generateClassroomCSVTemplate = () => {
  const headers = [
    'roomNumber',
    'building',
    'floor',
    'capacity',
    'type',
    'facilities',
    'rows',
    'seatsPerRow'
  ];

  const sampleRows = [
    {
      roomNumber: '101',
      building: 'Main Block',
      floor: '1',
      capacity: '60',
      type: 'Classroom',
      facilities: 'Projector,AC,WiFi',
      rows: '10',
      seatsPerRow: '6'
    },
    {
      roomNumber: '201',
      building: 'Main Block',
      floor: '2',
      capacity: '80',
      type: 'Lecture Theatre',
      facilities: 'Projector,AC,Microphone,Smart Board',
      rows: '10',
      seatsPerRow: '8'
    },
    {
      roomNumber: 'LAB-1',
      building: 'Science Block',
      floor: '1',
      capacity: '40',
      type: 'Lab',
      facilities: 'Computers,WiFi',
      rows: '8',
      seatsPerRow: '5'
    }
  ];

  // Create CSV content
  let csvContent = headers.join(',') + '\n';
  
  sampleRows.forEach(row => {
    const values = headers.map(header => {
      const value = row[header] || '';
      // Escape commas and quotes in values
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvContent += values.join(',') + '\n';
  });

  return csvContent;
};
