import React from 'react';
import { Box, CssBaseline, Drawer, AppBar, Toolbar, Typography, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import LogoutIcon from '@mui/icons-material/Logout';

const drawerWidth = 220;

const navItems = [
  { label: 'Dashboard', icon: <HowToVoteIcon />, key: 'home' },
  { label: 'Students', icon: <PeopleIcon />, key: 'students' },
  { label: 'Candidates', icon: <AssignmentIndIcon />, key: 'candidates' },
  { label: 'Voting Events', icon: <HowToVoteIcon />, key: 'events' },
  { label: 'Positions', icon: <AssignmentIndIcon />, key: 'positions' },
  { label: 'Logout', icon: <LogoutIcon />, key: 'logout' },
];

export default function AdminLayout({ selected, onSelect, children }) {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: 'background.default' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: 1201, background: 'primary.main', boxShadow: 2 }}>
        <Toolbar>
          <img src="/vite.svg" alt="Logo" style={{ height: 36, marginRight: 16 }} />
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700 }}>
            Online Voting Admin
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', background: '#263238', color: '#fff', borderRight: 0 },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', pt: 2 }}>
          <List>
            {navItems.map((item) => (
              <ListItem button key={item.key} selected={selected === item.key} onClick={() => onSelect(item.key)} sx={{ borderRadius: 2, mb: 1, mx: 1, ...(selected === item.key && { background: 'rgba(25, 118, 210, 0.15)' }) }}>
                <ListItemIcon sx={{ color: '#fff', minWidth: 36 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: selected === item.key ? 700 : 500 }} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 1, sm: 3 }, ml: `${drawerWidth}px` }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
