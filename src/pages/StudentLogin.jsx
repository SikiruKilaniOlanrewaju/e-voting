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
    <div style={{ maxWidth: 400, margin: '0 auto', padding: 24 }}>
      <h2>Student Login</h2>
      {/* No reCAPTCHA needed for email OTP */}
      {step === 'request' ? (
        <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input type="text" placeholder="Matric Number" value={matricNo} onChange={e => setMatricNo(e.target.value)} required />
          <button type="submit" disabled={loading}>{loading ? 'Sending...' : 'Send OTP'}</button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input type="text" placeholder="Enter OTP" value={otp} onChange={e => setOtp(e.target.value)} required />

          <button type="submit" disabled={loading}>{loading ? 'Verifying...' : 'Verify OTP'}</button>
        </form>
      )}
      {info && <p style={{ color: 'green' }}>{info}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default StudentLogin;
