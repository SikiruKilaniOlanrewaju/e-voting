
import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Avatar, IconButton, Snackbar,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, InputLabel, FormControl, CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { supabase } from '../supabaseClient';


export default function AdminCandidates() {
  const [candidates, setCandidates] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentCandidate, setCurrentCandidate] = useState({ id: null, full_name: '', position_id: '', bio: '', photo_url: '' });
  const [photoFile, setPhotoFile] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const [deleteId, setDeleteId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  // Advanced filtering and server-side pagination
  const [filter, setFilter] = useState({ full_name: '', position_id: '', bio: '' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchCandidates();
    fetchPositions();
    // eslint-disable-next-line
  }, [page, rowsPerPage, filter]);

  const fetchCandidates = async () => {
    setLoading(true);
    let query = supabase.from('candidates').select('*', { count: 'exact' });
    if (filter.full_name) query = query.ilike('full_name', `%${filter.full_name}%`);
    if (filter.position_id) query = query.eq('position_id', filter.position_id);
    if (filter.bio) query = query.ilike('bio', `%${filter.bio}%`);
    // Server-side pagination
    const from = page * rowsPerPage;
    const to = from + rowsPerPage - 1;
    query = query.range(from, to);
    const { data, error, count } = await query;
    if (!error) {
      setCandidates(data || []);
      setTotalCount(count || 0);
    }
    setLoading(false);
  };

  const fetchPositions = async () => {
    const { data, error } = await supabase.from('positions').select('*');
    if (!error) setPositions(data || []);
  };

  const handleOpenDialog = (candidate = { id: null, full_name: '', position_id: '', bio: '', photo_url: '' }) => {
    setCurrentCandidate(candidate);
    setEditMode(!!candidate.id);
    setPhotoFile(null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentCandidate({ id: null, full_name: '', position_id: '', bio: '', photo_url: '' });
    setEditMode(false);
    setPhotoFile(null);
  };

  const handleSave = async () => {
    if (!currentCandidate.full_name.trim() || !currentCandidate.position_id) {
      setSnackbar({ open: true, message: 'Full name and position are required.' });
      return;
    }
    setLoading(true);
    let photo_url = currentCandidate.photo_url;
    // Handle photo upload if a new file is selected
    if (photoFile) {
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage.from('candidate-photos').upload(fileName, photoFile);
      if (!uploadError && uploadData) {
        const { data: publicUrlData } = supabase.storage.from('candidate-photos').getPublicUrl(fileName);
        photo_url = publicUrlData?.publicUrl || '';
      } else {
        setSnackbar({ open: true, message: `Photo upload failed: ${uploadError?.message || ''}` });
        setLoading(false);
        return;
      }
    }
    if (editMode) {
      // Update
      const { error } = await supabase
        .from('candidates')
        .update({
          full_name: currentCandidate.full_name,
          position_id: currentCandidate.position_id,
          bio: currentCandidate.bio,
          photo_url
        })
        .eq('id', currentCandidate.id);
      if (error) {
        setSnackbar({ open: true, message: `Update failed: ${error.message}` });
        setLoading(false);
        return;
      } else {
        setSnackbar({ open: true, message: 'Candidate updated.' });
      }
    } else {
      // Add (omit id field if present)
      const candidateToInsert = { ...currentCandidate, photo_url };
      delete candidateToInsert.id;
      const { error } = await supabase
        .from('candidates')
        .insert([candidateToInsert]);
      if (error) {
        setSnackbar({ open: true, message: `Add failed: ${error.message}` });
        setLoading(false);
        return;
      } else {
        setSnackbar({ open: true, message: 'Candidate added.' });
      }
    }
    handleCloseDialog();
    fetchCandidates();
    setLoading(false);
  };

  const handleDelete = async () => {
    setLoading(true);
    const { error } = await supabase.from('candidates').delete().eq('id', deleteId);
    if (!error) setSnackbar({ open: true, message: 'Candidate deleted.' });
    setDeleteId(null);
    setConfirmDelete(false);
    fetchCandidates();
    setLoading(false);
  };

  // No client-side filtering/pagination; use server data

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', width: '100%', p: { xs: 1, sm: 3 } }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h5">Candidates</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>Add Candidate</Button>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Full Name"
          size="small"
          value={filter.full_name}
          onChange={e => { setFilter(f => ({ ...f, full_name: e.target.value })); setPage(0); }}
          sx={{ minWidth: 160 }}
        />
        <TextField
          label="Bio"
          size="small"
          value={filter.bio}
          onChange={e => { setFilter(f => ({ ...f, bio: e.target.value })); setPage(0); }}
          sx={{ minWidth: 120 }}
        />
        <TextField
          select
          label="Position"
          size="small"
          value={filter.position_id}
          onChange={e => { setFilter(f => ({ ...f, position_id: e.target.value })); setPage(0); }}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="">All</MenuItem>
          {positions.map(pos => (
            <MenuItem key={pos.id} value={pos.id}>{pos.name}</MenuItem>
          ))}
        </TextField>
      </Box>
      <TableContainer component={Paper} sx={{ minHeight: 320 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Photo</TableCell>
              <TableCell>Full Name</TableCell>
              <TableCell>Position</TableCell>
              <TableCell>Bio</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} align="center">Loading...</TableCell></TableRow>
            ) : candidates.length === 0 ? (
              <TableRow><TableCell colSpan={5} align="center">No candidates found.</TableCell></TableRow>
            ) : candidates.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>
                  {row.photo_url ? <Avatar src={row.photo_url} alt={row.full_name} /> : null}
                </TableCell>
                <TableCell>{row.full_name}</TableCell>
                <TableCell>{positions.find(p => p.id === row.position_id)?.name || row.position_id}</TableCell>
                <TableCell>{row.bio}</TableCell>
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
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Edit Candidate' : 'Add Candidate'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Full Name"
            type="text"
            fullWidth
            value={currentCandidate.full_name}
            onChange={e => setCurrentCandidate({ ...currentCandidate, full_name: e.target.value })}
            disabled={loading}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel id="position-label">Position</InputLabel>
            <Select
              labelId="position-label"
              value={currentCandidate.position_id}
              label="Position"
              onChange={e => setCurrentCandidate({ ...currentCandidate, position_id: e.target.value })}
              disabled={loading}
            >
              {positions.map(pos => (
                <MenuItem key={pos.id} value={pos.id}>{pos.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Bio"
            type="text"
            fullWidth
            multiline
            minRows={2}
            value={currentCandidate.bio}
            onChange={e => setCurrentCandidate({ ...currentCandidate, bio: e.target.value })}
            disabled={loading}
          />
          <Box mt={2}>
            <Button
              variant="outlined"
              component="label"
              disabled={loading}
            >
              {photoFile ? 'Photo Selected' : 'Upload Photo'}
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={e => setPhotoFile(e.target.files[0])}
              />
            </Button>
            {currentCandidate.photo_url && !photoFile && (
              <Avatar src={currentCandidate.photo_url} alt={currentCandidate.full_name} sx={{ ml: 2, display: 'inline-flex' }} />
            )}
            {photoFile && (
              <Typography variant="caption" sx={{ ml: 2 }}>{photoFile.name}</Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={loading}>{editMode ? 'Update' : 'Add'}</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)} maxWidth="xs">
        <DialogTitle>Delete Candidate?</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this candidate?</Typography>
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
      {loading && <Box display="flex" justifyContent="center" mt={2}><CircularProgress size={28} /></Box>}
    </Box>
  );
}
