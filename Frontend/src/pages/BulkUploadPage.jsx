import React, { useState } from 'react';
import Papa from 'papaparse';
import { useNavigate } from 'react-router-dom';
import BulkUploadPreviewPopup from '../components/Students/BulkUploadPreviewPopup';

const exampleCSV = [
  ['ScholarID','fullName','personalEmail','contactNumber','semester','section','batchYear','department','address'],
  ['221CS001','Anil Kumar','anil.kumar@example.com','9123456789','Semester 2','B','2026','CSE','Village X'],
  ['221EC002','Sunita Sharma','sunita.sharma@example.com','9834123456','Semester 3','A','2026','ECE','City Y']
];

function csvTableFormat(rows) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm table-auto border border-gray-300 rounded-md bg-white shadow-sm">
        <thead className="bg-blue-100">
          <tr>
            {rows[0].map(col => (
              <th key={col} className="border px-3 py-2 text-left text-gray-700">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(1).map((row, i) => (
            <tr key={i} className="hover:bg-gray-50">
              {row.map((cell, j) => (
                <td key={j} className="border px-3 py-2 text-gray-700 whitespace-nowrap">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const requiredFields = ['ScholarID', 'fullName', 'personalEmail', 'contactNumber', 'semester', 'section', 'batchYear', 'department'];

function validateStudent(row, students) {
  let errors = {};
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

  for (let field of requiredFields) {
    if (!row[field] || String(row[field]).trim() === '') {
      errors[field] = 'Required';
    }
  }

  if (row.ScholarID && !/^[0-9]{2}1[A-Z]{2}[0-9]{3}$/.test(row.ScholarID)) {
    errors.ScholarID = 'Format: YY1DD### (e.g., 221CS095)';
  }

  if (row.contactNumber && !/^[0-9]{10,15}$/.test(row.contactNumber)) {
    errors.contactNumber = '10-15 digits';
  }

  if (row.personalEmail && !emailRegex.test(row.personalEmail)) {
    errors.personalEmail = 'Invalid email';
  }

  if (row.batchYear && !/^20\d{2}$/.test(row.batchYear)) {
    errors.batchYear = 'Format: 20xx';
  }

  const scholarID = (row.ScholarID || '').toUpperCase();
  if (students && students.map(s => (s.ScholarID || '').toUpperCase()).includes(scholarID)) {
    errors.ScholarID = 'Duplicate ScholarID';
  }

  return errors;
}

const BulkUploadPage = ({ students, setStudents }) => {
  const [showPopup, setShowPopup] = useState(false);
  const [tempData, setTempData] = useState([]);
  const navigate = useNavigate();

  const currentStudents = (students && students.length)
    ? students
    : JSON.parse(localStorage.getItem('students')) || [];

  const handleFile = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data.map((row, i) => {
          const updatedRow = {
            ...row,
            _id: Math.random().toString(36).substr(2, 9),
            errors: validateStudent(row, currentStudents)
          };
          return updatedRow;
        });

        setTempData(rows);
        setShowPopup(true);
      }
    });

    event.target.value = null;
  };

  const handleSave = (validatedRows) => {
    const newStudents = validatedRows.map(row => {
      const { errors, ...student } = row;
      student.ScholarID = (student.ScholarID || '').toUpperCase();
      student.department = (student.department || '').toUpperCase();
      return student;
    });

    if (setStudents) {
      setStudents(prev => [...prev, ...newStudents]);
    } else {
      const updated = [...currentStudents, ...newStudents];
      localStorage.setItem('students', JSON.stringify(updated));
    }

    setShowPopup(false);
    navigate('/students');
  };

  const sampleCSV = exampleCSV.map(row => row.join(',')).join('\n');

  return (
    <div className="min-h-screen p-5 bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col items-center">
      <div className="w-full max-w-5xl bg-white rounded-xl shadow-lg p-8 border border-blue-100">

        <h1 className="text-3xl font-bold text-gray-800 mb-2">Bulk Upload Students</h1>

        <p className="text-gray-600 mb-6">
          Upload a <strong>.csv</strong> file in the format shown below.
          <br />
          <span className="text-red-600 font-medium">Required fields:</span> ScholarID, fullName, <strong>email</strong>, contactNumber, semester, section, batchYear, department
        </p>

        <div className="bg-gray-50 border rounded-md p-4 mb-6">
          <p className="text-blue-700 font-medium mb-3">CSV Format Example:</p>
          {csvTableFormat(exampleCSV)}

          <div className="mt-4">
            <label className="block text-sm font-medium mb-1 text-gray-600">Sample CSV:</label>
            <textarea
              readOnly
              value={sampleCSV}
              rows={4}
              className="w-full border bg-gray-100 text-gray-700 font-mono p-2 rounded text-xs"
            />
            <p className="text-xs text-gray-500 mt-1">You can copy this and paste into a CSV file.</p>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-1 text-gray-700">Upload .CSV File</label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFile}
            className="block w-full px-4 py-2 border border-blue-300 text-gray-700 rounded-md shadow-sm focus:ring focus:ring-blue-200 transition outline-none hover:border-blue-500 hover:shadow"
          />
        </div>

        <div className="flex justify-end mt-8">
          <button
            onClick={() => navigate('/students')}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded shadow hover:bg-gray-300 transition"
          >
            Cancel
          </button>
        </div>
      </div>

      {showPopup && (
        <BulkUploadPreviewPopup
          rows={tempData}
          setRows={setTempData}
          onSave={handleSave}
          onClose={() => setShowPopup(false)}
        />
      )}
    </div>
  );
};

export default BulkUploadPage;
