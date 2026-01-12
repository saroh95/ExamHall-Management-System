import React from 'react';

const Footer = () => {
  return (
    <div className="mt-8 text-center text-gray-600 text-sm">
      <p className="mb-2">Empowering educators with comprehensive subject management tools for academic excellence.</p>
      <div className="flex justify-center space-x-4">
        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs">Subject Management System</span>
        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs">Version 2.0</span>
      </div>
      <p className="mt-2 text-xs text-gray-500">
        Streamlining curriculum organization, course materials, and academic planning
      </p>
    </div>
  );
};

export default Footer;