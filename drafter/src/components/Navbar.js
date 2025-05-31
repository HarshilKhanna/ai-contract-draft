import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = ({ darkMode, toggleDarkMode }) => {
  return (
    <nav className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md py-4`}>
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link to="/" className={`text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
          AI Contract Drafter
        </Link>
        
        <div className="flex items-center space-x-6">
          <Link 
            to="/" 
            className={`${darkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'} transition-colors`}
          >
            Contract Form
          </Link>
          <Link 
            to="/chat" 
            className={`${darkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'} transition-colors`}
          >
            Contract Q&A
          </Link>
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-lg ${
              darkMode 
                ? 'bg-gray-700 text-yellow-300 hover:bg-gray-600' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            } transition-colors`}
          >
            {darkMode ? '🌙' : '☀️'}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 