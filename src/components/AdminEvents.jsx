
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Snackbar,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { supabase } from '../supabaseClient';


export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentEvent, setCurrentEvent] = useState({ id: null, name: '', start_time: '', end_time: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const [deleteId, setDeleteId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Advanced filtering and server-side pagination
  const [filter, setFilter] = useState({ name: '', start_time: '', end_time: '' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => { fetchEvents(); /* eslint-disable-next-line */ }, [page, rowsPerPage, filter]);

  const fetchEvents = async () => {
    setLoading(true);
    let query = supabase.from('voting_events').select('*', { count: 'exact' });
    if (filter.name) query = query.ilike('name', `%${filter.name}%`);
    if (filter.start_time) query = query.gte('start_time', filter.start_time);
    if (filter.end_time) query = query.lte('end_time', filter.end_time);
    // Server-side pagination
    const from = page * rowsPerPage;
    const to = from + rowsPerPage - 1;
    query = query.range(from, to);
    const { data, error, count } = await query;
    if (!error) {
      setEvents(data || []);
      setTotalCount(count || 0);
    }
    setLoading(false);
  };

  const handleOpenDialog = (event = { id: null, name: '', start_time: '', end_time: '' }) => {
    setCurrentEvent(event);
    setEditMode(!!event.id);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentEvent({ id: null, name: '', start_time: '', end_time: '' });
    setEditMode(false);
  };

  const handleSave = async () => {
    if (!currentEvent.name.trim() || !currentEvent.start_time || !currentEvent.end_time) {
      setSnackbar({ open: true, message: 'All fields are required.' });
      return;
    }
    setLoading(true);
    if (editMode) {
      const { error } = await supabase
        .from('voting_events')
        .update({
          name: currentEvent.name,
          start_time: currentEvent.start_time,
          end_time: currentEvent.end_time
        })
        .eq('id', currentEvent.id);
      if (!error) setSnackbar({ open: true, message: 'Event updated.' });
    } else {
      const { error } = await supabase
        .from('voting_events')
        .insert([{ name: currentEvent.name, start_time: currentEvent.start_time, end_time: currentEvent.end_time }]);
      if (!error) setSnackbar({ open: true, message: 'Event added.' });
    }
    handleCloseDialog();
    fetchEvents();
    setLoading(false);
  };

  const handleDelete = async () => {
    setLoading(true);
    const { error } = await supabase.from('voting_events').delete().eq('id', deleteId);
    if (!error) setSnackbar({ open: true, message: 'Event deleted.' });
    setDeleteId(null);
    setConfirmDelete(false);
    fetchEvents();
    setLoading(false);
  };

  // No client-side filtering/pagination; use server data

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', width: '100%', p: { xs: 1, sm: 3 } }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h5">Voting Events</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>Add Event</Button>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Name"
          size="small"
          value={filter.name}
          onChange={e => { setFilter(f => ({ ...f, name: e.target.value })); setPage(0); }}
          sx={{ minWidth: 120 }}
        />
        <TextField
          label="Start After"
          type="datetime-local"
          size="small"
          value={filter.start_time}
          onChange={e => { setFilter(f => ({ ...f, start_time: e.target.value })); setPage(0); }}
          sx={{ minWidth: 160 }}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="End Before"
          type="datetime-local"
          size="small"
          value={filter.end_time}
          onChange={e => { setFilter(f => ({ ...f, end_time: e.target.value })); setPage(0); }}
          sx={{ minWidth: 160 }}
          InputLabelProps={{ shrink: true }}
        />
      </Box>
      <TableContainer component={Paper} sx={{ minHeight: 240 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Start</TableCell>
              <TableCell>End</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} align="center">Loading...</TableCell></TableRow>
            ) : events.length === 0 ? (
              <TableRow><TableCell colSpan={4} align="center">No events found.</TableCell></TableRow>
            ) : events.map(ev => (
              <TableRow key={ev.id} hover>
                <TableCell>{ev.name}</TableCell>
                <TableCell>{ev.start_time}</TableCell>
                <TableCell>{ev.end_time}</TableCell>
                <TableCell align="right">
                  <IconButton color="primary" onClick={() => handleOpenDialog(ev)} size="small">
                    <EditIcon />
                  </IconButton>
                  <IconButton color="error" onClick={() => { setDeleteId(ev.id); setConfirmDelete(true); }} size="small">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {/* Pagination */}
      <Box display="flex" justifyContent="flex-end" alignItems="center" mt={1} gap={2}>
        <Typography variant="body2">Rows per page:</Typography>
        <TextField
          select
          size="small"
          value={rowsPerPage}
          onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
          SelectProps={{ native: true }}
          sx={{ width: 80 }}
        >
          {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
        </TextField>
        <Button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Prev</Button>
        <Typography variant="body2">{page + 1} / {Math.max(1, Math.ceil(totalCount / rowsPerPage))}</Typography>
        <Button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * rowsPerPage >= totalCount}>Next</Button>
      </Box>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="xs" fullWidth>
        <DialogTitle>{editMode ? 'Edit Event' : 'Add Event'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Event Name"
            type="text"
            fullWidth
            value={currentEvent.name}
            onChange={e => setCurrentEvent({ ...currentEvent, name: e.target.value })}
            disabled={loading}
          />
          <TextField
            margin="dense"
            label="Start Time"
            type="datetime-local"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={currentEvent.start_time}
            onChange={e => setCurrentEvent({ ...currentEvent, start_time: e.target.value })}
            disabled={loading}
          />
          <TextField
            margin="dense"
            label="End Time"
            type="datetime-local"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={currentEvent.end_time}
            onChange={e => setCurrentEvent({ ...currentEvent, end_time: e.target.value })}
            disabled={loading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={loading}>{editMode ? 'Update' : 'Add'}</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)} maxWidth="xs">
        <DialogTitle>Delete Event?</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this event?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)} disabled={loading}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={loading}>Delete</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Box>
  );
}
