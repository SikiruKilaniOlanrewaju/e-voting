
import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { supabase } from '../supabaseClient';


export default function AdminPositions() {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentPosition, setCurrentPosition] = useState({ id: null, name: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const [deleteId, setDeleteId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Advanced filtering and server-side pagination
  const [filter, setFilter] = useState({ name: '' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchPositions();
    // eslint-disable-next-line
  }, [page, rowsPerPage, filter]);

  const fetchPositions = async () => {
    setLoading(true);
    let query = supabase.from('positions').select('*', { count: 'exact' });
    if (filter.name) query = query.ilike('name', `%${filter.name}%`);
    // Server-side pagination
    const from = page * rowsPerPage;
    const to = from + rowsPerPage - 1;
    query = query.range(from, to);
    const { data, error, count } = await query;
    if (!error) {
      setPositions(data || []);
      setTotalCount(count || 0);
    }
    setLoading(false);
  };

  const handleOpenDialog = (position = { id: null, name: '' }) => {
    setCurrentPosition(position);
    setEditMode(!!position.id);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentPosition({ id: null, name: '' });
    setEditMode(false);
  };

  const handleSave = async () => {
    if (!currentPosition.name.trim()) {
      setSnackbar({ open: true, message: 'Position name is required.' });
      return;
    }
    setLoading(true);
    if (editMode) {
      // Update
      const { error } = await supabase
        .from('positions')
        .update({ name: currentPosition.name })
        .eq('id', currentPosition.id);
      if (!error) setSnackbar({ open: true, message: 'Position updated.' });
    } else {
      // Add
      const { error } = await supabase
        .from('positions')
        .insert([{ name: currentPosition.name }]);
      if (!error) setSnackbar({ open: true, message: 'Position added.' });
    }
    handleCloseDialog();
    fetchPositions();
    setLoading(false);
  };

  const handleDelete = async () => {
    setLoading(true);
    const { error } = await supabase.from('positions').delete().eq('id', deleteId);
    if (!error) setSnackbar({ open: true, message: 'Position deleted.' });
    setDeleteId(null);
    setConfirmDelete(false);
    fetchPositions();
    setLoading(false);
  };

  // No client-side filtering/pagination; use server data

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h5">Positions</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>Add Position</Button>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Name"
          size="small"
          value={filter.name}
          onChange={e => { setFilter(f => ({ ...f, name: e.target.value })); setPage(0); }}
          sx={{ minWidth: 220 }}
        />
      </Box>
      <TableContainer component={Paper} sx={{ minHeight: 240 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={3} align="center">Loading...</TableCell></TableRow>
            ) : positions.length === 0 ? (
              <TableRow><TableCell colSpan={3} align="center">No positions found.</TableCell></TableRow>
            ) : positions.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>{row.id}</TableCell>
                <TableCell>{row.name}</TableCell>
                <TableCell align="right">
                  <IconButton color="primary" onClick={() => handleOpenDialog(row)} size="small">
                    <EditIcon />
                  </IconButton>
                  <IconButton color="error" onClick={() => { setDeleteId(row.id); setConfirmDelete(true); }} size="small">
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
        <DialogTitle>{editMode ? 'Edit Position' : 'Add Position'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Position Name"
            type="text"
            fullWidth
            value={currentPosition.name}
            onChange={e => setCurrentPosition({ ...currentPosition, name: e.target.value })}
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
        <DialogTitle>Delete Position?</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this position?</Typography>
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
