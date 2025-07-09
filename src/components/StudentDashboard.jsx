
import React, { useEffect, useState } from 'react';
// Animated counter for summary bar
function useAnimatedNumber(target, duration = 600) {
  const [value, setValue] = React.useState(target);
  const prevTarget = React.useRef(target);

  React.useEffect(() => {
    if (prevTarget.current === target) return; // Only animate if value changed
    let raf;
    let start;
    const initial = value;
    const diff = target - initial;
    if (diff === 0) return;
    function animate(ts) {
      if (!start) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(elapsed / duration, 1);
      setValue(Math.round(initial + diff * progress));
      if (progress < 1) raf = requestAnimationFrame(animate);
      else {
        setValue(target);
        prevTarget.current = target;
      }
    }
    raf = requestAnimationFrame(animate);
    return () => raf && cancelAnimationFrame(raf);
    // eslint-disable-next-line
  }, [target, duration]);
  return value;
}
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
  Snackbar,
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme
} from '@mui/material';
import CelebrationIcon from '@mui/icons-material/Celebration';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';

const StudentDashboard = () => {
  const [positions, setPositions] = useState([]);
  const [candidates, setCandidates] = useState({});
  const [votes, setVotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, text: '', severity: 'success' });
  const [timer, setTimer] = useState('');
  const [votingEvent, setVotingEvent] = useState(null);
  const [voting, setVoting] = useState({}); // { [positionId]: true }
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
  // Debug info state for event selection
  const [debugInfo, setDebugInfo] = React.useState([]);

  // Fetch voting event, positions, and candidates when student is set
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // 1. Get the latest unlocked voting event (robust: also allow admin to set a specific event as active)
      const { data: events } = await supabase
        .from('voting_events')
        .select('id, name, is_active, start_time, end_time');
      let activeEvent = null;
      let debugMsgs = [];
      if (events && events.length > 0) {
        const now = new Date();
        // TEMP: log events for debugging
        console.log('Voting events from DB:', events);
        // Add browser UTC time to debug info
        debugMsgs.push(`Browser UTC time: ${now.toISOString()} (${now.toLocaleString('en-US', { timeZone: 'UTC' })} UTC)`);
        // Find event that is active and within time window
        activeEvent = events.find(ev => {
          let start = ev.start_time;
          let end = ev.end_time;
          // Use 'name' for event label (admin page uses 'name')
          const eventLabel = ev.name || ev.event_name || ev.id;
          if (typeof start === 'string') {
            if (/\d{2}\/\d{2}\/\d{4}/.test(start)) {
              const [d, m, y, ...rest] = start.split(/\D+/);
              const [h = '00', min = '00'] = rest;
              start = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T${h.padStart(2, '0')}:${min.padStart(2, '0')}:00Z`);
            } else if (/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\+\d{2}/.test(start)) {
              // Parse Postgres timestamp with timezone (e.g., 2025-07-07 23:33:00+00)
              start = new Date(start.replace(' ', 'T').replace(/\+(\d{2})$/, "+$1:00"));
            } else {
              start = new Date(start);
            }
          }
          if (typeof end === 'string') {
            if (/\d{2}\/\d{2}\/\d{4}/.test(end)) {
              const [d, m, y, ...rest] = end.split(/\D+/);
              const [h = '00', min = '00'] = rest;
              end = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T${h.padStart(2, '0')}:${min.padStart(2, '0')}:00Z`);
            } else if (/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\+\d{2}/.test(end)) {
              // Parse Postgres timestamp with timezone (e.g., 2025-07-07 23:33:00+00)
              end = new Date(end.replace(' ', 'T').replace(/\+(\d{2})$/, "+$1:00"));
            } else {
              end = new Date(end);
            }
          }
          // Accept any truthy value for is_active (Supabase returns true/false for booleans)
          const isActive = (ev.is_active === true || ev.is_active === 1 || ev.is_active === 'true' || ev.is_active === '1' || ev.is_active === 'TRUE');
          const inWindow = start instanceof Date && end instanceof Date && !isNaN(start) && !isNaN(end) && now >= start && now <= end;
          debugMsgs.push(`Event '${eventLabel}': is_active=${ev.is_active}, start=${start instanceof Date ? start.toISOString() : start}, end=${end instanceof Date ? end.toISOString() : end}, now=${now.toISOString()}, inWindow=${inWindow}`);
          debugMsgs.push(`Event '${eventLabel}' UTC: start=${start instanceof Date ? start.toISOString() : start}, end=${end instanceof Date ? end.toISOString() : end}`);
          if (!isActive) debugMsgs.push(`Event '${eventLabel}' is not active (is_active=${ev.is_active})`);
          if (!(start instanceof Date) || isNaN(start) || !(end instanceof Date) || isNaN(end)) debugMsgs.push(`Event '${eventLabel}' missing or invalid start/end date.`);
          else if (now < start) debugMsgs.push(`Event '${eventLabel}' has not started yet (starts at ${start.toLocaleString()} / ${start.toISOString()} UTC)`);
          else if (now > end) debugMsgs.push(`Event '${eventLabel}' has ended (ended at ${end.toLocaleString()} / ${end.toISOString()} UTC)`);
          return isActive && inWindow;
        })
        // fallback: any event within time window
        || events.find(ev => {
          let start = ev.start_time;
          let end = ev.end_time;
          const eventLabel = ev.name || ev.event_name || ev.id;
          if (typeof start === 'string') {
            if (/\d{2}\/\d{2}\/\d{4}/.test(start)) {
              const [d, m, y, ...rest] = start.split(/\D+/);
              const [h = '00', min = '00'] = rest;
              start = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T${h.padStart(2, '0')}:${min.padStart(2, '0')}:00Z`);
            } else if (/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\+\d{2}/.test(start)) {
              start = new Date(start.replace(' ', 'T').replace(/\+(\d{2})$/, "+$1:00"));
            } else {
              start = new Date(start);
            }
          }
          if (typeof end === 'string') {
            if (/\d{2}\/\d{2}\/\d{4}/.test(end)) {
              const [d, m, y, ...rest] = end.split(/\D+/);
              const [h = '00', min = '00'] = rest;
              end = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T${h.padStart(2, '0')}:${min.padStart(2, '0')}:00Z`);
            } else if (/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\+\d{2}/.test(end)) {
              end = new Date(end.replace(' ', 'T').replace(/\+(\d{2})$/, "+$1:00"));
            } else {
              end = new Date(end);
            }
          }
          const inWindow = start instanceof Date && end instanceof Date && !isNaN(start) && !isNaN(end) && now >= start && now <= end;
          debugMsgs.push(`Event '${eventLabel}': is_active=${ev.is_active}, start=${start instanceof Date ? start.toISOString() : start}, end=${end instanceof Date ? end.toISOString() : end}, now=${now.toISOString()}, inWindow=${inWindow}`);
          debugMsgs.push(`Event '${eventLabel}' UTC: start=${start instanceof Date ? start.toISOString() : start}, end=${end instanceof Date ? end.toISOString() : end}`);
          if (!(start instanceof Date) || isNaN(start) || !(end instanceof Date) || isNaN(end)) debugMsgs.push(`Event '${eventLabel}' missing or invalid start/end date.`);
          else if (now < start) debugMsgs.push(`Event '${eventLabel}' has not started yet (starts at ${start.toLocaleString()} / ${start.toISOString()} UTC)`);
          else if (now > end) debugMsgs.push(`Event '${eventLabel}' has ended (ended at ${end.toLocaleString()} / ${end.toISOString()} UTC)`);
          return inWindow;
        })
        // fallback: latest event
        || events[0]
        || null;
      }
      setVotingEvent(activeEvent);
      setDebugInfo(debugMsgs);
      // 2. Fetch positions
      const { data: posData } = await supabase.from('positions').select('*'); // removed ordering for positions
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
      setLoading(false);
    };
    if (student) fetchData();
  }, [student]);

  // Fetch votes for this student and event whenever either changes
  useEffect(() => {
    const fetchVotes = async () => {
      const studentKey = student && (student.id || student.email);
      if (studentKey && votingEvent) {
        const { data: voteData } = await supabase
          .from('votes')
          .select('*')
          .eq('student_id', studentKey)
          .eq('voting_event_id', votingEvent.id);
        let voteObj = {};
        (voteData || []).forEach(v => { voteObj[v.position_id] = v.candidate_id; });
        setVotes(voteObj);
      } else {
        setVotes({});
      }
    };
    fetchVotes();
  }, [student, votingEvent]);

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
    // Only allow voting if student.id is a valid UUID
    const studentKey = student && student.id;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!studentKey || !uuidRegex.test(studentKey)) {
      setSnackbar({ open: true, text: 'Your student ID is missing or invalid. Please log out and log in again.', severity: 'error' });
      return;
    }
    if (!votingEvent) {
      setSnackbar({ open: true, text: 'No active voting event.', severity: 'error' });
      return;
    }
    // setMessage('');
    setVoting(prev => ({ ...prev, [positionId]: true }));
    // Try to insert, let DB unique constraint prevent double voting
    const { error } = await supabase.from('votes').insert([
      {
        student_id: studentKey,
        candidate_id: candidateId,
        position_id: positionId,
        voting_event_id: votingEvent.id
      }
    ]);
    if (error) {
      console.error('Vote error:', error); // Log full error for debugging
      if (error.code === '23505' || (error.message && error.message.toLowerCase().includes('unique')) ) {
        setSnackbar({ open: true, text: 'You have already voted for this position.', severity: 'warning' });
      } else if (error.message && error.message.toLowerCase().includes('null value in column') && error.message.toLowerCase().includes('student_id')) {
        setSnackbar({ open: true, text: 'Your student ID is missing. Please log out and log in again.', severity: 'error' });
      } else if (error.code === '22P02' && error.message && error.message.toLowerCase().includes('invalid input syntax for type uuid')) {
        setSnackbar({ open: true, text: 'Your student ID is invalid. Please log out and log in again.', severity: 'error' });
      } else {
        setSnackbar({ open: true, text: 'Error submitting vote.', severity: 'error' });
      }
      setVoting(prev => ({ ...prev, [positionId]: false }));
    } else {
      // Optimistically update UI immediately
      setVotes(prev => ({ ...prev, [positionId]: candidateId }));
      setShowConfetti(true);
      setSnackbar({ open: true, text: 'Vote submitted!', severity: 'success' });
      setTimeout(() => setShowConfetti(false), 1800);
      // Then re-fetch votes from backend to ensure UI is in sync
      try {
        const { data: voteData } = await supabase
          .from('votes')
          .select('*')
          .eq('student_id', studentKey)
          .eq('voting_event_id', votingEvent.id);
        let voteObj = {};
        (voteData || []).forEach(v => { voteObj[v.position_id] = v.candidate_id; });
        setVotes(voteObj);
      } catch (err) {
        // ignore fetch error, UI already updated optimistically
        console.error('Vote fetch error:', err);
      }
      setVoting(prev => ({ ...prev, [positionId]: false }));
    }
  };




  // Voting progress and turnout/abstention calculations (already declared above)


  // Move summary calculations here so they are defined before useAnimatedNumber
  const votedCount = Object.keys(votes).length;
  const totalCount = positions.length;
  const totalVotes = Object.values(votes).filter(Boolean).length;
  const turnoutPercent = totalCount > 0 ? Math.round((votedCount / totalCount) * 100) : 0;
  const abstentions = totalCount - votedCount;

  // Animated numbers for summary bar (must be after calculations)
  const animatedVotes = useAnimatedNumber(totalVotes);
  const animatedTurnout = useAnimatedNumber(turnoutPercent);
  const animatedAbstentions = useAnimatedNumber(abstentions);
  const animatedPositions = useAnimatedNumber(totalCount);

  if (loading) return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #e3eafc 60%, #f7fafd 100%)',
      animation: 'fadeInBg 1.2s cubic-bezier(.4,0,.2,1)',
    }}>
      <CircularProgress size={54} color="primary" thickness={4.5} sx={{ filter: 'drop-shadow(0 0 8px #90caf9)' }} />
    </Box>
  );

  // (moved above)

  // Animated numbers for summary bar (move here, only declare once)
  // (declaration moved above)
  // --- Premium UI/UX: Responsive AppBar, Drawer, Clean Layout ---
  return (
    <React.Fragment>
      {/* Voting summary bar - sticky and always visible */}
      <Box
        sx={{
          width: '100vw',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: { xs: 1.5, sm: 3 },
          py: 1.2,
          background: 'linear-gradient(90deg, #e3eafc 60%, #f7fafd 100%)',
          borderBottom: '1.5px solid #e3eafc',
          position: 'sticky',
          top: 6,
          zIndex: 1350,
          minHeight: 54,
          boxShadow: '0 2px 8px 0 rgba(144,202,249,0.07)',
          transition: 'background 0.3s, box-shadow 0.3s',
          willChange: 'top',
        }}
      >
        <Tooltip title="Total number of votes you have cast" arrow>
          <Box sx={{ textAlign: 'center', minWidth: 70, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <HowToVoteIcon sx={{ color: 'primary.main', fontSize: 22, mb: 0.1 }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: 13 }}>Total Votes</Typography>
            <Typography variant="h6" color="primary.main" sx={{ fontWeight: 800, fontSize: 18 }}>{animatedVotes}</Typography>
          </Box>
        </Tooltip>
        <Tooltip title="Percentage of positions you have voted for" arrow>
          <Box sx={{ textAlign: 'center', minWidth: 70, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CelebrationIcon sx={{ color: 'secondary.main', fontSize: 22, mb: 0.1 }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: 13 }}>Turnout</Typography>
            <Typography variant="h6" color="primary.main" sx={{ fontWeight: 800, fontSize: 18 }}>{animatedTurnout}%</Typography>
          </Box>
        </Tooltip>
        <Tooltip title="Positions you have not voted for" arrow>
          <Box sx={{ textAlign: 'center', minWidth: 70, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <InfoOutlinedIcon sx={{ color: 'info.main', fontSize: 22, mb: 0.1 }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: 13 }}>Abstentions</Typography>
            <Typography variant="h6" color="primary.main" sx={{ fontWeight: 800, fontSize: 18 }}>{animatedAbstentions}</Typography>
          </Box>
        </Tooltip>
        <Tooltip title="Total number of positions available" arrow>
          <Box sx={{ textAlign: 'center', minWidth: 70, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.1 }}>
              <Typography variant="caption" color="primary.main" sx={{ fontWeight: 900, fontSize: 15, pr: 0.5 }}>#</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: 13 }}>Positions</Typography>
            </Box>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="h6" color="primary.main" sx={{ fontWeight: 900, fontSize: 20, px: 1, borderRadius: 2, bgcolor: 'rgba(25,118,210,0.08)', boxShadow: '0 1px 4px 0 #e3eafc', letterSpacing: 1 }}>{animatedPositions}</Typography>
            </Box>
          </Box>
        </Tooltip>
      </Box>
      {/* Responsive AppBar for mobile/desktop, with more modern, clean, and branded look */}
      {/* Decorative top gradient bar for extra polish */}
      <Box sx={{
        width: '100vw',
        height: 6,
        background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 40%, #90caf9 100%)',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 1400,
        boxShadow: '0 2px 12px 0 rgba(66,165,245,0.13)',
        opacity: 0.98,
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
      }} />
      <AppBar position="sticky" elevation={0} sx={{
        background: 'rgba(255,255,255,0.99)',
        color: 'primary.main',
        borderBottom: '1.5px solid #e3eafc',
        boxShadow: '0 4px 18px 0 rgba(144,202,249,0.13)',
        zIndex: 1300,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        transition: 'background 0.3s, box-shadow 0.3s',
        minHeight: { xs: 54, sm: 64 },
      }}>
        <Toolbar sx={{ px: { xs: 1, sm: 3 }, py: { xs: 0.5, sm: 1 }, minHeight: { xs: 54, sm: 64 } }}>
          {isMobile && (
            <IconButton edge="start" color="primary" aria-label="menu" onClick={() => setDrawerOpen(true)} sx={{ mr: 1, bgcolor: 'rgba(66,165,245,0.08)', borderRadius: 2 }}>
              <MenuIcon />
            </IconButton>
          )}
          <HowToVoteIcon sx={{ fontSize: 30, color: 'primary.main', mr: 1, filter: 'drop-shadow(0 0 4px #90caf9)' }} />
          <Typography
            variant="h6"
            fontWeight={900}
            color="primary.main"
            sx={{
              flexGrow: 1,
              letterSpacing: 1.7,
              fontSize: { xs: 20, sm: 26 },
              textAlign: { xs: 'left', sm: 'left' },
              textShadow: '0 1px 0 #fff, 0 0.5px 2px #e3eafc',
              fontFamily: 'Inter, Roboto, Arial, sans-serif',
              textTransform: 'uppercase',
              userSelect: 'none',
            }}
          >
            Student Voting
          </Typography>
          {!isMobile && student && (
            <Tooltip title={student.email || 'No email'} arrow>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  bgcolor: 'rgba(144,202,249,0.13)',
                  px: 2.2,
                  py: 1.1,
                  borderRadius: 2.5,
                  boxShadow: '0 2px 8px 0 rgba(144,202,249,0.13)',
                  justifyContent: 'flex-start',
                  border: '1.5px solid #e3eafc',
                }}
                aria-label={`Student info: ${student.full_name && student.full_name.trim() !== '' && student.full_name.toLowerCase() !== student.email?.toLowerCase() ? student.full_name : student.email || 'Student'}`}
              >
                <Avatar
                  sx={{ bgcolor: 'primary.main', width: 38, height: 38, fontWeight: 700, boxShadow: '0 2px 10px 0 #e3eafc', border: '2.5px solid #fff' }}
                  aria-label="Student avatar"
                >
                  {(() => {
                    const nameValid = student.full_name && student.full_name.trim() !== '' && student.full_name.toLowerCase() !== student.email?.toLowerCase();
                    const initial = nameValid ? student.full_name.trim()[0] : (student.email ? student.email.trim()[0] : 'S');
                    return initial.toUpperCase();
                  })()}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle1" fontWeight={700} color="text.primary" sx={{ lineHeight: 1, fontSize: 15.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>
                    {student.full_name && student.full_name.trim() !== '' && student.full_name.toLowerCase() !== student.email?.toLowerCase()
                      ? student.full_name
                      : (student.email || 'Student')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11.5 }}>
                    <span style={{ fontWeight: 500 }}>Matric:</span> {student.matric_no || <span style={{ color: '#bbb' }}>-</span>}
                  </Typography>
                </Box>
              </Box>
            </Tooltip>
          )}
          <IconButton onClick={handleLogout} color="error" sx={{ ml: 2, bgcolor: 'rgba(244,67,54,0.08)', borderRadius: 2 }} aria-label="Logout">
            <LogoutIcon sx={{ fontSize: 27, filter: 'drop-shadow(0 0 2px #f44336)' }} />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: 250, background: 'rgba(255,255,255,0.998)', borderRight: '1.5px solid #e3eafc', boxShadow: '0 4px 24px 0 rgba(66,165,245,0.14)', borderRadius: 0, p: 0 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', px: 2.2, py: 2.2, gap: 1.2, borderBottom: '1.5px solid #e3eafc', mb: 1 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 42, height: 42, fontWeight: 700, boxShadow: '0 1px 6px 0 rgba(144,202,249,0.10)' }}>
            {student?.full_name && student?.full_name.trim() !== '' && student?.full_name.toLowerCase() !== student?.email?.toLowerCase()
              ? student.full_name.trim()[0].toUpperCase()
              : (student?.email ? student.email.trim()[0].toUpperCase() : 'S')}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight={800} color="primary.main" sx={{ fontSize: 16.5, maxWidth: 140, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {student?.full_name && student?.full_name.trim() !== '' && student?.full_name.toLowerCase() !== student?.email?.toLowerCase()
                ? student.full_name
                : (student?.email || 'Student')}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11.5 }}>
              <span style={{ fontWeight: 500 }}>Matric:</span> {student?.matric_no || <span style={{ color: '#bbb' }}>-</span>}
            </Typography>
          </Box>
        </Box>
        <Divider />
        <List sx={{ p: 0 }}>
          <ListItem button onClick={handleLogout} sx={{ color: 'error.main', mt: 1, borderRadius: 1, mx: 1, mb: 1, '&:hover': { background: 'rgba(244,67,54,0.08)' } }}>
            <ListItemIcon sx={{ color: 'error.main', minWidth: 36 }}><LogoutIcon sx={{ fontSize: 24, filter: 'drop-shadow(0 0 2px #f44336)' }} /></ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItem>
        </List>
      </Drawer>

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
        py: { xs: 1.5, sm: 2.5, md: 7 },
        px: { xs: 0.5, sm: 2 },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        overflowX: 'hidden',
        position: 'relative',
        boxSizing: 'border-box',
        maxWidth: '100vw',
        animation: 'fadeInBg 1.2s cubic-bezier(.4,0,.2,1)',
        scrollBehavior: 'smooth',
        backdropFilter: 'blur(2px)',
      }}>
        {!votingEvent && (
          <Alert severity="warning" sx={{ mb: 4, fontWeight: 600, fontSize: 18 }}>
            No active voting event. Please contact the administrator or try again later.<br />
            {Array.isArray(debugInfo) && debugInfo.length > 0 && (
              <Box sx={{ mt: 2, textAlign: 'left' }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 500, mb: 0.5 }}>
                  Debug Info:
                </Typography>
                <ul style={{ margin: 0, paddingLeft: 18, color: '#888', fontSize: 14 }}>
                  {debugInfo.map((msg, i) => <li key={i}>{msg}</li>)}
                </ul>
              </Box>
            )}
          </Alert>
        )}
        {/* Voting Progress Bar */}
        <Box sx={{ width: '100%', maxWidth: 520, mb: { xs: 2, sm: 3 } }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 600, letterSpacing: 0.2 }}>
            Voting Progress: {votedCount} / {totalCount} positions
          </Typography>
          <LinearProgress
            variant="determinate"
            value={totalCount === 0 ? 0 : (votedCount / totalCount) * 100}
            sx={{
              height: 9,
              borderRadius: 5,
              background: '#e3eafc',
              boxShadow: '0 1px 4px 0 rgba(144,202,249,0.07)',
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(90deg, #42a5f5 60%, #90caf9 100%)',
                boxShadow: '0 1px 6px 0 rgba(66,165,245,0.10)',
              },
            }}
            aria-label="Voting Progress"
          />
        </Box>

        {/* Timer and Info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, mb: { xs: 1, sm: 2 } }}>
          <InfoOutlinedIcon color="info" sx={{ fontSize: 22, mr: 0.5 }} />
          <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500, fontSize: { xs: 14, sm: 16 } }}>
            {timer}
          </Typography>
        </Box>

        {/* Student Info Card */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.7, sm: 2.7 },
            mb: { xs: 2, sm: 4 },
            width: '100%',
            maxWidth: 520,
            borderRadius: 3.5,
            background: 'rgba(255,255,255,0.998)',
            boxShadow: '0 4px 24px 0 rgba(144,202,249,0.16)',
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 1.3, sm: 2.3 },
            flexDirection: { xs: 'column', sm: 'row' },
            textAlign: { xs: 'center', sm: 'left' },
            border: '1.5px solid #e3eafc',
            transition: 'box-shadow 0.2s, border 0.2s',
            '&:hover': {
              boxShadow: '0 6px 32px 0 rgba(66,165,245,0.16)',
              border: '1.5px solid #90caf9',
            },
          }}
          aria-label="Student info card"
        >
          <Avatar
            sx={{ bgcolor: 'primary.main', width: 56, height: 56, fontWeight: 700, mb: { xs: 1, sm: 0 }, boxShadow: '0 3px 14px 0 rgba(144,202,249,0.16)', border: '3px solid #fff' }}
            aria-label="Student avatar large"
          >
            {(() => {
              const nameValid = student?.full_name && student?.full_name.trim() !== '' && student?.full_name.toLowerCase() !== student?.email?.toLowerCase();
              const initial = nameValid ? student.full_name.trim()[0] : (student?.email ? student.email.trim()[0] : 'S');
              return initial.toUpperCase();
            })()}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" fontWeight={800} color="primary.main" sx={{ fontSize: { xs: 17, sm: 21 }, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: { xs: 160, sm: 220 } }}>
              {student?.full_name && student?.full_name.trim() !== '' && student?.full_name.toLowerCase() !== student?.email?.toLowerCase()
                ? student.full_name
                : (student?.email || 'Student')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: 12.5, sm: 14.5 }, fontWeight: 500 }}>
              <span style={{ fontWeight: 600 }}>Matric:</span> {student?.matric_no || <span style={{ color: '#bbb' }}>-</span>}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: 12.5, sm: 14.5 }, fontWeight: 500 }}>
              <span style={{ fontWeight: 600 }}>Email:</span> {student?.email || <span style={{ color: '#bbb' }}>-</span>}
            </Typography>
          </Box>
        </Paper>

        {/* Voting UI */}
        <Box sx={{ width: '100%', maxWidth: 700, display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 3 } }}>
          {positions.length === 0 ? (
            <Alert severity="info">No positions available for voting at this time.</Alert>
          ) : (
            positions.map((pos) => (
              <Paper key={pos.id} elevation={0} sx={{
                p: { xs: 1.3, sm: 2.1 },
                borderRadius: 3,
                background: 'rgba(255,255,255,0.998)',
                boxShadow: '0 4px 18px 0 rgba(144,202,249,0.13)',
                mb: 0.5,
                border: '1.5px solid #e3eafc',
                transition: 'box-shadow 0.2s, border 0.2s',
                '&:hover': {
                  boxShadow: '0 8px 32px 0 rgba(66,165,245,0.18)',
                  border: '1.5px solid #90caf9',
                },
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 0.5, sm: 1 } }}>
                  <Typography variant="h6" fontWeight={700} color="primary.main" sx={{ flexGrow: 1, fontSize: { xs: 15, sm: 18 } }}>
                    {pos.name}
                  </Typography>
                  {votes[pos.id] && (
                    <Fade in={true}><CelebrationIcon color="secondary" sx={{ ml: 1 }} /></Fade>
                  )}
                </Box>
                <Divider sx={{ mb: { xs: 1, sm: 2 } }} />
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 1, sm: 2 }, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                  {(candidates[pos.id] || []).length === 0 ? (
                    <Typography variant="body2" color="text.secondary">No candidates for this position.</Typography>
                  ) : (
                    candidates[pos.id].map((cand) => {
                      const voted = votes[pos.id] === cand.id;
                      return (
                        <Paper
                          key={cand.id}
                          elevation={0}
                          sx={{
                            p: { xs: 1.1, sm: 1.6 },
                            minWidth: { xs: 104, sm: 144 },
                            borderRadius: 3,
                            background: voted ? 'linear-gradient(90deg, #42a5f5 60%, #90caf9 100%)' : 'rgba(227,234,252,0.7)',
                            color: voted ? '#fff' : 'inherit',
                            boxShadow: voted ? '0 6px 24px 0 rgba(66,165,245,0.19)' : '0 1px 4px 0 rgba(144,202,249,0.04)',
                            border: voted ? '3px solid #42a5f5' : '1.5px solid #e3eafc',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: { xs: 1, sm: 1.2 },
                            position: 'relative',
                            transition: 'box-shadow 0.18s, border 0.18s, background 0.18s',
                            cursor: !votingEvent || voted ? 'not-allowed' : 'pointer',
                            outline: voted ? '2px solid #fbc02d' : 'none',
                            '&:hover': votingEvent && !voted && {
                              boxShadow: '0 8px 32px 0 rgba(66,165,245,0.18)',
                              background: 'linear-gradient(90deg, #e3eafc 60%, #f7fafd 100%)',
                              border: '1.5px solid #90caf9',
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
                            sx={{ width: { xs: 42, sm: 52 }, height: { xs: 42, sm: 52 }, mb: { xs: 0.5, sm: 1 }, bgcolor: voted ? 'secondary.main' : 'primary.light', color: voted ? '#fff' : 'primary.main', fontWeight: 700, fontSize: { xs: 18, sm: 24 }, border: voted ? '2.5px solid #fff' : '1.5px solid #e3eafc', boxShadow: voted ? '0 3px 12px 0 #fbc02d' : '0 1px 4px 0 #e3eafc' }}
                            alt={cand.name || 'Candidate'}
                          >
                            {cand.name && cand.name.length > 0 ? cand.name[0].toUpperCase() : '?'}
                          </Avatar>
                          <Typography variant="subtitle1" fontWeight={600} sx={{ textAlign: 'center', fontSize: { xs: 12, sm: 15 } }}>
                            {cand.name || <span style={{ color: '#bbb' }}>No Name</span>}
                          </Typography>
                          <Typography variant="caption" color={voted ? '#fff' : 'text.secondary'} sx={{ fontSize: { xs: 10, sm: 12 } }}>
                            {cand.bio && cand.bio.length > 0 ? cand.bio : <span style={{ color: '#bbb' }}>No bio</span>}
                          </Typography>
                          <Button
                            variant={voted ? 'contained' : 'outlined'}
                            color={voted ? 'secondary' : 'primary'}
                            size="small"
                            disabled={!votingEvent || voted || voting[pos.id]}
                            sx={{ mt: { xs: 0.5, sm: 1 }, fontWeight: 800, borderRadius: 3, boxShadow: voted ? '0 3px 12px 0 rgba(251,192,45,0.16)' : 'none', letterSpacing: 0.7, minWidth: { xs: 56, sm: 74 }, fontSize: { xs: 11, sm: 14 }, textTransform: 'uppercase', transition: 'background 0.18s, color 0.18s', fontFamily: 'Inter, Roboto, Arial, sans-serif' }}
                          >
                            {voted ? 'Voted' : voting[pos.id] ? 'Voting...' : !votingEvent ? 'Voting Disabled' : 'Vote'}
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
        @keyframes fadeInBg {
          0% { opacity: 0; transform: translateY(16px); }
          100% { opacity: 1; transform: none; }
        }
        html, body, #root {
          background: #f7fafd;
        }
      `}</style>
    </React.Fragment>
  );
};

export default StudentDashboard;
