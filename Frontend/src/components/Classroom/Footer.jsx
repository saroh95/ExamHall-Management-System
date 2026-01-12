import React from 'react';

const Footer = () => {
  return (
    <div className="mt-8 text-center text-gray-600 text-sm">
      <p className="mb-2">Exam Hall Management System – Manage classroom details, allocate seating, and optimize exam arrangements with ease.</p>

      <div className="flex justify-center space-x-4">
        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs">Exam Hall Management System</span>
        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs">Version 2.0</span>
      </div>
    </div>
  );
};

export default Footer;