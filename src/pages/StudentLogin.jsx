
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
        // After OTP verification, fetch full student record (with id)
        const { data: studentRecord, error: studentError } = await supabase
          .from('students')
          .select('id, full_name, matric_no, email')
          .eq('email', email)
          .single();
        if (studentError || !studentRecord) {
          setError('Could not fetch student record. Please contact admin.');
          setLoading(false);
          return;
        }
        localStorage.setItem('student_session', JSON.stringify(studentRecord));
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
          <Typography variant="h5" fontWeight={700} mb={1.5} color="primary.main">Student Login</Typography>
          <Typography variant="body2" color="text.secondary" mb={2} align="center">
            Welcome to the <span style={{ color: '#42a5f5', fontWeight: 800 }}>Online Voting Portal</span>
          </Typography>
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
