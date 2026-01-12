import React, { useState } from 'react';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';

const requiredFields = ['ScholarID', 'fullName', 'personalEmail', 'contactNumber', 'semester', 'section', 'batchYear', 'department'];

function validateStudent(row) {
  let errors = {};
  let scholarID = (row.ScholarID || '').toUpperCase();

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

  if (row.batchYear && !/^20\d{2}$/.test(row.batchYear)) {
    errors.batchYear = 'Format: 20xx';
  }

  return errors;
}

const fields = [
  { key: 'ScholarID', label: 'Scholar ID' },
  { key: 'fullName', label: 'Full Name' },
  { key: 'contactNumber', label: 'Contact No.' },
  { key: 'semester', label: 'Semester' },
  { key: 'section', label: 'Section' },
  { key: 'batchYear', label: 'Batch Year' },
  { key: 'department', label: 'Department' },
  { key: 'personalEmail', label: 'Personal Email' },
  { key: 'address', label: 'Address' }
];

const BulkUploadPreviewPopup = ({ rows, setRows, onSave, onClose }) => {
  const [editIndex, setEditIndex] = useState(null);
  const [editData, setEditData] = useState({});
  const allValid = rows.every(r => Object.keys(r.errors || {}).length === 0);

  const startEdit = (idx) => {
    setEditIndex(idx);
    setEditData(rows[idx]);
  };

  const cancelEdit = () => {
    setEditIndex(null);
    setEditData({});
  };

  const handleEditChange = (key, value) => {
    setEditData(prev => ({ ...prev, [key]: value }));
  };

  const saveEdit = () => {
    let updatedRows = [...rows];
    let updated = { ...editData };
    updated.errors = validateStudent(updated);
    updatedRows[editIndex] = updated;
    setRows(updatedRows);
    setEditIndex(null);
    setEditData({});
  };

  const deleteRow = (idx) => {
    if (window.confirm('Are you sure you want to remove this record?')) {
      const updated = rows.filter((_, i) => i !== idx);
      setRows(updated);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl w-full h-[90vh] max-w-[90vw] overflow-hidden border-2 border-blue-200 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-blue-100 border-b">
          <h2 className="text-xl font-semibold text-blue-800">CSV Preview & Validation</h2>
          <button onClick={onClose} className="text-gray-500 font-semibold hover:text-gray-700">✕ Close</button>
        </div>

        {/* Table */}
        <div className="overflow-auto p-4 flex-1">
          <table className="min-w-full text-sm border rounded shadow">
            <thead className="bg-gray-100 text-gray-700 border-b sticky top-0 z-10">
              <tr>
                {fields.map(f => (
                  <th key={f.key} className="px-3 py-2 text-left border">{f.label}</th>
                ))}
                <th className="px-3 py-2 text-left border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const hasError = Object.keys(row.errors || {}).length > 0;
                const rowStyle = hasError ? 'bg-red-100' : 'bg-green-50';

                return (
                  <tr key={row._id} className={`${rowStyle} hover:bg-opacity-80 transition`}>
                    {fields.map(({ key }) => (
                      <td
                        key={key}
                        className={`border px-3 py-2 ${row.errors?.[key] ? 'text-red-600 font-medium' : 'text-gray-800'}`}
                      >
                        {editIndex === idx ? (
                          <input
                            value={editData[key] || ''}
                            onChange={(e) => handleEditChange(key, e.target.value)}
                            className="w-full border rounded px-2 py-1 text-sm"
                          />
                        ) : (
                          row[key] || ''
                        )}
                        {row.errors?.[key] && (
                          <div className="text-xs text-red-500">{row.errors[key]}</div>
                        )}
                      </td>
                    ))}
                    <td className="border px-3 py-2 whitespace-nowrap flex items-center gap-3">
                      {editIndex === idx ? (
                        <>
                          <button className="text-green-700 font-semibold" onClick={saveEdit}>Save</button>
                          <button className="text-gray-500" onClick={cancelEdit}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button
                            className="text-blue-600 hover:text-blue-800"
                            onClick={() => startEdit(idx)}
                            title="Edit"
                          >
                            <FiEdit2 size={18} />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-800"
                            onClick={() => deleteRow(idx)}
                            title="Delete"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Controls */}
        <div className="bg-gray-50 border-t px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="inline-block w-4 h-4 rounded bg-green-200 mr-2"></span> Valid
            {' | '}
            <span className="inline-block w-4 h-4 rounded bg-red-200 mx-2"></span> Invalid
          </div>
          <div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300 font-medium mr-2"
            >
              Cancel
            </button>
            <button
              disabled={!allValid || rows.length === 0}
              onClick={() => onSave(rows)}
              className={`px-4 py-2 rounded text-sm font-medium text-white shadow-md ${
                allValid && rows.length > 0
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-blue-400 cursor-not-allowed'
              }`}
            >
              Save {allValid ? '' : '(Fix errors first)'}
            </button>
          </div>
        </div>

        {!allValid && (
          <div className="bg-red-100 text-red-700 text-center text-sm py-2">
            ⚠️ Some rows are invalid — please fix highlighted errors before saving.
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkUploadPreviewPopup;
