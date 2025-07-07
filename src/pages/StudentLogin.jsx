
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
  CircularProgress,
  Alert
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import KeyIcon from '@mui/icons-material/VpnKey';

const StudentLogin = () => {
  const [matricNo, setMatricNo] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('request'); // 'request' or 'verify'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  // Use .env variable or fallback for Edge Function URL (for legacy, not used now)

  // Request OTP (lookup email by matric number, then send OTP to email)
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');
    try {
      // Lookup student by matric number
      const { data: student, error: lookupError } = await supabase
        .from('students')
        .select('email')
        .eq('matric_no', matricNo)
        .single();
      if (lookupError || !student) {
        setLoading(false);
        setError('Matric number not found.');
        return;
      }
      setEmail(student.email);
      // Call Supabase Edge Function to send OTP to email
      const response = await fetch(
        import.meta.env.VITE_EDGE_FUNCTION_URL,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ email: student.email, matric_no: matricNo })
        }
      );
      const result = await response.json();
      console.log('OTP API result:', result); // Log full response for debugging
      if (!response.ok || result.emailError) {
        setError(result.emailError || result.error || 'Failed to send OTP.');
      } else {
        setStep('verify');
        setInfo('OTP sent to your email. Check your inbox.');
      }
    } catch (err) {
      setError(err.message || 'Could not send OTP.');
    }
    setLoading(false);
  };

  // Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');
    try {
      // Call Supabase Edge Function to verify OTP
      // Use the new verify-student-otp Edge Function
      const verifyUrl = 'https://pctuimohmylewnjkspcv.functions.supabase.co/verify-student-otp';
      const response = await fetch(
        verifyUrl,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ email, matric_no: matricNo, otp })
        }
      );
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || 'Invalid or expired OTP');
      } else {
        // Optionally, you can now look up or create the student session in Supabase
        localStorage.setItem('student_session', JSON.stringify({ matric_no: matricNo, email }));
        window.location.href = '/student-dashboard';
      }
    } catch (err) {
      setError('Invalid or expired OTP');
    }
    setLoading(false);
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
      {/* Animated floating accent circle with branding color */}
      <Box
        sx={{
          position: 'absolute',
          left: '50%',
          top: { xs: 60, md: 100 },
          transform: 'translateX(-50%)',
          width: { xs: 220, md: 320 },
          height: { xs: 220, md: 320 },
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(25,118,210,0.16) 0%, rgba(66,165,245,0.09) 60%, rgba(66,165,245,0) 100%)',
          boxShadow: '0 0 64px 0 #42a5f5',
          filter: 'blur(10px)',
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
          elevation={10}
          sx={{
            p: { xs: 3, sm: 5 },
            borderRadius: 7,
            width: '100%',
            background: 'rgba(255,255,255,0.98)',
            boxShadow:
              '0 12px 48px 0 rgba(33,150,243,0.18), 0 2px 8px 0 rgba(66,165,245,0.10)',
            position: 'relative',
            overflow: 'hidden',
            border: '2.5px solid',
            borderImage:
              'linear-gradient(120deg, #1976d2 0%, #42a5f5 60%, #e3eafc 100%) 1',
            '::after': {
              content: '""',
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              boxShadow: 'inset 0 2.5px 18px 0 rgba(33,150,243,0.11)',
              borderRadius: 'inherit',
              border: '2px solid transparent',
              background:
                'linear-gradient(120deg, rgba(66,165,245,0.10) 0%, rgba(25,118,210,0.08) 100%)',
              zIndex: 1,
              animation: 'borderGlow 3.5s ease-in-out infinite',
              '@keyframes borderGlow': {
                '0%,100%': { opacity: 0.8 },
                '50%': { opacity: 1 },
              },
            },
            animation: 'fadeIn 0.7s cubic-bezier(.4,0,.2,1)',
            '@keyframes fadeIn': {
              from: { opacity: 0, transform: 'translateY(24px)' },
              to: { opacity: 1, transform: 'none' },
            },
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            margin: '0 auto',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2, position: 'relative' }}>
            {/* Animated Avatar with glow and custom branding */}
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
                  bgcolor: 'linear-gradient(135deg, #1976d2 60%, #42a5f5 100%)',
                  width: 62,
                  height: 62,
                  boxShadow: '0 0 0 6px #e3eafc',
                  border: '2.5px solid #fff',
                  fontSize: 36,
                  fontWeight: 700,
                  animation: 'avatarGlow 2.5s ease-in-out infinite',
                  background: 'linear-gradient(135deg, #1976d2 60%, #42a5f5 100%)',
                  '@keyframes avatarGlow': {
                    '0%,100%': { boxShadow: '0 0 0 6px #e3eafc' },
                    '50%': { boxShadow: '0 0 24px 12px #42a5f5' },
                  },
                }}
              >
                <SchoolIcon fontSize="large" />
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
            <Typography component="h1" variant="h5" sx={{ fontWeight: 900, color: '#1976d2', letterSpacing: 1, textShadow: '0 2px 12px #e3eafc, 0 0 8px #42a5f5' }}>
              Student Login
            </Typography>
            <Typography variant="body2" color="#1976d2" fontWeight={600} mb={3} align="center" sx={{ letterSpacing: 0.5 }}>
              Welcome to the <span style={{ color: '#42a5f5', fontWeight: 800 }}>Online Voting Portal</span>
            </Typography>
          </Box>
          {step === 'request' ? (
            <form onSubmit={handleSendOtp} style={{ width: '100%' }}>
              <TextField
                margin="normal"
                fullWidth
                label="Matric Number"
                value={matricNo}
                onChange={e => setMatricNo(e.target.value)}
                required
                InputProps={{
                  startAdornment: (
                    <KeyIcon sx={{ color: '#1976d2', mr: 1 }} />
                  ),
                }}
                sx={{
                  mb: 2,
                  background: 'rgba(255,255,255,0.88)',
                  borderRadius: 2,
                  boxShadow: matricNo ? '0 0 0 2px #42a5f5' : '0 1px 4px 0 rgba(33,150,243,0.07)',
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
                  fontWeight: 800,
                  fontSize: 17,
                  borderRadius: 3,
                  boxShadow: '0 4px 24px 0 rgba(33,150,243,0.13)',
                  background: 'linear-gradient(90deg, #1976d2 60%, #42a5f5 100%)',
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                  transition: 'background 0.3s',
                  '&:hover': {
                    background: 'linear-gradient(90deg, #42a5f5 60%, #1976d2 100%)',
                  },
                }}
                disabled={loading}
                startIcon={loading && <CircularProgress size={22} sx={{ color: '#fff' }} />}
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} style={{ width: '100%' }}>
              <TextField
                margin="normal"
                fullWidth
                label="Enter OTP"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                required
                InputProps={{
                  startAdornment: (
                    <KeyIcon sx={{ color: '#1976d2', mr: 1 }} />
                  ),
                }}
                sx={{
                  mb: 2,
                  background: 'rgba(255,255,255,0.88)',
                  borderRadius: 2,
                  boxShadow: otp ? '0 0 0 2px #42a5f5' : '0 1px 4px 0 rgba(33,150,243,0.07)',
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
                  fontWeight: 800,
                  fontSize: 17,
                  borderRadius: 3,
                  boxShadow: '0 4px 24px 0 rgba(33,150,243,0.13)',
                  background: 'linear-gradient(90deg, #1976d2 60%, #42a5f5 100%)',
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                  transition: 'background 0.3s',
                  '&:hover': {
                    background: 'linear-gradient(90deg, #42a5f5 60%, #1976d2 100%)',
                  },
                }}
                disabled={loading}
                startIcon={loading && <CircularProgress size={22} sx={{ color: '#fff' }} />}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </Button>
            </form>
          )}
          {info && <Alert severity="success" sx={{ mt: 2 }}>{info}</Alert>}
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </Paper>
      </Box>
    </Box>
  );
};

export default StudentLogin;
