
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Button,
  CircularProgress,
  Alert,
  Fade,
  Tooltip,
  IconButton,
  Divider,
  LinearProgress,
  Snackbar
} from '@mui/material';
import CelebrationIcon from '@mui/icons-material/Celebration';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import LogoutIcon from '@mui/icons-material/Logout';

const StudentDashboard = () => {
  const [positions, setPositions] = useState([]);
  const [candidates, setCandidates] = useState({});
  const [votes, setVotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [student, setStudent] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, text: '', severity: 'success' });
  const [timer, setTimer] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('student_session');
    if (stored) {
      setStudent(JSON.parse(stored));
    } else {
      window.location.href = '/login';
    }
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('student_session');
    window.location.href = '/login';
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: posData } = await supabase.from('positions').select('*').order('created_at', { ascending: false });
      setPositions(posData || []);
      let candObj = {};
      for (const pos of posData || []) {
        const { data: cands } = await supabase.from('candidates').select('*').eq('position_id', pos.id);
        candObj[pos.id] = cands || [];
      }
      setCandidates(candObj);
      if (student) {
        const { data: voteData } = await supabase.from('votes').select('*').eq('student_id', student.id);
        let voteObj = {};
        (voteData || []).forEach(v => { voteObj[v.position_id] = v.candidate_id; });
        setVotes(voteObj);
      }
      setLoading(false);
    };
    fetchData();
  }, [student]);

  // Voting event timer (example: event ends in X)
  useEffect(() => {
    // Simulate event end in 2 hours from page load (replace with real event time if available)
    const end = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const interval = setInterval(() => {
      const now = new Date();
      const diff = end - now;
      if (diff <= 0) {
        setTimer('Voting ended');
        clearInterval(interval);
      } else {
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff / (1000 * 60)) % 60);
        const s = Math.floor((diff / 1000) % 60);
        setTimer(`${h}h ${m}m ${s}s left`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleVote = async (positionId, candidateId) => {
    if (!student) {
      setSnackbar({ open: true, text: 'Not logged in.', severity: 'error' });
      return;
    }
    setMessage('');
    if (votes[positionId]) {
      setSnackbar({ open: true, text: 'You have already voted for this position.', severity: 'warning' });
      return;
    }
    const { error } = await supabase.from('votes').insert([
      {
        student_id: student.id,
        candidate_id: candidateId,
        position_id: positionId,
        voting_event_id: null
      }
    ]);
    if (error) {
      setSnackbar({ open: true, text: 'Error submitting vote.', severity: 'error' });
    } else {
      setVotes({ ...votes, [positionId]: candidateId });
      setShowConfetti(true);
      setSnackbar({ open: true, text: 'Vote submitted!', severity: 'success' });
      setTimeout(() => setShowConfetti(false), 1800);
    }
  };


  if (loading) return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e3eafc 60%, #f7fafd 100%)' }}>
      <CircularProgress size={48} color="primary" />
    </Box>
  );

  // Voting progress
  const votedCount = Object.keys(votes).length;
  const totalCount = positions.length;

  return (
    <Box sx={{
      minHeight: '100vh',
      width: '100vw',
      background: 'linear-gradient(135deg, #e3eafc 60%, #f7fafd 100%)',
      py: { xs: 2, sm: 4, md: 6 },
      px: { xs: 0, sm: 2 },
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflowX: 'hidden',
      position: 'relative',
    }}>
      {/* Confetti animation */}
      {showConfetti && (
        <Box sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <CelebrationIcon sx={{ fontSize: 120, color: '#42a5f5', opacity: 0.85, animation: 'pop 1.2s cubic-bezier(.4,0,.2,1)' }} />
          <style>{`
            @keyframes pop {
              0% { transform: scale(0.2); opacity: 0; }
              60% { transform: scale(1.2); opacity: 1; }
              100% { transform: scale(1); opacity: 0.85; }
            }
          `}</style>
        </Box>
      )}
      {/* Profile Card */}
      <Fade in timeout={700}>
        <Paper elevation={8} sx={{
          maxWidth: 480,
          width: '100%',
          mx: 'auto',
          mb: 4,
          p: { xs: 2, sm: 4 },
          borderRadius: 8,
          background: 'rgba(255,255,255,0.98)',
          boxShadow: '0 8px 32px 0 rgba(33,150,243,0.13), 0 2px 8px 0 rgba(66,165,245,0.08)',
          border: '2.5px solid',
          borderImage: 'linear-gradient(120deg, #42a5f5 0%, #e3eafc 100%, #1976d2 100%) 1',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          justifyContent: 'center',
          '::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            boxShadow: 'inset 0 2.5px 18px 0 rgba(33,150,243,0.09)',
            borderRadius: 'inherit',
            border: '2px solid transparent',
            background: 'linear-gradient(120deg, rgba(66,165,245,0.08) 0%, rgba(25,118,210,0.06) 100%)',
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
          zIndex: 2,
        }}>
          <Avatar sx={{ bgcolor: 'linear-gradient(135deg, #1976d2 60%, #42a5f5 100%)', width: 64, height: 64, fontWeight: 700, fontSize: 32, boxShadow: '0 0 0 4px #e3eafc' }}>
            {student?.full_name ? student.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) : <HowToVoteIcon fontSize="large" />}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight={900} color="#1976d2" sx={{ letterSpacing: 1 }}>{student?.full_name || 'Student'}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>{student?.email || student?.id || ''}</Typography>
          </Box>
          <Tooltip title="Logout">
            <IconButton onClick={handleLogout} color="error" sx={{ boxShadow: '0 2px 8px 0 #e57373', borderRadius: 2 }}>
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Paper>
      </Fade>
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2200}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        ContentProps={{
          sx: {
            background: snackbar.severity === 'success' ? 'linear-gradient(90deg, #42a5f5 60%, #1976d2 100%)' : snackbar.severity === 'error' ? '#e57373' : '#ffb300',
            color: '#fff',
            fontWeight: 700,
            fontSize: 16,
            borderRadius: 2,
            boxShadow: 4,
          }
        }}
        message={snackbar.text}
      />
      {/* Dashboard Card */}
      {/* Voting Progress Bar & Timer */}
      <Box sx={{ width: '100%', maxWidth: 1100, mb: 2, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography fontWeight={700} color="#1976d2" sx={{ mb: 0.5 }}>Voting Progress</Typography>
          <LinearProgress variant="determinate" value={totalCount ? (votedCount / totalCount) * 100 : 0} sx={{ height: 10, borderRadius: 5, background: '#e3eafc', '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #1976d2 60%, #42a5f5 100%)' } }} />
          <Typography variant="caption" color="text.secondary">{votedCount} of {totalCount} positions voted</Typography>
        </Box>
        <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
          <Typography fontWeight={700} color="#1976d2">{timer}</Typography>
        </Box>
      </Box>
      <Fade in timeout={900}>
        <Paper elevation={10} sx={{
          maxWidth: 1100,
          width: '100%',
          mx: 'auto',
          p: { xs: 2, sm: 5, md: 6 },
          borderRadius: 10,
          background: 'rgba(255,255,255,0.98)',
          boxShadow: '0 16px 64px 0 rgba(33,150,243,0.18), 0 2px 12px 0 rgba(66,165,245,0.10)',
          border: '2.5px solid',
          borderImage: 'linear-gradient(120deg, #1976d2 0%, #42a5f5 60%, #e3eafc 100%) 1',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          '::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            boxShadow: 'inset 0 2.5px 18px 0 rgba(33,150,243,0.11)',
            borderRadius: 'inherit',
            border: '2px solid transparent',
            background: 'linear-gradient(120deg, rgba(66,165,245,0.10) 0%, rgba(25,118,210,0.08) 100%)',
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
        }}>
          <Box sx={{ width: '100%', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'flex-start', md: 'center' }, justifyContent: 'space-between', mb: 3, gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'linear-gradient(135deg, #1976d2 60%, #42a5f5 100%)', width: 56, height: 56, boxShadow: '0 0 0 4px #e3eafc', mr: 2 }}>
                <HowToVoteIcon fontSize="large" />
              </Avatar>
              <Typography variant="h4" fontWeight={900} color="#1976d2" sx={{ letterSpacing: 1, textShadow: '0 2px 12px #e3eafc, 0 0 8px #42a5f5' }}>
                Student Dashboard
              </Typography>
              <Tooltip title="How to vote?">
                <IconButton sx={{ ml: 1, color: '#1976d2' }}>
                  <InfoOutlinedIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          <Divider sx={{ mb: 3, borderColor: 'rgba(33,150,243,0.13)' }} />
          {message && <Alert severity={message.includes('error') ? 'error' : 'success'} sx={{ mb: 3, fontWeight: 600 }}>{message}</Alert>}
          {positions.length === 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>No active positions available for voting at this time.</Alert>
          )}
          {positions.map((pos) => (
            <Box key={pos.id} sx={{ mb: 5, borderRadius: 5, p: 3, background: 'linear-gradient(120deg, #f7fafd 80%, #e3eafc 100%)', boxShadow: '0 2px 12px 0 rgba(33,150,243,0.07)', border: '1.5px solid #e3eafc', transition: 'box-shadow 0.3s, transform 0.2s', '&:hover': { boxShadow: '0 4px 24px 0 rgba(33,150,243,0.13)', transform: 'scale(1.01)' } }}>
              <Typography variant="h5" fontWeight={800} color="#1976d2" sx={{ mb: 1 }}>{pos.name}</Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>{pos.description}</Typography>
              {votes[pos.id] ? (
                <Alert severity="success" sx={{ fontWeight: 600, mb: 1 }}>
                  You voted for: <b>{(candidates[pos.id].find(c => c.id === votes[pos.id]) || {}).full_name || 'Unknown'}</b>
                </Alert>
              ) : (
                <>
                  {candidates[pos.id].length === 0 && <Alert severity="info">No candidates for this position.</Alert>}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
                    {candidates[pos.id].map(cand => (
                      <Paper key={cand.id} elevation={3} sx={{ display: 'flex', alignItems: 'center', p: 2, borderRadius: 4, minWidth: 260, flex: 1, boxShadow: '0 2px 8px 0 rgba(33,150,243,0.08)', background: 'rgba(255,255,255,0.96)', border: '1.5px solid #e3eafc', mb: 1, transition: 'box-shadow 0.2s, transform 0.2s', '&:hover': { boxShadow: '0 4px 16px 0 #42a5f5', transform: 'scale(1.03)' } }}>
                        {cand.photo_url && <Avatar src={cand.photo_url} alt={cand.full_name} sx={{ width: 48, height: 48, mr: 2, boxShadow: '0 0 0 2px #42a5f5' }} />}
                        <Box sx={{ flex: 1 }}>
                          <Typography fontWeight={700} fontSize={17}>{cand.full_name}</Typography>
                          <Typography fontSize={13} color="text.secondary">{cand.bio}</Typography>
                        </Box>
                        <Button
                          variant="contained"
                          color="primary"
                          disabled={!!votes[pos.id]}
                          onClick={() => handleVote(pos.id, cand.id)}
                          sx={{ fontWeight: 700, borderRadius: 2, px: 2.5, py: 1, ml: 2, fontSize: 15, boxShadow: '0 2px 8px 0 #42a5f5', textTransform: 'uppercase', letterSpacing: 0.5, transition: 'box-shadow 0.2s, transform 0.2s', '&:hover': { boxShadow: '0 4px 16px 0 #1976d2', transform: 'scale(1.07)' } }}
                        >
                          Vote
                        </Button>
                      </Paper>
                    ))}
                  </Box>
                </>
              )}
            </Box>
          ))}
        </Paper>
      </Fade>
    </Box>
  );
};

export default StudentDashboard;
