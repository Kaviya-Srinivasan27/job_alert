import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Pages Import
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import NotificationSettings from './pages/NotificationSettings';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login'; 

function App() {
  return (
    <Router>
      <Routes>
        {/* 1. ✨ Main Starting Page is now LOGIN (localhost:5173/) */}
        <Route path="/" element={<Login />} />
        
        {/* 2. ✨ Student Portal is now /student (localhost:5173/student) */}
        <Route path="/student" element={<Home />} />
        
        {/* Other existing routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<NotificationSettings />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;