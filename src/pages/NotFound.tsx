import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-xl max-w-md w-full text-center">
        <div className="text-6xl mb-4">🧭</div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Page not found</h1>
        <p className="text-slate-600 mb-6">The page you are looking for doesn't exist or has moved.</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-colors shadow-md hover:shadow-lg"
        >
          Go Home
        </button>
      </div>
    </div>
  );
};

export default NotFound;


