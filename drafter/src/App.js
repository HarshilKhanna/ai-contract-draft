import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ContractForm from './ContractForm';
import ChatInterface from './components/ChatInterface';
import './App.css';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [documentId, setDocumentId] = useState(null);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <Router>
      <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
        <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        <Routes>
          <Route 
            path="/" 
            element={
              <ContractForm 
                darkMode={darkMode} 
                onDocumentProcessed={setDocumentId} 
              />
            } 
          />
          <Route 
            path="/chat" 
            element={
              documentId ? (
                <ChatInterface 
                  documentId={documentId} 
                  darkMode={darkMode} 
                />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
