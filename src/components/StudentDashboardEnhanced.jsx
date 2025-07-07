import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import {
  Box, Paper, Typography, Avatar, Button, LinearProgress, Snackbar, Fade, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Switch
} from '@mui/material';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import CelebrationIcon from '@mui/icons-material/Celebration';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

const StudentDashboard = () => {
  const [positions, setPositions] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [votes, setVotes] = useState([]);
  const [events, setEvents] = useState([]);
  const [activeEvent, setActiveEvent] = useState(null);
  const [voteSummary, setVoteSummary] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  // Advanced features state
  const [snackbar, setSnackbar] = useState({ open: false, text: '', severity: 'success' });
  const [confetti, setConfetti] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('student_theme') || 'light');
  const [helpOpen, setHelpOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [fontSize, setFontSize] = useState(1);
  const [contrast, setContrast] = useState(false);
  const timerRef = useRef();
  const [countdown, setCountdown] = useState('');

  // Fetch student session and info, and listen for changes (e.g., after OTP login)
  useEffect(() => {
    function syncStudentSession() {
      const session = localStorage.getItem('student_session');
      if (!session) {
        window.location.href = '/login';
        return;
      }
      setStudent(JSON.parse(session));
    }
    syncStudentSession();
    // Listen for storage changes (in case another tab logs in)
    window.addEventListener('storage', syncStudentSession);
    return () => window.removeEventListener('storage', syncStudentSession);
  }, []);

  // If student is not set but session exists (e.g., after redirect), re-sync
  useEffect(() => {
    if (!student) {
      const session = localStorage.getItem('student_session');
      if (session) setStudent(JSON.parse(session));
    }
  }, [student]);

  // Fetch events, positions, candidates, and votes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Fetch all voting events
      const { data: eventData } = await supabase.from('voting_events').select('*').order('start_time', { ascending: true });
      setEvents(eventData || []);
      // Find active event
      const now = new Date();
      const active = (eventData || []).find(ev => new Date(ev.start_time) <= now && new Date(ev.end_time) >= now);
      setActiveEvent(active || null);
      // Fetch positions
      const { data: posData } = await supabase.from('positions').select('*');
      setPositions(posData || []);
      // Fetch candidates
      const { data: candData } = await supabase.from('candidates').select('*');
      setCandidates(candData || []);
      // Fetch votes for this student
      if (student) {
        const { data: voteData } = await supabase.from('votes').select('*').eq('student_id', student.id);
        setVotes(voteData || []);
      }
      setLoading(false);
    };
    if (student) fetchData();
  }, [student]);

  // Countdown timer for active event
  useEffect(() => {
    if (!activeEvent) return setCountdown('');
    function updateCountdown() {
      const now = new Date();
      const end = new Date(activeEvent.end_time);
      const diff = end - now;
      if (diff <= 0) return setCountdown('Voting ended');
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${h}h ${m}m ${s}s left`);
    }
    updateCountdown();
    timerRef.current = setInterval(updateCountdown, 1000);
    return () => clearInterval(timerRef.current);
  }, [activeEvent]);

  // Build vote summary
  useEffect(() => {
    if (!positions.length || !votes.length) return;
    const summary = positions.map(pos => {
      const vote = votes.find(v => v.position_id === pos.id);
      if (!vote) return { position: pos.name, voted: false };
      const candidate = candidates.find(c => c.id === vote.candidate_id);
      return {
        position: pos.name,
        voted: true,
        candidate: candidate ? candidate.full_name : 'Unknown',
      };
    });
    setVoteSummary(summary);
  }, [positions, votes, candidates]);

  // Show results if voting ended
  useEffect(() => {
    if (!activeEvent && events.length) {
      // If no active event, check if the most recent event ended
      const now = new Date();
      const ended = events.find(ev => new Date(ev.end_time) < now);
      if (ended) setShowResults(true);
    }
  }, [activeEvent, events]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}><Typography>Loading...</Typography></Box>;

  // Voting progress
  const votedCount = voteSummary.filter(v => v.voted).length;
  const totalCount = positions.length;

  // Theme colors
  const themeColors = theme === 'dark' ? {
    background: 'linear-gradient(135deg, #232526 60%, #414345 100%)',
    card: 'rgba(30,30,40,0.98)',
    text: '#fff',
    accent: '#42a5f5',
  } : {
    background: 'linear-gradient(135deg, #f7fafd 60%, #e3eafc 100%)',
    card: 'rgba(255,255,255,0.98)',
    text: '#222',
    accent: '#1976d2',
  };

  return (
    <Box sx={{ minHeight: '100vh', background: contrast ? '#000' : themeColors.background, color: contrast ? '#fff' : themeColors.text, fontSize: `${fontSize}em`, transition: 'background 0.3s, color 0.3s, font-size 0.2s' }}>
      {/* Header NavBar */}
      {/* Professional Header Bar */}
      <Box component="header" sx={{ position: 'sticky', top: 0, zIndex: 30, background: contrast ? '#181818' : 'rgba(255,255,255,0.97)', boxShadow: 3, mb: 3, px: { xs: 1, sm: 3 }, py: 1.2, borderBottom: `2px solid ${themeColors.accent}22` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 68 }}>
          {/* Brand/Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <HowToVoteIcon sx={{ color: themeColors.accent, fontSize: 32, mr: 1 }} />
            <Typography variant="h6" fontWeight={900} color={themeColors.accent} sx={{ letterSpacing: 1, fontSize: 22 }}>Online Voting</Typography>
          </Box>
          {/* Student Info Card - Professional */}
          {student && (
            <Paper elevation={4} sx={{ display: 'flex', alignItems: 'center', px: 2.5, py: 1.2, borderRadius: 4, background: contrast ? '#232323' : 'linear-gradient(90deg, #f7fafd 60%, #e3eafc 100%)', boxShadow: `0 4px 24px 0 ${themeColors.accent}22`, border: `1.5px solid ${themeColors.accent}33`, minWidth: 220, maxWidth: 340 }}>
              <Avatar sx={{ bgcolor: themeColors.accent, width: 44, height: 44, fontWeight: 700, fontSize: 22, mr: 1.7, boxShadow: `0 0 0 3px ${themeColors.accent}` }}>
                {student.full_name && typeof student.full_name === 'string' && student.full_name.trim() !== ''
                  ? student.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)
                  : (student.email && typeof student.email === 'string' && student.email.length > 0
                      ? student.email[0].toUpperCase()
                      : <HowToVoteIcon fontSize="small" />)}
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography noWrap fontWeight={800} fontSize={17.5} color={themeColors.accent} sx={{ letterSpacing: 0.2 }}>
                  {student.full_name && typeof student.full_name === 'string' && student.full_name.trim() !== ''
                    ? student.full_name
                    : (student.email || 'Student')}
                </Typography>
                <Typography noWrap variant="caption" color={themeColors.text} sx={{ fontWeight: 600 }}>
                  {student.email || student.id || ''}
                </Typography>
              </Box>
            </Paper>
          )}
          {/* Nav Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, ml: 2 }}>
            <Tooltip title="Theme Switcher">
              <IconButton onClick={() => { const t = theme === 'dark' ? 'light' : 'dark'; setTheme(t); localStorage.setItem('student_theme', t); }} color="inherit">
                {theme === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Accessibility: Contrast">
              <IconButton onClick={() => setContrast(c => !c)} color={contrast ? 'warning' : 'inherit'}>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="11" fill={contrast ? '#ffb300' : themeColors.accent}/><text x="11" y="16" textAnchor="middle" fontSize="14" fill="#fff" fontWeight="bold">Aa</text></svg>
              </IconButton>
            </Tooltip>
            <Tooltip title="Accessibility: Font Size">
              <IconButton onClick={() => setFontSize(f => Math.min(f + 0.1, 1.5))}><span style={{ fontWeight: 700, fontSize: 18 }}>A+</span></IconButton>
              <IconButton onClick={() => setFontSize(f => Math.max(f - 0.1, 0.8))}><span style={{ fontWeight: 700, fontSize: 16 }}>A-</span></IconButton>
            </Tooltip>
            <Tooltip title="Help / FAQ">
              <IconButton onClick={() => setHelpOpen(true)}><InfoOutlinedIcon /></IconButton>
            </Tooltip>
            <Tooltip title="Voting History">
              <IconButton onClick={() => setHistoryOpen(true)}><CelebrationIcon /></IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>
      {/* Voting Event & Countdown */}
      <Paper elevation={10} sx={{ maxWidth: 700, mx: 'auto', p: 4, borderRadius: 6, background: themeColors.card, color: themeColors.text, boxShadow: '0 8px 32px 0 rgba(33,150,243,0.13)', mb: 4, position: 'relative', overflow: 'hidden' }}>
        {activeEvent ? (
          <>
            <Typography variant="h5" fontWeight={800} color={themeColors.accent} sx={{ mb: 1 }}>{activeEvent.name}</Typography>
            <Typography variant="body2" color={themeColors.text} sx={{ mb: 2 }}>{activeEvent.description}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Typography fontWeight={700} color={themeColors.accent}>Voting ends in:</Typography>
              <Typography fontWeight={700} color={themeColors.text}>{countdown}</Typography>
            </Box>
            {/* Voting Progress Bar */}
            <Box sx={{ mb: 2, position: 'relative' }}>
              <Typography fontWeight={700} color={themeColors.accent} sx={{ mb: 0.5, letterSpacing: 0.5, textShadow: `0 2px 8px ${themeColors.accent}33` }}>Voting Progress</Typography>
              <LinearProgress 
                variant="determinate" 
                value={totalCount ? (votedCount / totalCount) * 100 : 0} 
                sx={{ 
                  height: 12, 
                  borderRadius: 6, 
                  background: contrast ? '#222' : 'linear-gradient(90deg, #e3eafc 60%, #f7fafd 100%)',
                  boxShadow: `0 2px 12px 0 ${themeColors.accent}22`,
                  '& .MuiLinearProgress-bar': { 
                    background: `linear-gradient(90deg, ${themeColors.accent} 60%, #42a5f5 100%)`,
                    boxShadow: `0 0 16px 2px ${themeColors.accent}55`,
                    transition: 'width 0.7s cubic-bezier(.4,2,.6,1)',
                  }
                }}
              />
              <Box sx={{ position: 'absolute', right: 12, top: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" color={themeColors.text} sx={{ fontWeight: 700, letterSpacing: 0.2 }}>{votedCount} / {totalCount} voted</Typography>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: votedCount === totalCount ? '#43ea7a' : themeColors.accent, boxShadow: votedCount === totalCount ? '0 0 8px 2px #43ea7a88' : `0 0 8px 2px ${themeColors.accent}55` }} />
              </Box>
            </Box>
            {/* Voting UI: Professional candidate arrangement */}
            <Typography variant="h6" fontWeight={800} color={themeColors.accent} sx={{ mt: 3, mb: 2, letterSpacing: 0.5, textShadow: `0 2px 8px ${themeColors.accent}22` }}>Student Dashboard</Typography>
            {positions.length === 0 ? (
              <Typography color="text.secondary">No positions available.</Typography>
            ) : (
              positions.map((pos) => (
                <Box
                  key={pos.id}
                  sx={{
                    mb: 4,
                    borderRadius: 5,
                    p: 2.5,
                    background: contrast ? '#111' : `linear-gradient(120deg, #f7fafd 80%, #e3eafc 100%)`,
                    boxShadow: `0 2px 16px 0 ${themeColors.accent}13`,
                    border: `1.5px solid ${themeColors.accent}22`,
                    transition: 'box-shadow 0.3s, transform 0.2s',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      boxShadow: `0 4px 32px 0 ${themeColors.accent}33`,
                      transform: 'scale(1.012)',
                    },
                    '::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0, left: 0, right: 0, height: 6,
                      borderTopLeftRadius: 5, borderTopRightRadius: 5,
                      background: `linear-gradient(90deg, ${themeColors.accent} 0%, #42a5f5 100%)`,
                      opacity: 0.18,
                    },
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={800} color={themeColors.accent} sx={{ mb: 1, letterSpacing: 0.3 }}>{pos.name}</Typography>
                  <Typography variant="body2" color={themeColors.text} sx={{ mb: 2, fontWeight: 500 }}>{pos.description}</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
                    {candidates.filter(c => c.position_id === pos.id).length === 0 ? (
                      <Typography color="text.secondary">No candidates for this position.</Typography>
                    ) : (
                      candidates.filter(c => c.position_id === pos.id).map((cand) => (
                        <Paper
                          key={cand.id}
                          elevation={4}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            p: 2.2,
                            borderRadius: 4,
                            minWidth: 240,
                            flex: 1,
                            boxShadow: `0 2px 12px 0 ${themeColors.accent}18`,
                            background: contrast ? '#222' : 'rgba(255,255,255,0.98)',
                            border: `1.5px solid ${themeColors.accent}22`,
                            mb: 1,
                            transition: 'box-shadow 0.2s, transform 0.2s',
                            position: 'relative',
                            overflow: 'hidden',
                            '&:hover': {
                              boxShadow: `0 4px 24px 0 ${themeColors.accent}`,
                              transform: 'scale(1.045)',
                            },
                            '::after': {
                              content: '""',
                              position: 'absolute',
                              left: 0, right: 0, bottom: 0, height: 4,
                              borderBottomLeftRadius: 4, borderBottomRightRadius: 4,
                              background: `linear-gradient(90deg, ${themeColors.accent} 0%, #42a5f5 100%)`,
                              opacity: 0.13,
                            },
                          }}
                        >
                          {cand.photo_url ? (
                            <Avatar src={cand.photo_url} alt={cand.full_name} sx={{ width: 54, height: 54, mr: 2.5, boxShadow: `0 0 0 3px ${themeColors.accent}` }} />
                          ) : (
                            <Avatar sx={{ width: 54, height: 54, mr: 2.5, bgcolor: themeColors.accent, color: '#fff', fontWeight: 700, fontSize: 22 }}>{cand.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)}</Avatar>
                          )}
                          <Box sx={{ flex: 1 }}>
                            <Typography fontWeight={800} fontSize={18} color={themeColors.text} sx={{ letterSpacing: 0.2 }}>{cand.full_name}</Typography>
                            <Typography fontSize={13.5} color="text.secondary" sx={{ fontWeight: 500 }}>{cand.bio}</Typography>
                          </Box>
                          <Button
                            variant="contained"
                            color="primary"
                            disabled={!!votes.find(v => v.position_id === pos.id)}
                            onClick={() => {
                              setSnackbar({ open: true, text: `Voted for ${cand.full_name}`, severity: 'success' });
                              setConfetti(true);
                              setTimeout(() => setConfetti(false), 1800);
                            }}
                            sx={{
                              fontWeight: 900,
                              borderRadius: 2.5,
                              px: 2.7,
                              py: 1.1,
                              ml: 2,
                              fontSize: 15.5,
                              boxShadow: `0 2px 12px 0 ${themeColors.accent}`,
                              textTransform: 'uppercase',
                              letterSpacing: 0.7,
                              background: `linear-gradient(90deg, ${themeColors.accent} 60%, #42a5f5 100%)`,
                              transition: 'box-shadow 0.2s, transform 0.2s, background 0.3s',
                              '&:hover': {
                                boxShadow: `0 4px 24px 0 ${themeColors.accent}`,
                                transform: 'scale(1.09)',
                                background: `linear-gradient(90deg, #42a5f5 60%, ${themeColors.accent} 100%)`,
                              },
                              '&.Mui-disabled': {
                                background: '#bdbdbd',
                                color: '#fff',
                                opacity: 0.8,
                              },
                            }}
                          >
                            {votes.find(v => v.position_id === pos.id) ? 'Voted' : 'Vote'}
                          </Button>
                        </Paper>
                      ))
                    )}
                  </Box>
                </Box>
              ))
            )}
          </>
        ) : (
          <Typography variant="h6" color={themeColors.accent}>No active voting event</Typography>
        )}
      </Paper>
      {/* Vote Summary */}
      <Paper elevation={6} sx={{ maxWidth: 700, mx: 'auto', p: 3, borderRadius: 5, background: themeColors.card, color: themeColors.text, mb: 4 }}>
        <Typography variant="h6" fontWeight={800} color={themeColors.accent} sx={{ mb: 2 }}>Your Vote Summary</Typography>
        <ul style={{ paddingLeft: 18 }}>
          {voteSummary.map((item, idx) => (
            <li key={idx} style={{ marginBottom: 6, fontWeight: 600 }}>
              {item.position}: {item.voted ? `Voted for ${item.candidate}` : 'Not voted'}
            </li>
          ))}
        </ul>
      </Paper>
      {/* Results Section */}
      {showResults && (
        <Paper elevation={4} sx={{ maxWidth: 700, mx: 'auto', p: 3, borderRadius: 5, background: themeColors.card, color: themeColors.text, mb: 4 }}>
          <Typography variant="h6" fontWeight={800} color={themeColors.accent} sx={{ mb: 2 }}>Voting Results</Typography>
          <Typography>Results will be displayed here after voting ends.</Typography>
        </Paper>
      )}
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
      {/* Confetti animation (simple emoji for demo) */}
      {confetti && <Fade in={confetti}><Box sx={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 2000, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80 }}>🎉</Box></Fade>}
      {/* Help/FAQ Dialog */}
      <Dialog open={helpOpen} onClose={() => setHelpOpen(false)}>
        <DialogTitle>Help & FAQ</DialogTitle>
        <DialogContent>
          <Typography><b>Theme Switcher:</b> Click the sun/moon icon to toggle light/dark mode.</Typography>
          <Typography><b>Accessibility:</b> Use Aa for contrast, A+/A- for font size.</Typography>
          <Typography><b>Voting:</b> Vote for each position during an active event.</Typography>
          <Typography><b>Voting History:</b> Click the celebration icon to view your voting history.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHelpOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      {/* Voting History Dialog */}
      <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)}>
        <DialogTitle>Voting History</DialogTitle>
        <DialogContent>
          <ul style={{ paddingLeft: 18 }}>
            {voteSummary.map((item, idx) => (
              <li key={idx} style={{ marginBottom: 6, fontWeight: 600 }}>
                {item.position}: {item.voted ? `Voted for ${item.candidate}` : 'Not voted'}
              </li>
            ))}
          </ul>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentDashboard;
