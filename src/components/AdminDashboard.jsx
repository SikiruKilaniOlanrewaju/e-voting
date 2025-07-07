import React, { useState } from 'react';
import AdminLayout from './AdminLayout';
import AdminHome from './AdminHome';
import AdminStudents from './AdminStudents';
import AdminCandidates from './AdminCandidates';
import AdminEvents from './AdminEvents';
import AdminPositions from './AdminPositions';
import AdminResults from './AdminResults';

export default function AdminDashboard() {
  const [selected, setSelected] = useState('home');

  let content = null;
  if (selected === 'home') content = <AdminHome />;
  else if (selected === 'students') content = <AdminStudents />;
  else if (selected === 'candidates') content = <AdminCandidates />;
  else if (selected === 'events') content = <AdminEvents />;
  else if (selected === 'positions') content = <AdminPositions />;
  else if (selected === 'results') content = <AdminResults />;
  else if (selected === 'logout') {
    localStorage.removeItem('admin_session');
    window.location.href = '/admin-login';
    return null;
  }

  return (
    <AdminLayout selected={selected} onSelect={setSelected}>
      {content}
    </AdminLayout>
  );
}
