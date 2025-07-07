

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
      {/* Centered floating accent circle, always behind form */}
      <Box
        sx={{
          position: 'absolute',
          left: '50%',
          top: { xs: 80, md: 120 },
          transform: 'translateX(-50%)',
          width: { xs: 220, md: 320 },
          height: { xs: 220, md: 320 },
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(66,165,245,0.13) 0%, rgba(66,165,245,0) 80%)',
          filter: 'blur(12px)',
          zIndex: 0,
          animation: 'floatCircle 7s ease-in-out infinite',
          '@keyframes floatCircle': {
            '0%,100%': { transform: 'translateX(-50%) translateY(0)' },
            '50%': { transform: 'translateX(-50%) translateY(32px)' },
          },
        }}
      />
      {/* Centered glassmorphic login card with max width and vertical centering */}
      <Box
        sx={{
          width: '100%',
          maxWidth: 420,
          mx: 'auto',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper
          elevation={8}
          sx={{
            p: { xs: 3, sm: 5 },
            borderRadius: 6,
            width: '100%',
            background: 'rgba(255,255,255,0.97)',
            boxShadow:
              '0 8px 32px 0 rgba(33,150,243,0.13), 0 2px 8px 0 rgba(66,165,245,0.08)',
            position: 'relative',
            overflow: 'hidden',
            border: '2.5px solid',
            borderImage:
              'linear-gradient(120deg, #42a5f5 0%, #e3eafc 100%, #1976d2 100%) 1',
            '::after': {
              content: '""',
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              boxShadow: 'inset 0 2.5px 18px 0 rgba(33,150,243,0.09)',
              borderRadius: 'inherit',
              border: '2px solid transparent',
              background:
                'linear-gradient(120deg, rgba(66,165,245,0.08) 0%, rgba(25,118,210,0.06) 100%)',
              zIndex: 1,
              animation: 'borderGlow 3.5s ease-in-out infinite',
              '@keyframes borderGlow': {
                '0%,100%': { opacity: 0.7 },
                '50%': { opacity: 1 },
              },
            },
            animation: 'fadeIn 0.7s cubic-bezier(.4,0,.2,1)',
            '@keyframes fadeIn': {
              from: { opacity: 0, transform: 'translateY(24px)' },
              to: { opacity: 1, transform: 'none' },
            },
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            margin: '0 auto',
          }}
        >
          {/* Login Card Content */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mb: 2,
              position: 'relative',
            }}
          >
            {/* Animated Avatar with glow */}
            <Box
              sx={{
                position: 'relative',
                mb: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Avatar
                sx={{
                  bgcolor: '#1976d2',
                  width: 62,
                  height: 62,
                  boxShadow: '0 0 0 6px #e3eafc',
                  border: '2.5px solid #fff',
                  fontSize: 36,
                  fontWeight: 700,
                  animation: 'avatarGlow 2.5s ease-in-out infinite',
                  '@keyframes avatarGlow': {
                    '0%,100%': { boxShadow: '0 0 0 6px #e3eafc' },
                    '50%': { boxShadow: '0 0 24px 12px #42a5f5' },
                  },
                }}
              >
                <LockOutlinedIcon fontSize="large" />
              </Avatar>
              {/* Shimmer effect ring */}
              <Box
                sx={{
                  position: 'absolute',
                  top: -8,
                  left: -8,
                  width: 78,
                  height: 78,
                  borderRadius: '50%',
                  background:
                    'conic-gradient(from 90deg at 50% 50%, #42a5f5 0deg, #e3eafc 90deg, #1976d2 360deg)',
                  opacity: 0.18,
                  filter: 'blur(2px)',
                  zIndex: 0,
                  animation: 'shimmerRing 3.5s linear infinite',
                  '@keyframes shimmerRing': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                  },
                }}
              />
            </Box>
            <Typography
              component="h1"
              variant="h5"
              sx={{
                fontWeight: 800,
                color: '#1976d2',
                letterSpacing: 1,
                textShadow: '0 2px 12px #e3eafc',
              }}
            >
              Admin Login
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3} align="center">
              Sign in to access the admin dashboard
            </Typography>
          </Box>
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
