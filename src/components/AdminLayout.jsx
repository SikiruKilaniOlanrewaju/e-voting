import React, { useState } from 'react';
import { Fade, CircularProgress } from '@mui/material';
import { Box, CssBaseline, Drawer, AppBar, Toolbar, Typography, List, ListItem, ListItemIcon, ListItemText, Divider, Avatar, Tooltip as MuiTooltip, IconButton, Menu, MenuItem, Switch, Snackbar } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import AccountCircle from '@mui/icons-material/AccountCircle';

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

// Simulate a live system status (replace with real API/ping in production)
function useSystemStatus() {
  const [status, setStatus] = useState('online');
  React.useEffect(() => {
    const interval = setInterval(() => {
      // Randomly simulate status for demo; replace with real check
      setStatus(Math.random() > 0.97 ? 'offline' : 'online');
    }, 4000);
    return () => clearInterval(interval);
  }, []);
  return status;
}

export default function AdminLayout({ selected, onSelect, children }) {
  const year = new Date().getFullYear();
  // Theme switcher state
  // System status
  const systemStatus = useSystemStatus();
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('admin_theme') === 'dark');
  // Profile menu state
  const [anchorEl, setAnchorEl] = useState(null);
  // Snackbar state
  const [snackbar, setSnackbar] = useState({ open: false, text: '', severity: 'success' });

  const handleThemeToggle = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('admin_theme', newMode ? 'dark' : 'light');
    setSnackbar({ open: true, text: `Switched to ${newMode ? 'Dark' : 'Light'} Mode`, severity: 'success' });
    // Optionally: trigger theme context/provider here
  };

  const handleProfileMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleProfileClose = () => {
    setAnchorEl(null);
  };
  const handleLogout = () => {
    setSnackbar({ open: true, text: 'Logged out (demo only)', severity: 'info' });
    setAnchorEl(null);
    // Add real logout logic here
  };

  // Help/FAQ modal state
  const [helpOpen, setHelpOpen] = useState(false);
  // Accessibility: font size/contrast
  const [accessibility, setAccessibility] = useState({ fontSize: 1, highContrast: false });
  // Keyboard shortcut: open help with ? and accessibility with Alt+A
  React.useEffect(() => {
    const handler = (e) => {
      if ((e.key === '?' || (e.shiftKey && e.key === '/')) && !anchorEl && !helpOpen) {
        setHelpOpen(true);
      }
      if ((e.altKey && (e.key === 'a' || e.key === 'A'))) {
        setAccessibility(acc => ({ ...acc, highContrast: !acc.highContrast }));
        setSnackbar({ open: true, text: `High Contrast ${!accessibility.highContrast ? 'Enabled' : 'Disabled'}`, severity: 'info' });
      }
      if ((e.altKey && (e.key === '+' || e.key === '='))) {
        setAccessibility(acc => ({ ...acc, fontSize: Math.min(acc.fontSize + 0.1, 1.5) }));
        setSnackbar({ open: true, text: 'Font Size Increased', severity: 'info' });
      }
      if ((e.altKey && (e.key === '-' || e.key === '_'))) {
        setAccessibility(acc => ({ ...acc, fontSize: Math.max(acc.fontSize - 0.1, 0.8) }));
        setSnackbar({ open: true, text: 'Font Size Decreased', severity: 'info' });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [anchorEl, helpOpen, accessibility.highContrast]);

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        background: accessibility.highContrast
          ? 'linear-gradient(135deg, #000 60%, #222 100%)'
          : 'background.default',
        fontSize: `${accessibility.fontSize}em`,
        color: accessibility.highContrast ? '#fff' : undefined,
        transition: 'background 0.3s, color 0.3s, font-size 0.2s',
      }}
    >
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
            {/* Live System Status Indicator */}
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 3, gap: 1 }}>
              {/* Animated status pulse */}
              <Box sx={{
                width: 14, height: 14, borderRadius: '50%',
                background: systemStatus === 'online' ? 'linear-gradient(90deg,#43e97b,#38f9d7)' : '#e57373',
                boxShadow: systemStatus === 'online' ? '0 0 12px 4px #43e97b88, 0 0 0 0 #43e97b' : '0 0 12px 4px #e5737388',
                border: '2px solid #fff',
                animation: systemStatus === 'online' ? 'pulseStatus 1.5s infinite' : 'none',
                transition: 'background 0.3s, box-shadow 0.3s',
                '@keyframes pulseStatus': {
                  '0%': { boxShadow: '0 0 0 0 #43e97b88, 0 0 12px 4px #43e97b88' },
                  '70%': { boxShadow: '0 0 0 8px #43e97b00, 0 0 12px 4px #43e97b88' },
                  '100%': { boxShadow: '0 0 0 0 #43e97b88, 0 0 12px 4px #43e97b88' },
                },
              }} />
              <Typography variant="caption" sx={{
                color: systemStatus === 'online' ? '#e0ffe0' : '#fff',
                fontWeight: 800,
                letterSpacing: 0.5,
                textShadow: systemStatus === 'online' ? '0 0 8px #43e97b' : '0 0 8px #e57373',
                transition: 'color 0.3s, text-shadow 0.3s',
                display: 'flex', alignItems: 'center',
              }}>
                {systemStatus === 'online' ? 'System Online' : 'Offline'}
                {systemStatus === 'online' && <span style={{ marginLeft: 4, fontSize: 12, fontWeight: 600, opacity: 0.7 }}>●</span>}
              </Typography>
              {systemStatus !== 'online' && <>
                <CircularProgress size={14} sx={{ ml: 1, color: '#e57373' }} />
                <Typography variant="caption" sx={{ color: '#e57373', fontWeight: 700, ml: 1 }}>Attempting reconnect...</Typography>
              </>}
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Accessibility Button */}
            <MuiTooltip title="Accessibility (Alt+A: contrast, Alt++/Alt+-: font size)">
              <IconButton color={accessibility.highContrast ? 'warning' : 'inherit'} onClick={() => {
                setAccessibility(acc => ({ ...acc, highContrast: !acc.highContrast }));
                setSnackbar({ open: true, text: `High Contrast ${!accessibility.highContrast ? 'Enabled' : 'Disabled'}`, severity: 'info' });
              }}>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="11" fill="#1976d2"/><text x="11" y="16" textAnchor="middle" fontSize="14" fill="#fff" fontWeight="bold">Aa</text></svg>
              </IconButton>
            </MuiTooltip>
            {/* Help/FAQ Button */}
            <MuiTooltip title="Help / FAQ (Press ?)">
              <IconButton color="inherit" onClick={() => setHelpOpen(true)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#42a5f5"/><text x="12" y="17" textAnchor="middle" fontSize="16" fill="#fff" fontWeight="bold">?</text></svg>
              </IconButton>
            </MuiTooltip>
            {/* Theme Switcher */}
            <MuiTooltip title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              <IconButton color="inherit" onClick={handleThemeToggle} sx={{ transition: 'color 0.3s' }}>
                {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </MuiTooltip>
            {/* Profile Menu */}
            <MuiTooltip title="Admin Profile">
              <IconButton color="inherit" onClick={handleProfileMenu} sx={{ p: 0.5 }}>
                <Avatar sx={{ bgcolor: '#1976d2', width: 36, height: 36, fontWeight: 700 }}>AD</Avatar>
              </IconButton>
            </MuiTooltip>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleProfileClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              PaperProps={{ sx: { minWidth: 180, borderRadius: 2, boxShadow: 6, mt: 1 } }}
            >
              <MenuItem disabled>
                <AccountCircle sx={{ mr: 1 }} /> Admin
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleProfileClose}><SettingsIcon sx={{ mr: 1 }} /> Profile Settings</MenuItem>
              <MenuItem onClick={handleLogout}><LogoutIcon sx={{ mr: 1 }} /> Logout</MenuItem>
            </Menu>
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
      {/* Animated Page Transition */}
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
        {/* Fade transition for page content */}
        <Fade in timeout={600} appear>
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
              // Micro-interaction: subtle hover effect for main card
              transition: 'box-shadow 0.3s, transform 0.2s',
              '&:hover': {
                boxShadow: '0 16px 64px 0 rgba(33,150,243,0.18), 0 2px 12px 0 rgba(66,165,245,0.10)',
                transform: 'scale(1.01)',
              },
            }}
          >
            {/* Micro-interaction: animated info bar */}
            <Fade in timeout={900}>
              <Box sx={{
                position: 'absolute',
                top: 0, left: 0, width: '100%',
                bgcolor: 'linear-gradient(90deg, #42a5f5 0%, #1976d2 100%)',
                color: '#fff',
                py: 0.5, px: 2,
                fontWeight: 700,
                fontSize: 15,
                letterSpacing: 0.5,
                borderTopLeftRadius: 8,
                borderTopRightRadius: 8,
                boxShadow: '0 2px 12px 0 rgba(33,150,243,0.09)',
                display: 'flex', alignItems: 'center', gap: 1.5,
                zIndex: 2,
                opacity: 0.97,
                animation: 'slideDownInfo 1.2s cubic-bezier(.4,0,.2,1)',
                '@keyframes slideDownInfo': {
                  from: { transform: 'translateY(-32px)', opacity: 0 },
                  to: { transform: 'none', opacity: 0.97 },
                },
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#fff" fillOpacity="0.18"/><path d="M12 8v4m0 4h.01" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
                Welcome to the premium admin dashboard! Enjoy live status, accessibility, and interactive UI.
              </Box>
            </Fade>
            {children}
          </Box>
        </Fade>
      </Box>
    {/* Help/FAQ Modal */}
    {helpOpen && (
      <Box sx={{
        position: 'fixed',
        top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 2000,
        background: accessibility.highContrast ? 'rgba(0,0,0,0.85)' : 'rgba(33,150,243,0.13)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn 0.3s',
      }} onClick={() => setHelpOpen(false)}>
        <Box sx={{
          bgcolor: accessibility.highContrast ? '#111' : '#fff',
          color: accessibility.highContrast ? '#fff' : undefined,
          borderRadius: 4, boxShadow: 8, p: 4, minWidth: 340, maxWidth: 420,
          border: accessibility.highContrast ? '2px solid #fff' : '2px solid #42a5f5', position: 'relative',
        }} onClick={e => e.stopPropagation()}>
          <Typography variant="h6" fontWeight={800} color={accessibility.highContrast ? '#fff' : '#1976d2'} sx={{ mb: 1 }}>Help & FAQ</Typography>
          <Divider sx={{ mb: 2, borderColor: accessibility.highContrast ? '#fff' : undefined }} />
          <Typography variant="body1" sx={{ mb: 2 }}>
            <b>Theme Switcher:</b> Click the sun/moon icon to toggle light/dark mode.<br/>
            <b>Profile Menu:</b> Click your avatar for settings and logout.<br/>
            <b>Navigation:</b> Use the sidebar to access admin features.<br/>
            <b>Keyboard Shortcuts:</b> <kbd>?</kbd> for help, <kbd>Alt+A</kbd> for contrast, <kbd>Alt++</kbd>/<kbd>Alt+-</kbd> for font size.<br/>
          </Typography>
          <Typography variant="body2" color={accessibility.highContrast ? '#fff' : 'text.secondary'}>
            For more support, contact your system administrator.<br/>
            <b>Tip:</b> Use <kbd>Tab</kbd> to navigate, <kbd>Esc</kbd> to close dialogs.
          </Typography>
          <IconButton onClick={() => setHelpOpen(false)} sx={{ position: 'absolute', top: 8, right: 8, color: accessibility.highContrast ? '#fff' : '#1976d2' }}>
            <svg width="20" height="20" viewBox="0 0 20 20"><line x1="4" y1="4" x2="16" y2="16" stroke={accessibility.highContrast ? '#fff' : '#1976d2'} strokeWidth="2"/><line x1="16" y1="4" x2="4" y2="16" stroke={accessibility.highContrast ? '#fff' : '#1976d2'} strokeWidth="2"/></svg>
          </IconButton>
        </Box>
      </Box>
    )}
    {/* Global Snackbar */}
    <Snackbar
      open={snackbar.open}
      autoHideDuration={2200}
      onClose={() => setSnackbar({ ...snackbar, open: false })}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      ContentProps={{
        sx: {
          background: snackbar.severity === 'success' ? 'linear-gradient(90deg, #42a5f5 60%, #1976d2 100%)' : snackbar.severity === 'error' ? '#e57373' : '#ffb300',
          color: '#fff',
          fontWeight: 700,
          fontSize: 16,
          borderRadius: 2,
          boxShadow: 4,
        }
      }}
      message={snackbar.text}
    />
    </Box>
  );
}
