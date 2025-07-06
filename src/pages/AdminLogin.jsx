import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage('Invalid credentials.');
    } else {
      localStorage.setItem('admin_session', JSON.stringify(data.session));
      setMessage('Login successful! Redirecting...');
      setTimeout(() => {
        window.location.href = '/admin-dashboard';
      }, 1000);
    }
  };

  // Password reset handler
  const handleReset = async (e) => {
    e.preventDefault();
    setMessage('');
    setResetSent(false);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      setMessage('Failed to send reset email.');
    } else {
      setResetSent(true);
      setMessage('Password reset email sent! Check your inbox.');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: 24 }}>
      <h2>Admin Login</h2>
      {resetMode ? (
        <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit">Send Reset Email</button>
          <button type="button" onClick={() => { setResetMode(false); setMessage(''); }}>Back to Login</button>
        </form>
      ) : (
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Login</button>
          <button type="button" style={{ background: 'none', color: '#007bff', border: 'none', cursor: 'pointer', marginTop: 4 }} onClick={() => { setResetMode(true); setMessage(''); }}>Forgot Password?</button>
        </form>
      )}
      {message && <p>{message}</p>}
      {resetSent && <p style={{ color: 'green' }}>If the email exists, a reset link has been sent.</p>}
    </div>
  );
};

export default AdminLogin;
