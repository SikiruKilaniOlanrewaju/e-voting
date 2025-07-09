import React from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import AdminHome from './AdminHome';
import AdminStudents from './AdminStudents';
import AdminCandidates from './AdminCandidates';
import AdminEvents from './AdminEvents';
import AdminPositions from './AdminPositions';
import AdminResults from './AdminResults';

const navKeyToPath = {
  home: '/admin-dashboard',
  students: '/admin-dashboard/students',
  candidates: '/admin-dashboard/candidates',
  events: '/admin-dashboard/events',
  positions: '/admin-dashboard/positions',
  results: '/admin-dashboard/results',
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  // Determine selected key from path
  const selected = Object.keys(navKeyToPath).find(
    key => navKeyToPath[key] === location.pathname
  ) || 'home';

  const handleSelect = (key) => {
    if (key === 'logout') {
      localStorage.removeItem('admin_session');
      navigate('/admin-login', { replace: true });
      return;
    }
    navigate(navKeyToPath[key] || '/admin-dashboard');
  };

  return (
    <AdminLayout selected={selected} onSelect={handleSelect}>
      <Routes>
        <Route path="" element={<AdminHome />} />
        <Route path="students" element={<AdminStudents />} />
        <Route path="candidates" element={<AdminCandidates />} />
        <Route path="events" element={<AdminEvents />} />
        <Route path="positions" element={<AdminPositions />} />
        <Route path="results" element={<AdminResults />} />
        {/* Fallback: redirect to home */}
        <Route path="*" element={<Navigate to="/admin-dashboard" replace />} />
      </Routes>
    </AdminLayout>
  );
}
