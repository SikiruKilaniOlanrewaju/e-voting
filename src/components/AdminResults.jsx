// All custom hooks and handlers must be inside the component, but all imports must be at the very top of the file.
import React, { useEffect, useState } from 'react';
import { Box, Typography, Select, MenuItem, FormControl, InputLabel, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Button, TextField, Grid, Card, CardContent, Chip, Collapse, Modal, IconButton, Tooltip as MuiTooltip, ToggleButton, ToggleButtonGroup, Snackbar, Checkbox, FormGroup, FormControlLabel } from '@mui/material';
import { supabase } from '../supabaseClient';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import html2canvas from 'html2canvas';
import Fade from '@mui/material/Fade';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import CelebrationIcon from '@mui/icons-material/Celebration';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PrintIcon from '@mui/icons-material/Print';
import TableChartIcon from '@mui/icons-material/TableChart';
import { exportToExcel } from './exportToExcel';
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
  } catch {
    // ignore if already registered
  }
}
// Branding info
const BRAND = {
  name: 'Online Voting System',
  logo: '/vite.svg', // fallback to vite.svg if no custom logo
};

// Animated counter for summary bar (copied from StudentDashboard)
function useAnimatedNumber(target, duration = 600) {
  const [value, setValue] = React.useState(target);
  const prevTarget = React.useRef(target);

  React.useEffect(() => {
    if (prevTarget.current === target) {
      setValue(target); // Always sync value if target changes but no animation needed
      return;
    }
    let raf;
    let start;
    const initial = value;
    const diff = target - initial;
    if (diff === 0) {
      setValue(target);
      prevTarget.current = target;
      return;
    }
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

export default function AdminResults() {
  // Print Preview Modal state
  const [printPreviewOpen, setPrintPreviewOpen] = useState(false);
  // Summary bar customization state
  const [summaryBarOptions, setSummaryBarOptions] = useState({
    totalVotes: true,
    turnout: true,
    abstentions: true,
    positions: true,
  });
  // Open print preview
  const handlePrintPreviewOpen = () => setPrintPreviewOpen(true);
  const handlePrintPreviewClose = () => setPrintPreviewOpen(false);
  // Export column selection state
  const [exportCols, setExportCols] = useState({ Position: true, Candidate: true, Votes: true });
  const [exportDialog, setExportDialog] = useState(false);
  const exportableCols = [
    { key: 'Position', label: 'Position' },
    { key: 'Candidate', label: 'Candidate' },
    { key: 'Votes', label: 'Votes' },
  ];
  // Chart data mode
  const [chartDataMode, setChartDataMode] = useState('count'); // 'count' or 'percent'
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filteredResults, setFilteredResults] = useState([]);
  // Pagination for results table (must come after filteredResults is defined)
  const [resultsPage, setResultsPage] = useState(0);
  const resultsRowsPerPage = 15;
  const pagedResults = filteredResults.slice(resultsPage * resultsRowsPerPage, (resultsPage + 1) * resultsRowsPerPage);
  // Reset page if filteredResults changes
  useEffect(() => {
    setResultsPage(0);
  }, [filteredResults]);
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditLog, setAuditLog] = useState([]);
  const [locked, setLocked] = useState(false);
  const [summary, setSummary] = useState({ totalVotes: 0, turnout: 0, abstentions: 0 });
  // Animated numbers for summary bar
  // Defensive: always use numbers for summary bar
  const safeTotalVotes = Number.isFinite(summary.totalVotes) ? summary.totalVotes : 0;
  const safeTurnout = Number.isFinite(summary.turnout) ? summary.turnout : 0;
  const safeAbstentions = Number.isFinite(summary.abstentions) ? summary.abstentions : 0;
  const animatedVotes = useAnimatedNumber(safeTotalVotes);
  const animatedTurnout = useAnimatedNumber(safeTurnout);
  const animatedAbstentions = useAnimatedNumber(safeAbstentions);
  const grouped = filteredResults.reduce((acc, row) => {
    acc[row.position_name] = acc[row.position_name] || [];
    acc[row.position_name].push(row);
    return acc;
  }, {});
  const positionsCount = Object.keys(grouped).length;
  const animatedPositions = useAnimatedNumber(positionsCount);
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
    if (!selectedEvent || typeof selectedEvent !== 'string' || !/^[0-9a-fA-F-]{36}$/.test(selectedEvent)) return;
    setLoading(true);
    const fetchResults = () => {
      supabase.rpc('get_voting_results', { voting_event_id: selectedEvent }).then(({ data }) => {
        setResults(data || []);
        setLoading(false);
      });
      supabase.from('voting_audit').select('*').eq('voting_event_id', selectedEvent).order('timestamp', { ascending: false }).then(({ data }) => setAuditLog(data || []));
      supabase.from('voting_events').select('locked').eq('id', selectedEvent).single().then(({ data }) => setLocked(data?.locked || false));
    };
    fetchResults();
    const interval = setInterval(fetchResults, 5000);
    return () => clearInterval(interval);
  }, [selectedEvent]);

  useEffect(() => {
    setFilteredResults(
      results.filter(r =>
        (r.position_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (r.candidate_name || '').toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [results, search]);

  // --- Calculate summary from ALL results (not filtered) ---
  useEffect(() => {
    if (!Array.isArray(results) || results.length === 0) {
      setSummary({ totalVotes: 0, turnout: 0, abstentions: 0 });
      return;
    }
    // Total votes: sum of all vote_count fields
    const totalVotes = results.reduce((sum, row) => sum + (row.vote_count || 0), 0);
    // Unique positions
    const positionsSet = new Set(results.map(r => r.position_name));
    const positionsCount = positionsSet.size;
    // Positions with at least one vote
    const votedPositions = new Set(results.filter(r => (r.vote_count || 0) > 0).map(r => r.position_name));
    const turnout = positionsCount > 0 ? Math.round((votedPositions.size / positionsCount) * 100) : 0;
    const abstentions = positionsCount - votedPositions.size;
    setSummary({ totalVotes, turnout, abstentions });
  }, [results]);


  // CSV Export
  // Open export dialog for column selection
  const handleExportDialogOpen = () => setExportDialog(true);
  const handleExportDialogClose = () => setExportDialog(false);
  // Get selected columns for export
  const getExportCols = () => exportableCols.filter(col => exportCols[col.key]);
  // Export CSV with selected columns and branding
  const handleExportCSV = () => {
    const cols = getExportCols();
    const header = `${BRAND.name} - ${events.find(e=>e.id===selectedEvent)?.name || ''} (${new Date().toLocaleDateString()})\n` + cols.map(c=>c.label).join(',') + '\n';
    const rows = filteredResults.map(r => cols.map(c => {
      if (c.key === 'Position') return r.position_name;
      if (c.key === 'Candidate') return r.candidate_name;
      if (c.key === 'Votes') return r.vote_count;
      return '';
    }).join(',')).join('\n');
    const csv = header + rows + '\n--- Exported from Online Voting System ---';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'voting_results.csv';
    a.click();
    URL.revokeObjectURL(url);
    setExportDialog(false);
  };

  // Excel Export
  const handleExportExcel = () => {
    if (!filteredResults || filteredResults.length === 0) {
      setSnackbar({ open: true, text: 'No results to export.', severity: 'warning' });
      return;
    }
    const cols = getExportCols();
    const data = filteredResults.map(r => {
      const row = {};
      cols.forEach(c => {
        if (c.key === 'Position') row.Position = r.position_name;
        if (c.key === 'Candidate') row.Candidate = r.candidate_name;
        if (c.key === 'Votes') row.Votes = r.vote_count;
      });
      return row;
    });
    // Add branding row at top
    data.unshift({ Position: `${BRAND.name} - ${events.find(e=>e.id===selectedEvent)?.name || ''} (${new Date().toLocaleDateString()})`, Candidate: '', Votes: '' });
    exportToExcel(data);
    setSnackbar({ open: true, text: 'Excel exported successfully!', severity: 'success' });
    setExportDialog(false);
  };

  // Print Table
  const handlePrint = () => {
    window.print();
  };

  // PDF Export
  const handleExportPDF = () => {
    try {
      if (!filteredResults || filteredResults.length === 0) {
        setSnackbar({ open: true, text: 'No results to export.', severity: 'warning' });
        return;
      }
      const cols = getExportCols();
      const doc = new jsPDF();
      // Branding
      doc.setFontSize(14);
      doc.text(`${BRAND.name} - ${events.find(e=>e.id===selectedEvent)?.name || ''}`, 14, 16);
      doc.setFontSize(10);
      doc.text(`Exported: ${new Date().toLocaleString()}`, 14, 22);
      if (typeof doc.autoTable !== 'function') {
        setSnackbar({ open: true, text: 'PDF export failed: autoTable not loaded.', severity: 'error' });
        return;
      }
      doc.autoTable({
        head: [cols.map(c=>c.label)],
        body: filteredResults.map(r => cols.map(c => {
          if (c.key === 'Position') return r.position_name;
          if (c.key === 'Candidate') return r.candidate_name;
          if (c.key === 'Votes') return r.vote_count;
          return '';
        })),
        startY: 28
      });
      doc.text('--- Exported from Online Voting System ---', 14, doc.lastAutoTable.finalY + 10);
      doc.save('voting_results.pdf');
      setSnackbar({ open: true, text: 'PDF exported successfully!', severity: 'success' });
      setExportDialog(false);
    } catch (err) {
      // Log error and show snackbar
      console.error('PDF export error:', err);
      setSnackbar({ open: true, text: 'PDF export failed. See console for details.', severity: 'error' });
    }
  };
  // Export chart as PNG
  const handleExportChart = async (id, name) => {
    const chartNode = document.getElementById(id);
    if (!chartNode) return;
    const canvas = await html2canvas(chartNode);
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}_chart.png`;
    a.click();
  };
  // Chart data toggle
  const getChartData = (candidates) => {
    if (chartDataMode === 'percent') {
      const total = candidates.reduce((sum, c) => sum + (c.vote_count || 0), 0);
      return candidates.map(c => ({ ...c, vote_count: total ? Math.round((c.vote_count / total) * 100) : 0 }));
    }
    return candidates;
  };
  // Audit log search/filter
  const [auditSearch, setAuditSearch] = useState('');
  const [auditPage, setAuditPage] = useState(0);
  const auditRowsPerPage = 10;
  const filteredAuditLog = auditLog.filter(log =>
    (log.action || '').toLowerCase().includes(auditSearch.toLowerCase()) ||
    (log.user || '').toLowerCase().includes(auditSearch.toLowerCase())
  );
  const pagedAuditLog = filteredAuditLog.slice(auditPage * auditRowsPerPage, (auditPage + 1) * auditRowsPerPage);
  const handleAuditExportCSV = () => {
    const header = 'Time,Action,User\n';
    const rows = filteredAuditLog.map(log => `${new Date(log.timestamp).toLocaleString()},${log.action},${log.user}`).join('\n');
    const csv = header + rows;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit_log.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Lock results
  // const handleLockResults = async () => {
  //   await supabase.from('voting_events').update({ locked: !locked }).eq('id', selectedEvent);
  //   setLocked(!locked);
  // };

  // Drilldown: show voters for candidate
  // const handleShowVoters = async (candidate) => {
  //   const { data } = await supabase.from('votes').select('student:student_id(full_name,matric_no)').eq('candidate_id', candidate.candidate_id).eq('voting_event_id', selectedEvent);
  //   setVoterModal({ open: true, candidate, voters: data?.map(v => v.student) || [] });
  // };

  // Group by position for charts
  const COLORS = ['#1976d2', '#388e3c', '#fbc02d', '#d32f2f', '#7b1fa2', '#0288d1', '#c2185b'];

  return (
    <React.Fragment>
      <Box
        sx={{
          width: '100vw',
          minWidth: '100vw',
          maxWidth: '100vw',
          mx: 0,
          px: 0,
          py: { xs: 1, sm: 2 },
          bgcolor: '#fff',
          borderRadius: 0,
          boxShadow: 'none',
          border: 'none',
          minHeight: 600,
          mt: 0,
          mb: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          position: 'relative',
        }}
      >
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
        {/* Premium summary bar - sticky below topbar, always visible, no overlay, respects sidebar */}
        <Box
          sx={{
            width: '100%',
            maxWidth: '100%',
            left: 'auto',
            right: 'auto',
            display: 'flex',
            justifyContent: { xs: 'flex-start', sm: 'center' },
            alignItems: 'center',
            gap: { xs: 1, sm: 3 },
            py: 1.2,
            background: '#f7fafd',
            borderBottom: '1.5px solid #e3eafc',
            position: 'sticky',
            top: 0,
            zIndex: 1101, // above content, below AppBar
            minHeight: 54,
            boxShadow: '0 2px 8px 0 rgba(144,202,249,0.07)',
            transition: 'background 0.3s, box-shadow 0.3s',
            mb: 2,
            px: { xs: 1, sm: 2 },
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
          }}
        >
          {summaryBarOptions.totalVotes && (
            <MuiTooltip title="Total number of votes cast" arrow>
              <Box sx={{ textAlign: 'center', minWidth: 70, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <HowToVoteIcon sx={{ color: 'primary.main', fontSize: 22, mb: 0.1 }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: 13 }}>Total Votes</Typography>
                <Typography variant="h6" color="primary.main" sx={{ fontWeight: 800, fontSize: 18 }}>{animatedVotes}</Typography>
              </Box>
            </MuiTooltip>
          )}
          {summaryBarOptions.turnout && (
            <MuiTooltip title="Turnout percentage" arrow>
              <Box sx={{ textAlign: 'center', minWidth: 70, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <CelebrationIcon sx={{ color: 'secondary.main', fontSize: 22, mb: 0.1 }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: 13 }}>Turnout</Typography>
                <Typography variant="h6" color="primary.main" sx={{ fontWeight: 800, fontSize: 18 }}>{animatedTurnout}%</Typography>
              </Box>
            </MuiTooltip>
          )}
          {summaryBarOptions.abstentions && (
            <MuiTooltip title="Number of abstentions" arrow>
              <Box sx={{ textAlign: 'center', minWidth: 70, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <InfoOutlinedIcon sx={{ color: 'info.main', fontSize: 22, mb: 0.1 }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: 13 }}>Abstentions</Typography>
                <Typography variant="h6" color="primary.main" sx={{ fontWeight: 800, fontSize: 18 }}>{animatedAbstentions}</Typography>
              </Box>
            </MuiTooltip>
          )}
          {summaryBarOptions.positions && (
            <MuiTooltip title="Total number of positions" arrow>
              <Box sx={{ textAlign: 'center', minWidth: 70, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.1 }}>
                  <Typography variant="caption" color="primary.main" sx={{ fontWeight: 900, fontSize: 15, pr: 0.5 }}>#</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: 13 }}>Positions</Typography>
                </Box>
                <Box sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="h6" color="primary.main" sx={{ fontWeight: 900, fontSize: 20, px: 1, borderRadius: 2, bgcolor: 'rgba(25,118,210,0.08)', boxShadow: '0 1px 4px 0 #e3eafc', letterSpacing: 1 }}>{isNaN(animatedPositions) ? '0' : String(animatedPositions)}</Typography>
                </Box>
              </Box>
            </MuiTooltip>
          )}
          <Button size="small" variant="outlined" sx={{ ml: 2 }} onClick={() => setSummaryBarOptions(opts => ({ ...opts, showMenu: !opts.showMenu }))}>Customize</Button>
          {summaryBarOptions.showMenu && (
            <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
              {Object.entries(summaryBarOptions).filter(([k]) => k !== 'showMenu').map(([key, val]) => (
                <FormControlLabel
                  key={key}
                  control={<Checkbox checked={val} onChange={e => setSummaryBarOptions(opts => ({ ...opts, [key]: e.target.checked }))} />}
                  label={key.charAt(0).toUpperCase() + key.slice(1)}
                />
              ))}
            </Box>
          )}
        </Box>
        {/* Spacer to prevent content being hidden under sticky summary bar */}
        <Box sx={{ height: { xs: 64, sm: 72 }, width: '100%' }} />
        <Box mb={2} sx={{
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 0.5, sm: 1.5 },
          flexWrap: 'wrap',
          justifyContent: { xs: 'flex-start', sm: 'flex-end' },
          px: { xs: 0, sm: 1 },
        }}>
          <ToggleButtonGroup value={chartType} exclusive onChange={(_, v) => v && setChartType(v)} size="small" aria-label="Chart Type">
            <ToggleButton value="bar" aria-label="Bar Chart">Bar</ToggleButton>
            <ToggleButton value="pie" aria-label="Pie Chart">Pie</ToggleButton>
          </ToggleButtonGroup>
          <ToggleButtonGroup value={chartDataMode} exclusive onChange={(_, v) => v && setChartDataMode(v)} size="small" aria-label="Chart Data Mode">
            <ToggleButton value="count" aria-label="Vote Count">Count</ToggleButton>
            <ToggleButton value="percent" aria-label="Percentage">%</ToggleButton>
          </ToggleButtonGroup>
          <MuiTooltip title="Export/Print Options"><IconButton onClick={handleExportDialogOpen}><FileDownloadIcon /></IconButton></MuiTooltip>
          <MuiTooltip title="Export as PDF"><IconButton onClick={handleExportPDF}><PictureAsPdfIcon /></IconButton></MuiTooltip>
          <MuiTooltip title="Export as Excel"><IconButton onClick={handleExportExcel}><TableChartIcon /></IconButton></MuiTooltip>
          <MuiTooltip title="Print Results"><IconButton onClick={handlePrint}><PrintIcon /></IconButton></MuiTooltip>
          <MuiTooltip title="Show Audit Log"><IconButton onClick={() => setAuditOpen(v => !v)}><HistoryIcon /></IconButton></MuiTooltip>
        </Box>
        {/* Export dialog for column selection (custom Modal, improved accessibility and mobile) */}
        <Modal open={exportDialog} onClose={handleExportDialogClose} aria-labelledby="export-dialog-title">
          <Box sx={{
            position: 'absolute',
            top: { xs: '10%', sm: '50%' },
            left: '50%',
            transform: { xs: 'translate(-50%, 0)', sm: 'translate(-50%, -50%)' },
            bgcolor: 'background.paper',
            p: { xs: 2, sm: 4 },
            borderRadius: 2,
            minWidth: { xs: 260, sm: 320 },
            width: { xs: '90vw', sm: 'auto' },
            boxShadow: 24
          }}>
            <Typography id="export-dialog-title" variant="h6" mb={2} sx={{ fontWeight: 700 }}>Export Columns</Typography>
            <FormGroup>
              {exportableCols.map(col => (
                <FormControlLabel
                  key={col.key}
                  control={<Checkbox checked={exportCols[col.key]} onChange={e => setExportCols(c => ({ ...c, [col.key]: e.target.checked }))} inputProps={{ 'aria-label': `Toggle export of ${col.label}` }} />}
                  label={col.label}
                />
              ))}
            </FormGroup>
            <Box mt={2} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: { xs: 'center', sm: 'flex-end' } }}>
              <Button onClick={handleExportCSV} variant="contained" color="primary">Export CSV</Button>
              <Button onClick={handleExportExcel} variant="contained" color="success">Export Excel</Button>
              <Button onClick={handleExportPDF} variant="contained" color="secondary">Export PDF</Button>
              <Button onClick={handleExportDialogClose} variant="outlined">Cancel</Button>
            </Box>
          </Box>
        </Modal>
        <Collapse in={auditOpen} sx={{ mb: 2 }}>
          <Card variant="outlined"><CardContent>
            <Typography variant="subtitle1" mb={1}>Audit Log</Typography>
            <Box mb={1} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField size="small" label="Search" value={auditSearch} onChange={e => setAuditSearch(e.target.value)} sx={{ width: 180 }} />
              <Button onClick={handleAuditExportCSV} size="small" variant="outlined">Export CSV</Button>
            </Box>
            {pagedAuditLog.length === 0 ? <Typography>No audit records.</Typography> : (
              <Table size="small"><TableHead><TableRow><TableCell>Time</TableCell><TableCell>Action</TableCell><TableCell>User</TableCell></TableRow></TableHead><TableBody>{pagedAuditLog.map((log, i) => <TableRow key={i}><TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell><TableCell>{log.action}</TableCell><TableCell>{log.user}</TableCell></TableRow>)}</TableBody></Table>
            )}
            {/* Pagination */}
            <Box mt={1} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Button size="small" disabled={auditPage === 0} onClick={() => setAuditPage(p => Math.max(0, p - 1))}>Prev</Button>
              <Typography variant="caption">Page {auditPage + 1} / {Math.ceil(filteredAuditLog.length / auditRowsPerPage) || 1}</Typography>
              <Button size="small" disabled={(auditPage + 1) * auditRowsPerPage >= filteredAuditLog.length} onClick={() => setAuditPage(p => p + 1)}>Next</Button>
            </Box>
          </CardContent></Card>
        </Collapse>
        <FormControl sx={{ minWidth: 240, mb: 3, mr: 2 }}>
          <InputLabel id="event-select-label">Voting Event</InputLabel>
          <Select
            labelId="event-select-label"
            value={selectedEvent}
            label="Voting Event"
            onChange={e => setSelectedEvent(e.target.value)}
            size="small"
          >
            {events.length === 0 && (
              <MenuItem disabled>
                <em>No voting events found.</em>
              </MenuItem>
            )}
            {events.map(event => (
              <MenuItem key={event.id} value={event.id}>
                {event.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="Search Results"
          variant="outlined"
          size="small"
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ mb: 3, width: { xs: '100%', sm: 300 } }}
        />
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer component={Paper} sx={{ mb: 3, width: '100vw', minWidth: '100vw', maxWidth: '100vw', overflowX: 'auto', borderRadius: 2, boxShadow: '0 1.5px 6px 0 rgba(33,150,243,0.06)', position: 'relative' }}>
              <Table size="small" stickyHeader aria-label="Voting Results Table" sx={{ minWidth: 520, width: '100vw' }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f7fafd', position: 'sticky', top: 0, zIndex: 1 }}>
                    <TableCell sx={{ fontWeight: 700 }}>Position</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Candidate</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Votes</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredResults.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">No results available.</TableCell>
                    </TableRow>
                  ) : (
                    pagedResults.map((row, idx) => (
                      <TableRow
                        key={idx}
                        hover
                        tabIndex={0}
                        sx={{
                          background: row.is_winner
                            ? 'rgba(56, 142, 60, 0.10)'
                            : idx % 2 === 0
                              ? 'rgba(144,202,249,0.05)'
                              : 'inherit',
                          transition: 'background 0.2s',
                        }}
                      >
                        <TableCell>{row.position_name}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {row.candidate_name}
                            {row.is_winner && (
                              <MuiTooltip title="Winner" arrow>
                                <span style={{ color: '#388e3c', fontWeight: 700, marginLeft: 8, display: 'inline-flex', alignItems: 'center' }}>
                                  {/* Trophy icon SVG */}
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 4V2a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v2H3a1 1 0 0 0-1 1v2c0 3.53 2.61 6.43 6 6.92V17H6a1 1 0 0 0 0 2h12a1 1 0 0 0 0-2h-2v-3.08c3.39-.49 6-3.39 6-6.92V5a1 1 0 0 0-1-1h-4zm-8 0V3h8v1H9zm11 2v1c0 2.93-2.13 5.36-5 5.91V17h-4v-4.09C6.13 12.36 4 9.93 4 7V6h16zm-8 15a3 3 0 0 0 3-3h-6a3 3 0 0 0 3 3z" fill="#388e3c"/></svg>
                                </span>
                              </MuiTooltip>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>{row.vote_count}</TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">—</Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {loading && (
                <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100%', bgcolor: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                  <CircularProgress />
                </Box>
              )}
            </TableContainer>
            {/* Pagination for results table */}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: { xs: 'center', sm: 'flex-end' }, mb: 2, width: '100vw', px: 2 }}>
              <Button size="small" disabled={resultsPage === 0} onClick={() => setResultsPage(p => Math.max(0, p - 1))}>Prev</Button>
              <Typography variant="caption">Page {resultsPage + 1} / {Math.ceil(filteredResults.length / resultsRowsPerPage) || 1}</Typography>
              <Button size="small" disabled={(resultsPage + 1) * resultsRowsPerPage >= filteredResults.length} onClick={() => setResultsPage(p => p + 1)}>Next</Button>
            </Box>
        {/* Manual correction dialog removed to prevent admin manipulation */}
        {/* Print Preview Modal */}
        <Modal open={printPreviewOpen} onClose={handlePrintPreviewClose} aria-labelledby="print-preview-title">
          <Box sx={{
            position: 'absolute',
            top: { xs: '2%', sm: '5%' },
            left: '50%',
            transform: 'translateX(-50%)',
            width: { xs: '98vw', sm: '90vw' },
            maxWidth: 900,
            bgcolor: 'background.paper',
            p: { xs: 2, sm: 4 },
            borderRadius: 3,
            maxHeight: '92vh',
            overflow: 'auto',
            boxShadow: '0 6px 32px 0 rgba(25, 118, 210, 0.10)',
            border: '1.5px solid #e3eafc',
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
              <img src={BRAND.logo} alt="Logo" style={{ height: 38, marginRight: 12, borderRadius: 6, boxShadow: '0 2px 8px #e3eafc' }} />
              <Box>
                <Typography id="print-preview-title" variant="h5" sx={{ fontWeight: 800, color: 'primary.main', letterSpacing: 0.5 }}>Print Preview</Typography>
                <Typography variant="subtitle2" color="text.secondary">{BRAND.name} - {events.find(e=>e.id===selectedEvent)?.name || ''}</Typography>
              </Box>
              <Typography variant="body2" sx={{ ml: 'auto', color: 'text.secondary', fontWeight: 500 }}>{new Date().toLocaleString()}</Typography>
            </Box>
            {Object.entries(grouped).map(([position, candidates]) => (
              <Box key={position} sx={{ pageBreakAfter: 'always', mb: 4, borderBottom: '1.5px dashed #e3eafc', borderRadius: 2, bgcolor: 'rgba(144,202,249,0.04)', p: { xs: 1, sm: 2 } }}>
                <Typography variant="h6" mb={1} sx={{ fontWeight: 700, color: 'primary.main', letterSpacing: 0.2 }}>{position} <span style={{ color: '#bdbdbd', fontWeight: 400, fontSize: 15 }}>– Vote Distribution</span></Typography>
                <Table size="small" sx={{ minWidth: 320 }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f7fafd' }}>
                      <TableCell sx={{ fontWeight: 700, color: 'primary.main', fontSize: 15 }}>Candidate</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'primary.main', fontSize: 15 }}>Votes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {candidates.map((row, i) => (
                      <TableRow key={i} sx={{ background: i % 2 === 0 ? 'rgba(144,202,249,0.07)' : 'inherit' }}>
                        <TableCell sx={{ fontWeight: row.is_winner ? 700 : 500, color: row.is_winner ? '#388e3c' : 'inherit' }}>{row.candidate_name}{row.is_winner && (
                          <span style={{ marginLeft: 8, verticalAlign: 'middle' }} title="Winner">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 4V2a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v2H3a1 1 0 0 0-1 1v2c0 3.53 2.61 6.43 6 6.92V17H6a1 1 0 0 0 0 2h12a1 1 0 0 0 0-2h-2v-3.08c3.39-.49 6-3.39 6-6.92V5a1 1 0 0 0-1-1h-4zm-8 0V3h8v1H9zm11 2v1c0 2.93-2.13 5.36-5 5.91V17h-4v-4.09C6.13 12.36 4 9.93 4 7V6h16zm-8 15a3 3 0 0 0 3-3h-6a3 3 0 0 0 3 3z" fill="#388e3c"/></svg>
                          </span>
                        )}</TableCell>
                        <TableCell sx={{ fontWeight: row.is_winner ? 700 : 500, color: row.is_winner ? '#388e3c' : 'inherit' }}>{row.vote_count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            ))}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button variant="contained" color="primary" sx={{ fontWeight: 700, px: 3, py: 1, borderRadius: 2, boxShadow: '0 2px 8px #e3eafc' }} onClick={() => { setPrintPreviewOpen(false); setTimeout(() => window.print(), 300); }}>Print</Button>
            </Box>
          </Box>
        </Modal>
            {/* Charts per position */}
            {Object.entries(grouped).map(([position, candidates], chartIdx) => {
              const chartId = `chart-bar-${chartIdx}`;
              const pieId = `chart-pie-${chartIdx}`;
              const chartData = getChartData(candidates);
              return (
                <Box key={position} mb={5}>
                  <Typography variant="h6" mb={1}>{position} - Vote Distribution</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <Button size="small" onClick={() => handleExportChart(chartId, position)}>Export Bar Chart</Button>
                    <Button size="small" onClick={() => handleExportChart(pieId, position + '_pie')}>Export Pie Chart</Button>
                  </Box>
                  <div id={chartId} tabIndex={0} aria-label={`Bar chart for ${position}`}> {/* for html2canvas */}
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <XAxis dataKey="candidate_name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="vote_count" fill="#1976d2">
                          {chartData.map((entry, i) => (
                            <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div id={pieId} tabIndex={0} aria-label={`Pie chart for ${position}`}> {/* for html2canvas */}
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={chartData}
                          dataKey="vote_count"
                          nameKey="candidate_name"
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          label
                        >
                          {chartData.map((entry, i) => (
                            <Cell key={`cell-pie-${i}`} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Box>
              );
            })}
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
    </React.Fragment>
  );
}
