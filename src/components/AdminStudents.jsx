
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, Snackbar, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { supabase } from '../supabaseClient';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentStudent, setCurrentStudent] = useState({ id: null, matric_no: '', full_name: '', email: '', phone: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const [deleteId, setDeleteId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  // Advanced filtering state
  const [filter, setFilter] = useState({ matric_no: '', full_name: '', email: '', phone: '' });
  // Server-side pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line
  }, [page, rowsPerPage, filter]);

  const fetchStudents = async () => {
    setLoading(true);
    // Build filter query
    let query = supabase.from('students').select('*', { count: 'exact' });
    if (filter.matric_no) query = query.ilike('matric_no', `%${filter.matric_no}%`);
    if (filter.full_name) query = query.ilike('full_name', `%${filter.full_name}%`);
    if (filter.email) query = query.ilike('email', `%${filter.email}%`);
    if (filter.phone) query = query.ilike('phone', `%${filter.phone}%`);
    // Server-side pagination
    const from = page * rowsPerPage;
    const to = from + rowsPerPage - 1;
    query = query.range(from, to);
    const { data, error, count } = await query;
    if (!error) {
      setStudents(data || []);
      setTotalCount(count || 0);
    }
    setLoading(false);
  };
  // Dialog handlers
  const handleOpenDialog = (student = { id: null, matric_no: '', full_name: '', email: '', phone: '' }) => {
    setCurrentStudent(student);
    setEditMode(!!student.id);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentStudent({ id: null, matric_no: '', full_name: '', email: '', phone: '' });
    setEditMode(false);
  };

  // Save handler
  const handleSave = async () => {
    if (!currentStudent.matric_no.trim() || !currentStudent.full_name.trim() || !currentStudent.email.trim()) {
      setSnackbar({ open: true, message: 'Matric number, full name, and email are required.' });
      return;
    }
    setLoading(true);
    if (editMode) {
      // Update
      const { error } = await supabase
        .from('students')
        .update({
          matric_no: currentStudent.matric_no,
          full_name: currentStudent.full_name,
          email: currentStudent.email,
          phone: currentStudent.phone
        })
        .eq('id', currentStudent.id);
      if (error) {
        setSnackbar({ open: true, message: `Update failed: ${error.message}` });
        setLoading(false);
        return;
      } else {
        setSnackbar({ open: true, message: 'Student updated.' });
      }
    } else {
      // Add (omit id field if present)
      const studentToInsert = { ...currentStudent };
      delete studentToInsert.id;
      const { error } = await supabase
        .from('students')
        .insert([studentToInsert]);
      if (error) {
        setSnackbar({ open: true, message: `Add failed: ${error.message}` });
        setLoading(false);
        return;
      } else {
        setSnackbar({ open: true, message: 'Student added.' });
      }
    }
    handleCloseDialog();
    fetchStudents();
    setLoading(false);
  };

  // Delete handler
  const handleDelete = async () => {
    setLoading(true);
    const { error } = await supabase.from('students').delete().eq('id', deleteId);
    if (!error) setSnackbar({ open: true, message: 'Student deleted.' });
    setDeleteId(null);
    setConfirmDelete(false);
    fetchStudents();
    setLoading(false);
  };

  // CSV handlers and sample export
  const handleCsvChange = (e) => {
    setCsvFile(e.target.files[0]);
  };
  const handleImportCsv = () => {
    // Implement CSV import logic here
    setSnackbar({ open: true, message: 'CSV import not implemented.' });
  };

  // Sample CSV download
  const handleDownloadSampleCsv = () => {
    const sample = [
      ['matric_no', 'full_name', 'email', 'phone'],
      ['ND/230001', 'Jane Doe', 'jane.doe@email.com', '+2348012345678'],
      ['HND/230001', 'John Smith', 'john.smith@email.com', '+2348098765432']
    ];
    const csv = sample.map(row => row.map(field => `"${field}"`).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students-sample.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h5">Students</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>Add Student</Button>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Matric No."
          size="small"
          value={filter.matric_no}
          onChange={e => { setFilter(f => ({ ...f, matric_no: e.target.value })); setPage(0); }}
          sx={{ minWidth: 120 }}
        />
        <TextField
          label="Full Name"
          size="small"
          value={filter.full_name}
          onChange={e => { setFilter(f => ({ ...f, full_name: e.target.value })); setPage(0); }}
          sx={{ minWidth: 120 }}
        />
        <TextField
          label="Email"
          size="small"
          value={filter.email}
          onChange={e => { setFilter(f => ({ ...f, email: e.target.value })); setPage(0); }}
          sx={{ minWidth: 120 }}
        />
        <TextField
          label="Phone"
          size="small"
          value={filter.phone}
          onChange={e => { setFilter(f => ({ ...f, phone: e.target.value })); setPage(0); }}
          sx={{ minWidth: 120 }}
        />
        <Button variant="contained" component="label" startIcon={<CloudUploadIcon />}>
          Import CSV
          <input type="file" accept=".csv" hidden onChange={handleCsvChange} />
        </Button>
        <Button variant="outlined" onClick={handleImportCsv} disabled={!csvFile}>Upload</Button>
        <Button variant="text" onClick={handleDownloadSampleCsv} sx={{ ml: 1 }}>
          Download Sample CSV
        </Button>
      </Box>
      <TableContainer component={Paper} sx={{ minHeight: 320 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Matric Number</TableCell>
              <TableCell>Full Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} align="center">Loading...</TableCell></TableRow>
            ) : students.length === 0 ? (
              <TableRow><TableCell colSpan={5} align="center">No students found.</TableCell></TableRow>
            ) : students.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>{row.matric_no}</TableCell>
                <TableCell>{row.full_name}</TableCell>
                <TableCell>{row.email}</TableCell>
                <TableCell>{row.phone}</TableCell>
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
        <DialogTitle>{editMode ? 'Edit Student' : 'Add Student'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Matric Number"
            type="text"
            fullWidth
            value={currentStudent.matric_no}
            onChange={e => setCurrentStudent({ ...currentStudent, matric_no: e.target.value })}
            disabled={loading}
          />
          <TextField
            margin="dense"
            label="Full Name"
            type="text"
            fullWidth
            value={currentStudent.full_name}
            onChange={e => setCurrentStudent({ ...currentStudent, full_name: e.target.value })}
            disabled={loading}
          />
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            value={currentStudent.email}
            onChange={e => setCurrentStudent({ ...currentStudent, email: e.target.value })}
            disabled={loading}
          />
          <TextField
            margin="dense"
            label="Phone (E.164 format)"
            type="text"
            fullWidth
            value={currentStudent.phone}
            onChange={e => setCurrentStudent({ ...currentStudent, phone: e.target.value })}
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
        <DialogTitle>Delete Student?</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this student?</Typography>
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

export default AdminStudents;
