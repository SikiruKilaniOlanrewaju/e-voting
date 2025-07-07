import React, { useEffect, useState } from 'react';
import { Box, Typography, Select, MenuItem, FormControl, InputLabel, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Button, TextField } from '@mui/material';
import { supabase } from '../supabaseClient';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

export default function AdminResults() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filteredResults, setFilteredResults] = useState([]);

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
      .rpc('get_voting_results', { event_id: selectedEvent })
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

  // Group by position for charts
  const grouped = filteredResults.reduce((acc, row) => {
    acc[row.position_name] = acc[row.position_name] || [];
    acc[row.position_name].push(row);
    return acc;
  }, {});

  const COLORS = ['#1976d2', '#388e3c', '#fbc02d', '#d32f2f', '#7b1fa2', '#0288d1', '#c2185b'];

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={2}>Voting Results</Typography>
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
      <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={handleExportCSV} sx={{ mb: 3 }}>
        Export CSV
      </Button>
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
          {Object.entries(grouped).map(([position, candidates], idx) => (
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
    </Box>
  );
}
