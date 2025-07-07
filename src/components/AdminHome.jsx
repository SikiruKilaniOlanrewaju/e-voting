import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Paper, Avatar, Fade, Card, CardContent } from '@mui/material';
import { supabase } from '../supabaseClient';
import PeopleIcon from '@mui/icons-material/People';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

const statCards = [
  { label: 'Students', icon: <PeopleIcon fontSize="large" />, color: 'linear-gradient(135deg, #1976d2 60%, #42a5f5 100%)', key: 'students' },
  { label: 'Events', icon: <HowToVoteIcon fontSize="large" />, color: 'linear-gradient(135deg, #388e3c 60%, #66bb6a 100%)', key: 'events' },
  { label: 'Positions', icon: <AssignmentIndIcon fontSize="large" />, color: 'linear-gradient(135deg, #fbc02d 60%, #fff176 100%)', key: 'positions' },
  { label: 'Candidates', icon: <EmojiEventsIcon fontSize="large" />, color: 'linear-gradient(135deg, #d32f2f 60%, #e57373 100%)', key: 'candidates' },
];

export default function AdminHome() {
  const [stats, setStats] = useState({ students: 0, events: 0, positions: 0, candidates: 0 });
  const [loading, setLoading] = useState(true);

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
      setLoading(false);
    }
    fetchStats();
  }, []);

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', width: '100%', p: { xs: 1, sm: 3 } }}>
      <Box display="flex" alignItems="center" mb={4}>
        <Avatar sx={{ bgcolor: '#1976d2', width: 56, height: 56, fontWeight: 700, mr: 2 }}>AD</Avatar>
        <Box>
          <Typography variant="h4" fontWeight={800} color="primary.main">Welcome, Admin</Typography>
          <Typography variant="subtitle1" color="text.secondary">Here is a quick summary of your voting system.</Typography>
        </Box>
      </Box>
      <Grid container spacing={3} sx={{ width: '100%', maxWidth: '100%', margin: 0 }}>
        {statCards.map((card, i) => (
          <Grid item xs={12} sm={6} md={3} key={card.key}>
            <Fade in timeout={600 + i * 200}>
              <Card sx={{
                p: 0,
                borderRadius: 3,
                boxShadow: 3,
                background: card.color,
                color: '#fff',
                minHeight: 140,
                position: 'relative',
                overflow: 'visible',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-6px) scale(1.03)', boxShadow: 6 },
              }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.18)', width: 56, height: 56, mb: 1 }}>{card.icon}</Avatar>
                  <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: 1 }}>{card.label}</Typography>
                  <Typography variant="h3" fontWeight={900} sx={{ mt: 1 }}>{loading ? '...' : stats[card.key]}</Typography>
                </CardContent>
              </Card>
            </Fade>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
