import { useState, useEffect } from 'react';
import { examSchedulerAPI } from '../../services/examSchedulerAPI';
import { FiArrowRight, FiArrowLeft } from 'react-icons/fi';
import { toast } from 'react-toastify';

const DepartmentSelection = ({
  selectedDepartments,
  setSelectedDepartments,
  selectedSemesters,
  setSelectedSemesters,
  nextStep,
  prevStep,
}) => {
  console.log('🚀 DepartmentSelection component mounted');
  console.log('📊 Current props:', { selectedDepartments, selectedSemesters });
  const [allDeptsSelected, setAllDeptsSelected] = useState(false);
  const [allSemsSelected, setAllSemsSelected] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load departments from API
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        setLoading(true);
        console.log('🔍 Loading departments from API...');
        const response = await examSchedulerAPI.getAvailableDepartments();
        console.log('📡 Departments API Response:', response.data);
        if (response.data.success) {
          setDepartments(response.data.data);
          console.log('✅ Departments loaded:', response.data.data.length);
        } else {
          console.log('❌ Departments API returned error:', response.data);
          toast.error('Failed to load departments');
        }
      } catch (error) {
        console.error('❌ Error loading departments:', error);
        toast.error('Failed to load departments');
      } finally {
        setLoading(false);
      }
    };

    loadDepartments();
  }, []);

  // Effect to check if all departments are selected
  useEffect(() => {
    setAllDeptsSelected(departments.length > 0 && selectedDepartments.length === departments.length);
  }, [selectedDepartments, departments]);

  // Effect to check if all semesters are selected
  useEffect(() => {
    setAllSemsSelected(selectedSemesters.length === 8); // 8 semesters total
  }, [selectedSemesters]);

  const toggleDepartment = (departmentId) => {
    console.log('🔍 Toggling department:', departmentId);
    if (departmentId === 'all') {
      if (allDeptsSelected) {
        setSelectedDepartments([]);
        console.log('✅ Deselected all departments');
      } else {
        const allDeptIds = departments.map(dept => dept._id);
        setSelectedDepartments(allDeptIds);
        console.log('✅ Selected all departments:', allDeptIds);
      }
    } else {
      if (selectedDepartments.includes(departmentId)) {
        const newSelection = selectedDepartments.filter((id) => id !== departmentId);
        setSelectedDepartments(newSelection);
        console.log('✅ Deselected department:', departmentId, 'New selection:', newSelection);
      } else {
        const newSelection = [...selectedDepartments, departmentId];
        setSelectedDepartments(newSelection);
        console.log('✅ Selected department:', departmentId, 'New selection:', newSelection);
      }
    }
  };

  const toggleSemester = (semesterId) => {
    console.log('🔍 Toggling semester:', semesterId);
    if (semesterId === 'all') {
      if (allSemsSelected) {
        setSelectedSemesters([]);
        console.log('✅ Deselected all semesters');
      } else {
        setSelectedSemesters([1, 2, 3, 4, 5, 6, 7, 8]);
        console.log('✅ Selected all semesters');
      }
    } else {
      const idNum = Number(semesterId);
      if (selectedSemesters.includes(idNum)) {
        const newSelection = selectedSemesters.filter((id) => id !== idNum);
        setSelectedSemesters(newSelection);
        console.log('✅ Deselected semester:', idNum, 'New selection:', newSelection);
      } else {
        const newSelection = [...selectedSemesters, idNum];
        setSelectedSemesters(newSelection);
        console.log('✅ Selected semester:', idNum, 'New selection:', newSelection);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedDepartments.length > 0 && selectedSemesters.length > 0) {
      nextStep();
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Select Departments</h3>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-2 text-gray-600">Loading departments...</span>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Debug Test Button */}
      <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 rounded">
        <button
          type="button"
          onClick={async () => {
            console.log('🧪 Testing API call...');
            try {
              const response = await examSchedulerAPI.getAvailableDepartments();
              console.log('✅ API Test Success:', response.data);
              alert(`API Test Success! Found ${response.data.count} departments`);
            } catch (error) {
              console.log('❌ API Test Failed:', error);
              alert(`API Test Failed: ${error.message}`);
            }
          }}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          🧪 Test API Call
        </button>
      </div>
      
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Select Departments</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Select All Departments option */}
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <input
              id="dept-all"
              name="dept-all"
              type="checkbox"
              checked={allDeptsSelected}
              onChange={() => toggleDepartment('all')}
              className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="dept-all" className="ml-3 block text-sm font-medium text-gray-700">
              All Departments ({departments.length})
            </label>
          </div>
          
          {departments.map((department) => (
            <div key={department._id} className="flex items-center p-3 bg-white rounded-lg shadow-sm border border-gray-200">
              <input
                id={`dept-${department._id}`}
                name={`dept-${department._id}`}
                type="checkbox"
                checked={selectedDepartments.includes(department._id)}
                onChange={() => toggleDepartment(department._id)}
                className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor={`dept-${department._id}`} className="ml-3 block text-sm font-medium text-gray-700">
                <div className="font-semibold">{department.name}</div>
                <div className="text-xs text-gray-500">{department.code}</div>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Select Semesters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Select All Semesters option */}
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <input
              id="sem-all"
              name="sem-all"
              type="checkbox"
              checked={allSemsSelected}
              onChange={() => toggleSemester('all')}
              className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="sem-all" className="ml-3 block text-sm font-medium text-gray-700">
              All Semesters
            </label>
          </div>
          
          {[1, 2, 3, 4, 5, 6, 7, 8].map((semester) => (
            <div key={semester} className="flex items-center p-3 bg-white rounded-lg shadow-sm border border-gray-200">
              <input
                id={`sem-${semester}`}
                name={`sem-${semester}`}
                type="checkbox"
                checked={selectedSemesters.includes(semester)}
                onChange={() => toggleSemester(semester)}
                className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor={`sem-${semester}`} className="ml-3 block text-sm font-medium text-gray-700">
                Semester {semester}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={prevStep}
          className="flex items-center px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition shadow-md"
        >
          <FiArrowLeft className="mr-2" /> Back
        </button>
        <button
          type="submit"
          disabled={selectedDepartments.length === 0 || selectedSemesters.length === 0}
          className={`flex items-center px-6 py-2.5 text-white rounded-lg transition shadow-md ${
            selectedDepartments.length === 0 || selectedSemesters.length === 0
              ? 'bg-indigo-300 cursor-not-allowed' 
              : 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:opacity-90'
          }`}
        >
          Next <FiArrowRight className="ml-2" />
        </button>
      </div>
    </form>
  );
};

export default DepartmentSelection;