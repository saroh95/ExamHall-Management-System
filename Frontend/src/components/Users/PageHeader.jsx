import { FiUsers, FiHome, FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const PageHeader = ({ title, description }) => {
  const navigate = useNavigate();

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
      <div>
        <div className="flex items-center mb-2">
          <button 
            onClick={handleBackToDashboard}
            className="flex items-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:opacity-90 transition shadow-md mr-10"
          >
            <FiArrowLeft className="mr-1" /> Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
            <FiUsers className="mr-3 text-blue-600" /> {title}
          </h1>
        </div>
        <p className="text-gray-600 ml-10">{description}</p>
      </div>
      
      <div className="bg-white rounded-xl shadow-md p-4 flex items-center">
        <FiHome className="text-blue-600 mr-2" />
        <span className="font-medium">Dashboard /</span>
        <span className="text-blue-600 font-medium ml-1">Users</span>
      </div>
    </div>
  );
};

export default PageHeader;