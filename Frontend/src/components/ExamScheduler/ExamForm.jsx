import { useState } from 'react';
import { FiPlus, FiTrash2, FiArrowRight } from 'react-icons/fi';

const ExamForm = ({ examDetails, setExamDetails, nextStep }) => {
  const [timeSlot, setTimeSlot] = useState({ start: '', end: '' });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setExamDetails({ ...examDetails, [name]: value });
    // Clear error when field is changed
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const addTimeSlot = () => {
    if (timeSlot.start && timeSlot.end) {
      setExamDetails({
        ...examDetails,
        timeSlots: [...(examDetails.timeSlots || []), timeSlot],
      });
      setTimeSlot({ start: '', end: '' });
      if (errors.timeSlots) {
        setErrors({ ...errors, timeSlots: null });
      }
    }
  };

  const removeTimeSlot = (index) => {
    const updatedTimeSlots = [...examDetails.timeSlots];
    updatedTimeSlots.splice(index, 1);
    setExamDetails({ ...examDetails, timeSlots: updatedTimeSlots });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!examDetails.name) newErrors.name = 'Exam name is required';
    if (!examDetails.startDate) newErrors.startDate = 'Start date is required';
    if (!examDetails.endDate) newErrors.endDate = 'End date is required';
    if (!examDetails.timeSlots || examDetails.timeSlots.length === 0) {
      newErrors.timeSlots = 'At least one time slot is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      nextStep();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Exam Name</label>
          <input
            type="text"
            name="name"
            value={examDetails.name || ''}
            onChange={handleChange}
            className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Exam Type</label>
          <select
            name="type"
            value={examDetails.type || 'regular'}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          >
            <option value="regular">Regular</option>
            <option value="supplementary">Supplementary</option>
            <option value="backlog">Backlog</option>
            <option value="special">Special</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            name="startDate"
            value={examDetails.startDate || ''}
            onChange={handleChange}
            className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
              errors.startDate ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {errors.startDate && <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            name="endDate"
            value={examDetails.endDate || ''}
            onChange={handleChange}
            className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
              errors.endDate ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {errors.endDate && <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Time Slots</label>
        <div className="flex gap-3">
          <input
            type="time"
            value={timeSlot.start}
            onChange={(e) => setTimeSlot({ ...timeSlot, start: e.target.value })}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          />
          <span className="flex items-center">to</span>
          <input
            type="time"
            value={timeSlot.end}
            onChange={(e) => setTimeSlot({ ...timeSlot, end: e.target.value })}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          />
          <button
            type="button"
            onClick={addTimeSlot}
            className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:opacity-90 transition shadow-md"
          >
            <FiPlus className="mr-1" /> Add
          </button>
        </div>

        {examDetails.timeSlots?.length > 0 && (
          <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Added Time Slots:</h4>
            <ul className="space-y-2">
              {examDetails.timeSlots.map((slot, index) => (
                <li key={index} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm">
                  <span className="font-medium">
                    {slot.start} - {slot.end}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeTimeSlot(index)}
                    className="text-red-600 hover:text-red-800 transition flex items-center"
                  >
                    <FiTrash2 className="mr-1" /> Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {errors.timeSlots && <p className="mt-2 text-sm text-red-600">{errors.timeSlots}</p>}
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          className="flex items-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:opacity-90 transition shadow-md"
        >
          Next <FiArrowRight className="ml-2" />
        </button>
      </div>
    </form>
  );
};

export default ExamForm;