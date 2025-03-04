import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h1 className="text-6xl font-bold text-gray-800">404</h1>
      <p className="text-2xl font-semibold text-gray-600 mt-4">Page Not Found</p>
      <p className="text-gray-500 mt-2">The page you are looking for doesn't exist or has been moved.</p>
      <Link 
        to="/dashboard" 
        className="mt-8 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Go to Dashboard
      </Link>
    </div>
  );
};

export default NotFound;
