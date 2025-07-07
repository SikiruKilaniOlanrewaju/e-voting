import React from 'react';
import { Box, CssBaseline, Drawer, AppBar, Toolbar, Typography, List, ListItem, ListItemIcon, ListItemText, Divider, Avatar, Tooltip as MuiTooltip, IconButton } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';

const drawerWidth = 220;

const navItems = [
  { label: 'Dashboard', icon: <HowToVoteIcon />, key: 'home' },
  { label: 'Students', icon: <PeopleIcon />, key: 'students' },
  { label: 'Candidates', icon: <AssignmentIndIcon />, key: 'candidates' },
  { label: 'Voting Events', icon: <HowToVoteIcon />, key: 'events' },
  { label: 'Positions', icon: <AssignmentIndIcon />, key: 'positions' },
  { label: 'Results', icon: <HowToVoteIcon />, key: 'results' },
  { label: 'Logout', icon: <LogoutIcon />, key: 'logout' },
];

export default function AdminLayout({ selected, onSelect, children }) {
  const year = new Date().getFullYear();
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: 'background.default' }}>
      <CssBaseline />
      {/* AppBar Halo Glow */}
      <Box sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: 90,
        zIndex: 1200,
        pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(66,165,245,0.18) 0%, rgba(66,165,245,0) 80%)',
        filter: 'blur(12px)',
        opacity: 0.8,
        animation: 'haloPulse 5s ease-in-out infinite',
        '@keyframes haloPulse': {
          '0%,100%': { opacity: 0.8 },
          '50%': { opacity: 1 },
        },
      }} />
      <AppBar
        position="fixed"
        sx={{
          zIndex: 1201,
          background: 'linear-gradient(90deg, #1976d2 70%, #42a5f5 100%)',
          boxShadow: '0 4px 32px 0 rgba(33,150,243,0.18), 0 0 0 2px #42a5f5',
          borderBottom: '1.5px solid #e3eafc',
          borderLeft: '1.5px solid #e3eafc',
          animation: 'shimmer 4s linear infinite',
          backgroundSize: '200% 100%',
          '@keyframes shimmer': {
            '0%': { backgroundPosition: '200% 0' },
            '100%': { backgroundPosition: '-200% 0' },
          },
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <img src="/vite.svg" alt="Logo" style={{ height: 40, marginRight: 18 }} />
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 800, letterSpacing: 1, color: '#fff' }}>
              Online Voting Admin
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <MuiTooltip title="Settings"><IconButton color="inherit"><SettingsIcon /></IconButton></MuiTooltip>
            <Avatar sx={{ bgcolor: '#1976d2', width: 36, height: 36, fontWeight: 700 }}>AD</Avatar>
          </Box>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          boxShadow: '0 0 32px 0 rgba(33,150,243,0.13)',
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: 'border-box',
            background: 'linear-gradient(180deg, #263238 80%, #1976d2 100%)',
            color: '#fff',
            borderRight: '1px solid #e0e0e0',
            borderTopRightRadius: 0,
            borderBottomRightRadius: 24,
            boxShadow: '0 0 32px 0 rgba(33,150,243,0.13)',
            transition: 'box-shadow 0.3s, border-radius 0.3s, background 0.5s',
            backgroundSize: '100% 200%',
            '&:hover, &:focus-within': {
              background: 'linear-gradient(180deg, #263238 60%, #42a5f5 100%)',
              backgroundPosition: '0 100%',
              backgroundSize: '100% 200%',
              transition: 'background 0.5s',
            },
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', pt: 2 }}>
          <List>
            {navItems.map((item) => (
              <ListItem
                button
                key={item.key}
                selected={selected === item.key}
                onClick={e => {
                  // Ripple effect
                  const ripple = document.createElement('span');
                  ripple.className = 'sidebar-ripple';
                  ripple.style.left = `${e.nativeEvent.offsetX}px`;
                  ripple.style.top = `${e.nativeEvent.offsetY}px`;
                  e.currentTarget.appendChild(ripple);
                  setTimeout(() => ripple.remove(), 600);
                  onSelect(item.key);
                }}
                sx={{
                  borderRadius: 3,
                  mb: 1,
                  mx: 1,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'background 0.2s, box-shadow 0.2s, transform 0.2s',
                  '&:hover': {
                    background: 'rgba(33, 150, 243, 0.18)',
                    boxShadow: 3,
                    transform: 'scale(1.03)'
                  },
                  ...(selected === item.key && {
                    background: 'linear-gradient(90deg, #1976d2 60%, #42a5f5 100%)',
                    color: '#fff',
                    boxShadow: 6,
                    animation: 'pulse 1.6s infinite',
                    '@keyframes pulse': {
                      '0%': { boxShadow: '0 0 0 0 rgba(33,150,243,0.18)' },
                      '70%': { boxShadow: '0 0 0 10px rgba(33,150,243,0)' },
                      '100%': { boxShadow: '0 0 0 0 rgba(33,150,243,0.18)' },
                    },
                  })
                }}
              >
                {/* Ripple effect style */}
                <style>{`
                  .sidebar-ripple {
                    position: absolute;
                    border-radius: 50%;
                    transform: scale(0);
                    animation: ripple 0.6s linear;
                    background: rgba(66,165,245,0.25);
                    pointer-events: none;
                    width: 80px;
                    height: 80px;
                    left: 0;
                    top: 0;
                    z-index: 2;
                  }
                  @keyframes ripple {
                    to {
                      transform: scale(2.5);
                      opacity: 0;
                    }
                  }
                `}</style>
                <ListItemIcon sx={{ color: '#fff', minWidth: 36 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: selected === item.key ? 800 : 500, fontSize: 16 }} />
              </ListItem>
            ))}
          </List>
          <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.12)' }} />
          <Box sx={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: 13, px: 2 }}>
            &copy; {year} Voting System<br />All rights reserved.
          </Box>
        </Box>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 0, sm: 2, md: 4 },
          ml: 0,
          maxWidth: 'none',
          width: '100%',
          boxSizing: 'border-box',
          minHeight: 600,
          background: 'linear-gradient(135deg, #f7fafd 60%, #e3eafc 100%)',
          transition: 'background 0.3s, box-shadow 0.3s',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Animated gradient overlay for extra depth */}
        <Box sx={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          background: 'linear-gradient(120deg, rgba(66,165,245,0.08) 0%, rgba(25,118,210,0.06) 100%)',
          animation: 'gradientMove 8s ease-in-out infinite',
          backgroundSize: '200% 200%',
          '@keyframes gradientMove': {
            '0%': { backgroundPosition: '0% 50%' },
            '50%': { backgroundPosition: '100% 50%' },
            '100%': { backgroundPosition: '0% 50%' },
          },
        }} />
        {/* Floating accent circle for extra depth */}
        <Box sx={{
          position: 'absolute',
          right: { xs: -80, md: -120 },
          top: { xs: 120, md: 180 },
          width: { xs: 180, md: 260 },
          height: { xs: 180, md: 260 },
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(66,165,245,0.13) 0%, rgba(66,165,245,0) 80%)',
          filter: 'blur(8px)',
          zIndex: 0,
        }} />
        <Toolbar sx={{ zIndex: 1 }} />
        <Box
          sx={{
            flex: 1,
            width: '100%',
            maxWidth: 1200,
            mx: 'auto',
            my: { xs: 1, sm: 2 },
            p: { xs: 1.5, sm: 4 },
            borderRadius: 8,
            boxShadow: { xs: 'none', sm: '0 12px 48px 0 rgba(33,150,243,0.13), 0 2px 8px 0 rgba(66,165,245,0.08)' },
            background: 'rgba(255,255,255,0.94)',
            minHeight: 500,
            border: '2.5px solid',
            borderImage: 'linear-gradient(120deg, #42a5f5 0%, #e3eafc 100%, #1976d2 100%) 1',
            boxSizing: 'border-box',
            position: 'relative',
            overflow: 'hidden',
            '::after': {
              content: '""',
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              boxShadow: 'inset 0 2.5px 18px 0 rgba(33,150,243,0.09)',
              borderRadius: 'inherit',
              border: '2px solid transparent',
              background: 'linear-gradient(120deg, rgba(66,165,245,0.08) 0%, rgba(25,118,210,0.06) 100%)',
              zIndex: 1,
              animation: 'borderGlow 3.5s ease-in-out infinite',
              '@keyframes borderGlow': {
                '0%,100%': { opacity: 0.7 },
                '50%': { opacity: 1 },
              },
            },
            animation: 'fadeIn 0.7s cubic-bezier(.4,0,.2,1)',
            '@keyframes fadeIn': {
              from: { opacity: 0, transform: 'translateY(24px)' },
              to: { opacity: 1, transform: 'none' },
            },
            zIndex: 1,
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
