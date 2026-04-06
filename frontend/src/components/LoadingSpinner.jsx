import React from 'react';
import { useApp } from '../contexts/AppContext';

const LoadingSpinner = ({ message = 'Loading...' }) => {
  const { isLoading } = useApp();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
        <div className="flex items-center justify-center mb-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        <p className="text-gray-700 text-center">{message}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
