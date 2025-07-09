

import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Fade,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import EmailIcon from '@mui/icons-material/Email';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focus, setFocus] = useState({ email: false, password: false });

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
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

  const handleReset = async (e) => {
    e.preventDefault();
    setMessage('');
    setResetSent(false);
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    if (error) {
      setMessage('Failed to send reset email.');
    } else {
      setResetSent(true);
      setMessage('Password reset email sent! Check your inbox.');
    }
  };

  const handleFocus = (e) => {
    setFocus({ ...focus, [e.target.name]: true });
  };
  const handleBlur = (e) => {
    setFocus({ ...focus, [e.target.name]: false });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #e3eafc 0%, #f7fafd 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Lighter, mobile-first login card, no accent circle or glassmorphism */}
      <Box
        sx={{
          width: '100%',
          maxWidth: 370,
          mx: 'auto',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper
          elevation={1}
          sx={{
            p: { xs: 2, sm: 4 },
            width: '100%',
            borderRadius: 3,
            boxShadow: '0 2px 12px 0 rgba(144,202,249,0.08)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: 'rgba(255,255,255,0.98)',
          }}
        >
          <img src="/vite.svg" alt="Logo" style={{ height: 44, marginBottom: 10 }} />
          <Typography variant="h5" fontWeight={700} mb={1.5} color="primary.main">Admin Login</Typography>
          <Typography variant="body2" color="text.secondary" mb={2} align="center">
            Sign in to access the admin dashboard
          </Typography>
          {resetMode ? (
            <form onSubmit={handleReset} style={{ width: '100%' }}>
              <TextField
                margin="normal"
                fullWidth
                type="email"
                label="Email Address"
                name="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color={focus.email ? 'primary' : 'action'} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 2,
                  background: 'rgba(255,255,255,0.85)',
                  borderRadius: 2,
                  boxShadow: focus.email
                    ? '0 0 0 2px #42a5f5'
                    : '0 1px 4px 0 rgba(33,150,243,0.07)',
                  transition: 'box-shadow 0.3s',
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                sx={{ mt: 2, mb: 1, fontWeight: 700, borderRadius: 3 }}
                disabled={loading}
                startIcon={loading && <CircularProgress size={22} sx={{ color: '#fff' }} />}
              >
                {loading ? 'Sending...' : 'Send Reset Email'}
              </Button>
              <Button
                fullWidth
                variant="text"
                color="primary"
                sx={{ mb: 1, fontWeight: 600, borderRadius: 3 }}
                onClick={() => { setResetMode(false); setMessage(''); }}
              >
                Back to Login
              </Button>
            </form>
          ) : (
            <form onSubmit={handleLogin} style={{ width: '100%' }}>
              <TextField
                margin="normal"
                fullWidth
                type="email"
                label="Email Address"
                name="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color={focus.email ? 'primary' : 'action'} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 2,
                  background: 'rgba(255,255,255,0.85)',
                  borderRadius: 2,
                  boxShadow: focus.email
                    ? '0 0 0 2px #42a5f5'
                    : '0 1px 4px 0 rgba(33,150,243,0.07)',
                  transition: 'box-shadow 0.3s',
                }}
              />
              <TextField
                margin="normal"
                fullWidth
                type={showPassword ? 'text' : 'password'}
                label="Password"
                name="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword((show) => !show)}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 2,
                  background: 'rgba(255,255,255,0.85)',
                  borderRadius: 2,
                  boxShadow: focus.password
                    ? '0 0 0 2px #42a5f5'
                    : '0 1px 4px 0 rgba(33,150,243,0.07)',
                  transition: 'box-shadow 0.3s',
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                sx={{
                  mt: 2,
                  fontWeight: 700,
                  borderRadius: 3,
                  boxShadow: 2,
                  background: 'linear-gradient(90deg, #1976d2 60%, #42a5f5 100%)',
                  transition: 'background 0.3s',
                  '&:hover': {
                    background: 'linear-gradient(90deg, #42a5f5 60%, #1976d2 100%)',
                  },
                }}
                disabled={loading}
                startIcon={loading && <CircularProgress size={22} sx={{ color: '#fff' }} />}
              >
                {loading ? 'Signing in...' : 'Login'}
              </Button>
              <Button
                fullWidth
                variant="text"
                color="primary"
                sx={{ mt: 1, fontWeight: 600, borderRadius: 3 }}
                onClick={() => { setResetMode(true); setMessage(''); }}
              >
                Forgot Password?
              </Button>
            </form>
          )}
          {message && (
            <Alert severity={message.includes('success') ? 'success' : 'error'} sx={{ mt: 2, width: '100%' }}>{message}</Alert>
          )}
          {resetSent && <Alert severity="info" sx={{ mt: 2, width: '100%' }}>If the email exists, a reset link has been sent.</Alert>}
        </Paper>
      </Box>
    </Box>
  );
};

export default AdminLogin;
