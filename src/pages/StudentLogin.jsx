import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const StudentLogin = () => {
  const [matricNo, setMatricNo] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('request'); // 'request' or 'verify'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  // Use .env variable or fallback for Edge Function URL
  const EDGE_FUNCTION_URL = import.meta.env.VITE_EDGE_FUNCTION_URL ||
    'https://pctuimohmylewnjkspcv.functions.supabase.co/send-student-otp';

  // Request OTP (lookup email by matric number, then call Edge Function)
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
      // Call Edge Function to send OTP
      const res = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        body: JSON.stringify({ matric_no: matricNo }),
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        }
      });
      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        setLoading(false);
        setError('Invalid response from OTP service.');
        return;
      }
      setLoading(false);
      if (!res.ok) {
        setError(
          (data && (data.error || data.emailError || data.details)) ||
          `Network error: ${res.status}`
        );
        return;
      }
      if (data.success && data.emailSent) {
        setStep('verify');
        setEmail(student.email); // set the email field for verification step
        setInfo('OTP sent to your email. Check your inbox (and spam folder).');
      } else if (data.success && !data.emailSent) {
        setError(data.emailError || 'OTP could not be sent. Please contact admin.');
      } else {
        setError(data.error || data.details || 'Failed to send OTP');
      }
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Could not contact OTP service. Please try again or contact admin.');
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');
    const { data } = await supabase
      .from('student_otps')
      .select('*')
      .eq('matric_no', matricNo)
      .eq('email', email)
      .eq('otp_code', otp)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (data) {
      await supabase.from('student_otps').update({ used: true }).eq('id', data.id);
      localStorage.setItem('student_session', JSON.stringify({ id: data.id, matric_no: matricNo, email }));
      window.location.href = '/student-dashboard';
    } else {
      setError('Invalid or expired OTP');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: 24 }}>
      <h2>Student Login</h2>
      {step === 'request' ? (
        <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input type="text" placeholder="Matric Number" value={matricNo} onChange={e => setMatricNo(e.target.value)} required />
          <button type="submit" disabled={loading}>{loading ? 'Sending...' : 'Send OTP'}</button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input type="text" placeholder="Enter OTP" value={otp} onChange={e => setOtp(e.target.value)} required />
          <input type="email" value={email} readOnly style={{ background: '#f5f5f5' }} />
          <button type="submit" disabled={loading}>{loading ? 'Verifying...' : 'Verify OTP'}</button>
        </form>
      )}
      {info && <p style={{ color: 'green' }}>{info}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default StudentLogin;
