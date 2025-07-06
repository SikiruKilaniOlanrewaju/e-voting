import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

// This page is shown when admin clicks the password reset link in their email
const AdminResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Check for access token in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace('#', '?'));
    const type = params.get('type');
    if (type !== 'recovery') {
      setMessage('Invalid or expired reset link.');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!password || !confirm) return setMessage('Please fill all fields.');
    if (password !== confirm) return setMessage('Passwords do not match.');
    setLoading(true);
    // Supabase will have the session set if the link is valid
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setMessage('Failed to reset password. Try again.');
    } else {
      setMessage('Password reset successful! You can now log in.');
      setPassword('');
      setConfirm('');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: 24 }}>
      <h2>Reset Admin Password</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="password"
          placeholder="New Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>{loading ? 'Resetting...' : 'Reset Password'}</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default AdminResetPassword;
