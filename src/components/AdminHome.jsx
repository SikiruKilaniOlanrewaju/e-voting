import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Paper } from '@mui/material';
import { supabase } from '../supabaseClient';

export default function AdminHome() {
  const [stats, setStats] = useState({ students: 0, events: 0, positions: 0, candidates: 0 });

  useEffect(() => {
    async function fetchStats() {
      const [{ count: students }, { count: events }, { count: positions }, { count: candidates }] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }),
        supabase.from('voting_events').select('*', { count: 'exact', head: true }),
        supabase.from('positions').select('*', { count: 'exact', head: true }),
        supabase.from('candidates').select('*', { count: 'exact', head: true }),
      ]);
      setStats({
        students: students || 0,
        events: events || 0,
        positions: positions || 0,
        candidates: candidates || 0,
      });
    }
    fetchStats();
  }, []);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Dashboard Overview</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">Students</Typography>
            <Typography variant="h4">{stats.students}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">Events</Typography>
            <Typography variant="h4">{stats.events}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">Positions</Typography>
            <Typography variant="h4">{stats.positions}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">Candidates</Typography>
            <Typography variant="h4">{stats.candidates}</Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
