import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from './components/AdminDashboard';
import StudentDashboard from './components/StudentDashboard';
import Login from './pages/Login';
import StudentLogin from './pages/StudentLogin';
import AdminLogin from './pages/AdminLogin';
import AdminResetPassword from './pages/AdminResetPassword';

function App() {
  return (
    <Router>
      <Routes>
        {/* Default route: redirect to /login for students */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        {/* Student login (OTP) */}
        <Route path="/login" element={<StudentLogin />} />
        <Route path="/student-login" element={<StudentLogin />} />
        {/* Student dashboard */}
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        {/* Admin routes with nested routing */}
        <Route path="/admin-dashboard/*" element={<AdminDashboard />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin-reset-password" element={<AdminResetPassword />} />
      </Routes>
    </Router>
  );
}

export default App;
