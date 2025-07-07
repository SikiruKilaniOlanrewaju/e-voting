
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
  const [votingEvent, setVotingEvent] = useState(null);

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
      // 1. Get the latest unlocked voting event
      const { data: events } = await supabase
        .from('voting_events')
        .select('id, name, locked')
        .order('created_at', { ascending: false });
      let activeEvent = null;
      if (events && events.length > 0) {
        activeEvent = events.find(ev => !ev.locked) || events[0];
        setVotingEvent(activeEvent);
      }
      // 2. Fetch positions
      const { data: posData } = await supabase.from('positions').select('*').order('created_at', { ascending: false });
      setPositions(posData || []);
      // 3. Fetch candidates for each position
      let candObj = {};
      for (const pos of posData || []) {
        const { data: cands } = await supabase
          .from('candidates')
          .select('id,full_name,photo_url,bio')
          .eq('position_id', pos.id);
        candObj[pos.id] = (cands || []).map(c => ({
          ...c,
          name: c.full_name || 'No Name',
          bio: c.bio || '',
          avatar_url: c.photo_url || '',
        }));
      }
      setCandidates(candObj);
      // 4. Fetch votes for this student and this event
      if (student && activeEvent) {
        const { data: voteData } = await supabase
          .from('votes')
          .select('*')
          .eq('student_id', student.id)
          .eq('voting_event_id', activeEvent.id);
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
    if (!votingEvent) {
      setSnackbar({ open: true, text: 'No active voting event.', severity: 'error' });
      return;
    }
    setMessage('');
    // Double-check in DB for integrity
    const { data: existingVote } = await supabase
      .from('votes')
      .select('id')
      .eq('student_id', student.id)
      .eq('position_id', positionId)
      .eq('voting_event_id', votingEvent.id)
      .maybeSingle();
    if (existingVote) {
      setSnackbar({ open: true, text: 'You have already voted for this position.', severity: 'warning' });
      return;
    }
    const { error } = await supabase.from('votes').insert([
      {
        student_id: student.id,
        candidate_id: candidateId,
        position_id: positionId,
        voting_event_id: votingEvent.id
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
  // --- Premium UI/UX: Sticky Header, Confetti, Snackbar, Dashboard, Voting UI ---
  return (
    <React.Fragment>
      {/* Sticky Premium Header Bar */}
      <Paper elevation={4} sx={{
        position: 'sticky',
        top: 0,
        left: 0,
        width: '100vw',
        zIndex: 1200,
        borderRadius: 0,
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 4px 24px 0 rgba(0,0,0,0.08)',
        borderBottom: '1.5px solid #e3eafc',
        display: 'flex',
        alignItems: 'center',
        px: { xs: 2, sm: 6 },
        py: 1.5,
        mb: 3,
        transition: 'background 0.3s',
      }}>
        <HowToVoteIcon sx={{ fontSize: 32, color: 'primary.main', mr: 2, filter: 'drop-shadow(0 0 6px #90caf9)' }} />
        <Typography variant="h5" fontWeight={700} color="primary.main" sx={{ flexGrow: 1, letterSpacing: 1 }}>
          Student Voting Dashboard
        </Typography>
        {student && (
          <Tooltip title={student.email} arrow>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: 'rgba(144,202,249,0.08)', px: 2, py: 1, borderRadius: 3, boxShadow: '0 2px 8px 0 rgba(144,202,249,0.08)' }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontWeight: 700 }}>
                {student.name ? student.name[0].toUpperCase() : '?'}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={600} color="text.primary" sx={{ lineHeight: 1 }}>
                  {student.name || 'Student'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: 12 }}>
                  {student.email}
                </Typography>
              </Box>
            </Box>
          </Tooltip>
        )}
        <IconButton onClick={handleLogout} color="error" sx={{ ml: 2 }} aria-label="Logout">
          <LogoutIcon />
        </IconButton>
      </Paper>

      {/* Confetti Celebration */}
      <Fade in={showConfetti} timeout={400} unmountOnExit>
        <CelebrationIcon sx={{
          position: 'fixed',
          top: 24,
          right: 32,
          fontSize: 64,
          color: 'secondary.main',
          zIndex: 2000,
          filter: 'drop-shadow(0 0 16px #fbc02d)',
          animation: 'confetti-pop 1.8s cubic-bezier(.17,.67,.83,.67)'
        }} />
      </Fade>

      {/* Main Dashboard Content */}
      <Box sx={{
        minHeight: '90vh',
        width: '100vw',
        background: 'linear-gradient(135deg, #e3eafc 60%, #f7fafd 100%)',
        py: { xs: 2, sm: 4, md: 6 },
        px: { xs: 0, sm: 2 },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        overflowX: 'hidden',
        position: 'relative',
      }}>
        {!votingEvent && (
          <Alert severity="warning" sx={{ mb: 4, fontWeight: 600, fontSize: 18 }}>
            No active voting event. Please contact the administrator or try again later.
          </Alert>
        )}
        {/* Voting Progress Bar */}
        <Box sx={{ width: '100%', maxWidth: 520, mb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            Voting Progress: {votedCount} / {totalCount} positions
          </Typography>
          <LinearProgress
            variant="determinate"
            value={totalCount === 0 ? 0 : (votedCount / totalCount) * 100}
            sx={{ height: 8, borderRadius: 4, background: '#e3eafc', '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #42a5f5 60%, #90caf9 100%)' } }}
            aria-label="Voting Progress"
          />
        </Box>

        {/* Timer and Info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <InfoOutlinedIcon color="info" />
          <Typography variant="body1" color="text.secondary">
            {timer}
          </Typography>
        </Box>

        {/* Student Info Card */}
        <Paper elevation={3} sx={{
          p: 3,
          mb: 4,
          width: '100%',
          maxWidth: 520,
          borderRadius: 4,
          background: 'rgba(255,255,255,0.95)',
          boxShadow: '0 4px 24px 0 rgba(144,202,249,0.10)',
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48, fontWeight: 700 }}>
            {student?.name ? student.name[0].toUpperCase() : '?'}
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={700} color="primary.main">
              {student?.name || 'Student'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {student?.email}
            </Typography>
          </Box>
        </Paper>

        {/* Voting UI */}
        <Box sx={{ width: '100%', maxWidth: 700, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {positions.length === 0 ? (
            <Alert severity="info">No positions available for voting at this time.</Alert>
          ) : (
            positions.map((pos) => (
              <Paper key={pos.id} elevation={2} sx={{ p: 3, borderRadius: 4, background: 'rgba(255,255,255,0.98)', boxShadow: '0 2px 12px 0 rgba(144,202,249,0.08)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6" fontWeight={700} color="primary.main" sx={{ flexGrow: 1 }}>
                    {pos.name}
                  </Typography>
                  {votes[pos.id] && (
                    <Fade in={true}><CelebrationIcon color="secondary" sx={{ ml: 1 }} /></Fade>
                  )}
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  {(candidates[pos.id] || []).length === 0 ? (
                    <Typography variant="body2" color="text.secondary">No candidates for this position.</Typography>
                  ) : (
                    candidates[pos.id].map((cand) => {
                      const voted = votes[pos.id] === cand.id;
                      return (
                        <Paper
                          key={cand.id}
                          elevation={voted ? 6 : 1}
                          sx={{
                            p: 2,
                            minWidth: 180,
                            borderRadius: 3,
                            background: voted ? 'linear-gradient(90deg, #42a5f5 60%, #90caf9 100%)' : 'rgba(227,234,252,0.7)',
                            color: voted ? '#fff' : 'inherit',
                            boxShadow: voted ? '0 4px 24px 0 rgba(66,165,245,0.18)' : '0 1px 4px 0 rgba(144,202,249,0.06)',
                            border: voted ? '2px solid #42a5f5' : '1.5px solid #e3eafc',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 1.5,
                            position: 'relative',
                            transition: 'all 0.2s',
                            cursor: !votingEvent || voted ? 'not-allowed' : 'pointer',
                            outline: voted ? '2px solid #fbc02d' : 'none',
                            '&:hover': votingEvent && !voted && {
                              boxShadow: '0 4px 16px 0 rgba(66,165,245,0.12)',
                              background: 'linear-gradient(90deg, #e3eafc 60%, #f7fafd 100%)',
                            },
                          }}
                          tabIndex={0}
                          aria-label={`Candidate ${cand.name}`}
                          onClick={() => votingEvent && !voted && handleVote(pos.id, cand.id)}
                          onKeyDown={e => {
                            if (votingEvent && !voted && (e.key === 'Enter' || e.key === ' ')) handleVote(pos.id, cand.id);
                          }}
                        >
                          <Avatar
                            src={cand.avatar_url || undefined}
                            sx={{ width: 56, height: 56, mb: 1, bgcolor: voted ? 'secondary.main' : 'primary.light', color: voted ? '#fff' : 'primary.main', fontWeight: 700, fontSize: 28 }}
                            alt={cand.name || 'Candidate'}
                          >
                            {cand.name && cand.name.length > 0 ? cand.name[0].toUpperCase() : '?'}
                          </Avatar>
                          <Typography variant="subtitle1" fontWeight={600} sx={{ textAlign: 'center' }}>
                            {cand.name || <span style={{ color: '#bbb' }}>No Name</span>}
                          </Typography>
                          <Typography variant="caption" color={voted ? '#fff' : 'text.secondary'}>
                            {cand.bio && cand.bio.length > 0 ? cand.bio : <span style={{ color: '#bbb' }}>No bio</span>}
                          </Typography>
                          <Button
                            variant={voted ? 'contained' : 'outlined'}
                            color={voted ? 'secondary' : 'primary'}
                            size="small"
                            disabled={!votingEvent || voted}
                            sx={{ mt: 1, fontWeight: 700, borderRadius: 2, boxShadow: voted ? '0 2px 8px 0 rgba(251,192,45,0.12)' : 'none', letterSpacing: 0.5 }}
                          >
                            {voted ? 'Voted' : !votingEvent ? 'Voting Disabled' : 'Vote'}
                          </Button>
                        </Paper>
                      );
                    })
                  )}
                </Box>
              </Paper>
            ))
          )}
        </Box>
      </Box>

      {/* Snackbar for feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2600}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        TransitionComponent={Fade}
        sx={{ zIndex: 3000 }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ fontWeight: 600, fontSize: 16, px: 3 }}>
          {snackbar.text}
        </Alert>
      </Snackbar>

      {/* Micro-interactions: Keyframes for confetti pop */}
      <style>{`
        @keyframes confetti-pop {
          0% { transform: scale(0.2) rotate(-30deg); opacity: 0; }
          30% { transform: scale(1.2) rotate(10deg); opacity: 1; }
          60% { transform: scale(1) rotate(-8deg); opacity: 1; }
          100% { transform: scale(0.2) rotate(30deg); opacity: 0; }
        }
      `}</style>
    </React.Fragment>
  );
};

export default StudentDashboard;
