import React, { useEffect, useState } from 'react';
import { Box, Typography, Select, MenuItem, FormControl, InputLabel, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Button, TextField, Grid, Card, CardContent, Chip, Collapse, Modal, IconButton, Tooltip as MuiTooltip, ToggleButton, ToggleButtonGroup, Snackbar } from '@mui/material';
import { supabase } from '../supabaseClient';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import HistoryIcon from '@mui/icons-material/History';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import InfoIcon from '@mui/icons-material/Info';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
// Explicitly register the plugin for compatibility
if (typeof window !== 'undefined' && jsPDF && autoTable) {
  try {
    autoTable(jsPDF);
  } catch (e) {
    // ignore if already registered
  }
}
import Fade from '@mui/material/Fade';

export default function AdminResults() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filteredResults, setFilteredResults] = useState([]);
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditLog, setAuditLog] = useState([]);
  const [locked, setLocked] = useState(false);
  const [summary, setSummary] = useState({ totalVotes: 0, turnout: 0, abstentions: 0 });
  const [chartType, setChartType] = useState('bar');
  const [voterModal, setVoterModal] = useState({ open: false, candidate: null, voters: [] });
  const [snackbar, setSnackbar] = useState({ open: false, text: '', severity: 'success' });

  useEffect(() => {
    // Fetch all voting events
    supabase
      .from('voting_events')
      .select('id, name')
      .then(({ data }) => {
        setEvents(data || []);
        if (data && data.length > 0) setSelectedEvent(data[0].id);
      });
  }, []);

  useEffect(() => {
    if (!selectedEvent) return;
    setLoading(true);
    // Fetch results for the selected event
    supabase
      .rpc('get_voting_results', { voting_event_id: selectedEvent })
      .then(({ data, error }) => {
        if (error) {
          setResults([]);
        } else {
          setResults(data || []);
        }
        setLoading(false);
      });
  }, [selectedEvent]);

  useEffect(() => {
    // Defensive: ensure results is always an array
    const safeResults = Array.isArray(results) ? results : [];
    setFilteredResults(
      safeResults.filter(r =>
        (r.position_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (r.candidate_name || '').toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [results, search]);

  // Real-time polling
  useEffect(() => {
    if (!selectedEvent) return;
    setLoading(true);
    const fetchResults = () => {
      supabase.rpc('get_voting_results', { voting_event_id: selectedEvent }).then(({ data }) => {
        setResults(data || []);
        setLoading(false);
      });
      supabase.from('voting_audit').select('*').eq('voting_event_id', selectedEvent).order('timestamp', { ascending: false }).then(({ data }) => setAuditLog(data || []));
      supabase.rpc('get_voting_summary', { voting_event_id: selectedEvent }).then(({ data }) => setSummary(data || { totalVotes: 0, turnout: 0, abstentions: 0 }));
      supabase.from('voting_events').select('locked').eq('id', selectedEvent).single().then(({ data }) => setLocked(data?.locked || false));
    };
    fetchResults();
    const interval = setInterval(fetchResults, 5000);
    return () => clearInterval(interval);
  }, [selectedEvent]);

  useEffect(() => {
    setFilteredResults(
      results.filter(r =>
        r.position_name.toLowerCase().includes(search.toLowerCase()) ||
        r.candidate_name.toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [results, search]);

  // CSV Export
  const handleExportCSV = () => {
    const header = 'Position,Candidate,Votes\n';
    const rows = filteredResults.map(r => `${r.position_name},${r.candidate_name},${r.vote_count}`).join('\n');
    const csv = header + rows;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'voting_results.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // PDF Export
  const handleExportPDF = () => {
    try {
      if (!filteredResults || filteredResults.length === 0) {
        setSnackbar({ open: true, text: 'No results to export.', severity: 'warning' });
        return;
      }
      const doc = new jsPDF();
      doc.text('Voting Results', 14, 16);
      if (typeof doc.autoTable !== 'function') {
        setSnackbar({ open: true, text: 'PDF export failed: autoTable not loaded.', severity: 'error' });
        return;
      }
      doc.autoTable({
        head: [['Position', 'Candidate', 'Votes']],
        body: filteredResults.map(r => [r.position_name, r.candidate_name, r.vote_count]),
        startY: 22
      });
      doc.save('voting_results.pdf');
      setSnackbar({ open: true, text: 'PDF exported successfully!', severity: 'success' });
    } catch (err) {
      // Log error and show snackbar
      console.error('PDF export error:', err);
      setSnackbar({ open: true, text: 'PDF export failed. See console for details.', severity: 'error' });
    }
  };

  // Lock results
  const handleLockResults = async () => {
    await supabase.from('voting_events').update({ locked: !locked }).eq('id', selectedEvent);
    setLocked(!locked);
  };

  // Drilldown: show voters for candidate
  // const handleShowVoters = async (candidate) => {
  //   const { data } = await supabase.from('votes').select('student:student_id(full_name,matric_no)').eq('candidate_id', candidate.candidate_id).eq('voting_event_id', selectedEvent);
  //   setVoterModal({ open: true, candidate, voters: data?.map(v => v.student) || [] });
  // };

  // Group by position for charts
  const grouped = filteredResults.reduce((acc, row) => {
    acc[row.position_name] = acc[row.position_name] || [];
    acc[row.position_name].push(row);
    return acc;
  }, {});

  const COLORS = ['#1976d2', '#388e3c', '#fbc02d', '#d32f2f', '#7b1fa2', '#0288d1', '#c2185b'];

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', width: '100%', p: { xs: 1, sm: 3 } }}>
      {/* Snackbar for PDF/CSV export feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2600}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        TransitionComponent={Fade}
        sx={{ zIndex: 3000 }}
      >
        <Paper elevation={6} sx={{ px: 3, py: 1.5, bgcolor: snackbar.severity === 'success' ? '#e3fcec' : snackbar.severity === 'warning' ? '#fffbe6' : '#ffebee' }}>
          <Typography sx={{ fontWeight: 600, color: snackbar.severity === 'success' ? '#388e3c' : snackbar.severity === 'warning' ? '#b28704' : '#d32f2f' }}>
            {snackbar.text}
          </Typography>
        </Paper>
      </Snackbar>
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} md={8}>
          <Typography variant="h5" fontWeight={700}>Voting Results {locked && <Chip label="Certified" color="success" size="small" icon={<LockIcon />} sx={{ ml: 1 }} />}</Typography>
        </Grid>
        <Grid item xs={12} md={4} textAlign={{ xs: 'left', md: 'right' }}>
          <Button variant="contained" color={locked ? 'warning' : 'success'} startIcon={locked ? <LockOpenIcon /> : <LockIcon />} onClick={handleLockResults} sx={{ mr: 1 }}>{locked ? 'Unlock Results' : 'Lock Results'}</Button>
          <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={handleExportCSV} sx={{ mr: 1 }}>Export CSV</Button>
          <Button variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={handleExportPDF}>Export PDF</Button>
        </Grid>
      </Grid>
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} md={3}><Card><CardContent><Typography variant="subtitle2">Total Votes</Typography><Typography variant="h6">{summary.totalVotes}</Typography></CardContent></Card></Grid>
        <Grid item xs={12} md={3}><Card><CardContent><Typography variant="subtitle2">Turnout</Typography><Typography variant="h6">{summary.turnout}%</Typography></CardContent></Card></Grid>
        <Grid item xs={12} md={3}><Card><CardContent><Typography variant="subtitle2">Abstentions</Typography><Typography variant="h6">{summary.abstentions}</Typography></CardContent></Card></Grid>
        <Grid item xs={12} md={3}><Card><CardContent><Typography variant="subtitle2">Positions</Typography><Typography variant="h6">{Object.keys(grouped).length}</Typography></CardContent></Card></Grid>
      </Grid>
      <Box mb={2}>
        <ToggleButtonGroup value={chartType} exclusive onChange={(_, v) => v && setChartType(v)} size="small">
          <ToggleButton value="bar">Bar</ToggleButton>
          <ToggleButton value="pie">Pie</ToggleButton>
        </ToggleButtonGroup>
        <MuiTooltip title="Show Audit Log"><IconButton onClick={() => setAuditOpen(v => !v)}><HistoryIcon /></IconButton></MuiTooltip>
      </Box>
      <Collapse in={auditOpen} sx={{ mb: 2 }}>
        <Card variant="outlined"><CardContent>
          <Typography variant="subtitle1" mb={1}>Audit Log</Typography>
          {auditLog.length === 0 ? <Typography>No audit records.</Typography> : (
            <Table size="small"><TableHead><TableRow><TableCell>Time</TableCell><TableCell>Action</TableCell><TableCell>User</TableCell></TableRow></TableHead><TableBody>{auditLog.map((log, i) => <TableRow key={i}><TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell><TableCell>{log.action}</TableCell><TableCell>{log.user}</TableCell></TableRow>)}</TableBody></Table>
          )}
        </CardContent></Card>
      </Collapse>
      <FormControl sx={{ minWidth: 240, mb: 3, mr: 2 }}>
        <InputLabel id="event-select-label">Voting Event</InputLabel>
        <Select
          labelId="event-select-label"
          value={selectedEvent}
          label="Voting Event"
          onChange={e => setSelectedEvent(e.target.value)}
        >
          {events.map(ev => (
            <MenuItem key={ev.id} value={ev.id}>{ev.name}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <TextField
        label="Search by position or candidate"
        value={search}
        onChange={e => setSearch(e.target.value)}
        sx={{ mb: 3, minWidth: 260, mr: 2 }}
      />
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ mb: 4 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Position</TableCell>
                  <TableCell>Candidate</TableCell>
                  <TableCell>Votes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredResults.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center">No results available.</TableCell>
                  </TableRow>
                ) : (
                  filteredResults.map((row, idx) => (
                    <TableRow key={idx} sx={row.is_winner ? { background: 'rgba(56, 142, 60, 0.12)' } : {}}>
                      <TableCell>{row.position_name}</TableCell>
                      <TableCell>
                        {row.candidate_name}
                        {row.is_winner && (
                          <span style={{ color: '#388e3c', fontWeight: 700, marginLeft: 8 }}>(Winner)</span>
                        )}
                      </TableCell>
                      <TableCell>{row.vote_count}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {/* Charts per position */}
          {Object.entries(grouped).map(([position, candidates]) => (
            <Box key={position} mb={5}>
              <Typography variant="h6" mb={1}>{position} - Vote Distribution</Typography>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={candidates} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <XAxis dataKey="candidate_name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="vote_count" fill="#1976d2">
                    {candidates.map((entry, i) => (
                      <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={candidates}
                    dataKey="vote_count"
                    nameKey="candidate_name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label
                  >
                    {candidates.map((entry, i) => (
                      <Cell key={`cell-pie-${i}`} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          ))}
        </>
      )}
      <Modal open={voterModal.open} onClose={() => setVoterModal({ open: false, candidate: null, voters: [] })}>
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', bgcolor: 'background.paper', p: 4, borderRadius: 2, minWidth: 320 }}>
          <Typography variant="h6" mb={2}>Voters for {voterModal.candidate?.candidate_name}</Typography>
          {voterModal.voters.length === 0 ? <Typography>No voters found.</Typography> : (
            <Table size="small"><TableHead><TableRow><TableCell>Full Name</TableCell><TableCell>Matric No</TableCell></TableRow></TableHead><TableBody>{voterModal.voters.map((v, i) => <TableRow key={i}><TableCell>{v.full_name}</TableCell><TableCell>{v.matric_no}</TableCell></TableRow>)}</TableBody></Table>
          )}
        </Box>
      </Modal>
    </Box>
  );
}
