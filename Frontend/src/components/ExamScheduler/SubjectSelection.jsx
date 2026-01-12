import { useState, useEffect } from 'react';
import { examSchedulerAPI } from '../../services/examSchedulerAPI';
import { FiArrowRight, FiArrowLeft } from 'react-icons/fi';
import { toast } from 'react-toastify';

const SubjectSelection = ({
  selectedSubjects,
  setSelectedSubjects,
  selectedDepartments,
  selectedSemesters,
  nextStep,
  prevStep,
}) => {
  console.log('🚀 SubjectSelection component mounted');
  console.log('📊 Current props:', { selectedSubjects, selectedDepartments, selectedSemesters });
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [allSubjectsSelected, setAllSubjectsSelected] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load subjects from API
  useEffect(() => {
    const loadSubjects = async () => {
      try {
        setLoading(true);
        console.log('🔍 Loading subjects from API...');
        const response = await examSchedulerAPI.getAvailableSubjects();
        console.log('📡 API Response:', response.data);
        if (response.data.success) {
          setSubjects(response.data.data);
          console.log('✅ Subjects loaded:', response.data.data.length);
        } else {
          console.log('❌ API returned error:', response.data);
          toast.error('Failed to load subjects');
        }
      } catch (error) {
        console.error('❌ Error loading subjects:', error);
        toast.error('Failed to load subjects');
      } finally {
        setLoading(false);
      }
    };

    loadSubjects();
  }, []);

  useEffect(() => {
    if (selectedDepartments.length > 0 && selectedSemesters.length > 0 && subjects.length > 0) {
      console.log('🔍 Filtering subjects...');
      console.log('Selected departments:', selectedDepartments);
      console.log('Selected semesters:', selectedSemesters);
      console.log('Total subjects:', subjects.length);
      
      // Log first few subjects to see their structure
      console.log('📋 Sample subjects structure:', subjects.slice(0, 3).map(s => ({
        name: s.name,
        semesterId: s.semesterId,
        departmentId: s.departmentId,
        semesterIdType: typeof s.semesterId,
        departmentIdType: typeof s.departmentId,
        isArray: Array.isArray(s.departmentId)
      })));
      
      const filtered = subjects.filter((subject) => {
        // Check semester match - ensure both are numbers for comparison
        const subjectSemester = Number(subject.semesterId);
        const semesterMatch = selectedSemesters.includes(subjectSemester);
        
        // Check department match
        let departmentMatch = false;
        if (!subject.departmentId || subject.departmentId.length === 0) {
          // Common/foundation subject: show for all departments
          departmentMatch = true;
        } else if (Array.isArray(subject.departmentId)) {
          // Handle populated departmentId (objects with _id property) and direct ObjectIds
          const subjectDeptIds = subject.departmentId.map(dept => 
            typeof dept === 'object' && dept._id ? dept._id.toString() : dept.toString()
          );
          departmentMatch = subjectDeptIds.some((deptId) => 
            selectedDepartments.includes(deptId)
          );
        } else {
          departmentMatch = selectedDepartments.includes(subject.departmentId.toString());
        }
        
        const result = departmentMatch && semesterMatch;
        const deptIds = Array.isArray(subject.departmentId) 
          ? subject.departmentId.map(dept => typeof dept === 'object' && dept._id ? dept._id.toString() : dept.toString())
          : [subject.departmentId.toString()];
        console.log(`Subject ${subject.name}: semester=${subject.semesterId}, deptIds=[${deptIds.join(',')}], selectedDepts=[${selectedDepartments.join(',')}], semesterMatch=${semesterMatch}, departmentMatch=${departmentMatch}, result=${result}`);
        
        return result;
      });
      
      console.log('✅ Filtered subjects:', filtered.length);
      setFilteredSubjects(filtered);
      // Reset selected subjects when filtered subjects change
      setSelectedSubjects([]);
    }
  }, [selectedDepartments, selectedSemesters, subjects]);

  // Effect to check if all subjects are selected
  useEffect(() => {
    setAllSubjectsSelected(
      filteredSubjects.length > 0 && 
      selectedSubjects.length === filteredSubjects.length
    );
  }, [selectedSubjects, filteredSubjects]);

  const toggleSubject = (subjectId) => {
    if (subjectId === 'all') {
      if (allSubjectsSelected) {
        setSelectedSubjects([]);
      } else {
        setSelectedSubjects(filteredSubjects.map(subject => subject._id));
      }
    } else {
      if (selectedSubjects.includes(subjectId)) {
        setSelectedSubjects(selectedSubjects.filter((id) => id !== subjectId));
      } else {
        setSelectedSubjects([...selectedSubjects, subjectId]);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedSubjects.length > 0) {
      nextStep();
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Select Subjects</h3>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-2 text-gray-600">Loading subjects...</span>
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
            console.log('🧪 Testing Subjects API call...');
            try {
              const response = await examSchedulerAPI.getAvailableSubjects();
              console.log('✅ Subjects API Test Success:', response.data);
              console.log('📋 First 3 subjects:', response.data.data.slice(0, 3));
              alert(`Subjects API Test Success! Found ${response.data.count} subjects`);
            } catch (error) {
              console.log('❌ Subjects API Test Failed:', error);
              alert(`Subjects API Test Failed: ${error.message}`);
            }
          }}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 mr-2"
        >
          🧪 Test Subjects API
        </button>
        <button
          type="button"
          onClick={() => {
            console.log('🔍 Current State Debug:');
            console.log('Selected departments:', selectedDepartments);
            console.log('Selected semesters:', selectedSemesters);
            console.log('Total subjects:', subjects.length);
            console.log('Filtered subjects:', filteredSubjects.length);
            console.log('Sample subjects:', subjects.slice(0, 3));
            alert(`Debug Info:\nDepartments: ${selectedDepartments.length}\nSemesters: ${selectedSemesters.length}\nTotal Subjects: ${subjects.length}\nFiltered: ${filteredSubjects.length}`);
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          🔍 Debug State
        </button>
      </div>
      
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Select Subjects</h3>
        {filteredSubjects.length === 0 ? (
          <p className="text-sm text-gray-500">
            {selectedDepartments.length === 0 || selectedSemesters.length === 0 
              ? 'Please select departments and semesters first.'
              : 'No subjects found for selected departments and semesters.'
            }
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Select All Subjects option */}
            <div className="flex items-center col-span-full p-3 bg-gray-50 rounded-lg">
              <input
                id="subj-all"
                name="subj-all"
                type="checkbox"
                checked={allSubjectsSelected}
                onChange={() => toggleSubject('all')}
                className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="subj-all" className="ml-3 block text-sm font-medium text-gray-700">
                Select All Subjects ({filteredSubjects.length})
              </label>
            </div>
            
            {filteredSubjects.map((subject) => (
              <div key={subject._id} className="flex items-center p-3 bg-white rounded-lg shadow-sm border border-gray-200">
                <input
                  id={`subj-${subject._id}`}
                  name={`subj-${subject._id}`}
                  type="checkbox"
                  checked={selectedSubjects.includes(subject._id)}
                  onChange={() => toggleSubject(subject._id)}
                  className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor={`subj-${subject._id}`} className="ml-3 block text-sm font-medium text-gray-700">
                  <div className="font-semibold">{subject.name}</div>
                  <div className="text-xs text-gray-500">{subject.code} • Semester {subject.semesterId}</div>
                </label>
              </div>
            ))}
          </div>
        )}
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
          disabled={selectedSubjects.length === 0}
          className={`flex items-center px-6 py-2.5 text-white rounded-lg transition shadow-md ${
            selectedSubjects.length === 0 
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

export default SubjectSelection;