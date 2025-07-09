import React, { useState } from 'react';
import { useThemeMode } from '../ThemeModeContext';
import { Fade, CircularProgress } from '@mui/material';
import { Box, CssBaseline, Drawer, AppBar, Toolbar, Typography, List, ListItem, ListItemIcon, ListItemText, Divider, Avatar, Tooltip as MuiTooltip, IconButton, Menu, MenuItem, Switch, Snackbar, useMediaQuery } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import AccountCircle from '@mui/icons-material/AccountCircle';
import MenuIcon from '@mui/icons-material/Menu';
// import { useThemeMode } from '../ThemeModeContext';

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


// Production: Always online, or replace with real API/ping check if needed
function useSystemStatus() {
  // Optionally, implement a real API ping here
  return 'online';
}

export default function AdminLayout({ selected, onSelect, children }) {
  const year = new Date().getFullYear();
  // Theme switcher state
  // System status
  const systemStatus = useSystemStatus();
  const { mode, setMode } = useThemeMode();
  // Profile menu state
  const [anchorEl, setAnchorEl] = useState(null);
  // Snackbar state
  const [snackbar, setSnackbar] = useState({ open: false, text: '', severity: 'success' });

  const handleThemeToggle = () => {
    const newMode = mode === 'dark' ? 'light' : 'dark';
    setMode(newMode);
    setSnackbar({ open: true, text: `Switched to ${newMode === 'dark' ? 'Dark' : 'Light'} Mode`, severity: 'success' });
  };

  const handleProfileMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleProfileClose = () => {
    setAnchorEl(null);
  };
  const handleLogout = () => {
    setAnchorEl(null);
    localStorage.removeItem('admin_session');
    window.location.href = '/admin-login';
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

  const isMobile = useMediaQuery('(max-width:900px)');
  const [mobileOpen, setMobileOpen] = useState(false);

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
      {/* Lighter AppBar, no halo or blur */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: 1201,
          background: '#1976d2',
          boxShadow: '0 1.5px 6px 0 rgba(33,150,243,0.07)',
          borderBottom: '1.5px solid #e3eafc',
          transition: 'background 0.3s, box-shadow 0.3s',
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', minHeight: { xs: 56, sm: 64 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            {isMobile && (
              <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 1 }} aria-label="Open navigation menu">
                <MenuIcon />
              </IconButton>
            )}
            <img src="/vite.svg" alt="Logo" style={{ height: 36, marginRight: 12 }} />
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 800, letterSpacing: 1, color: '#fff', fontSize: { xs: 18, sm: 22 } }}>
              Online Voting Admin
            </Typography>
            {/* Live System Status Indicator */}
            {!isMobile && (
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
            )}
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
            <MuiTooltip title={mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              <IconButton color="inherit" onClick={handleThemeToggle} sx={{ transition: 'color 0.3s' }}>
                {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
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
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? mobileOpen : true}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          display: { xs: isMobile ? 'block' : 'none', sm: 'block' },
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: 'border-box',
            background: '#f7fafd',
            color: '#222',
            borderRight: '1px solid #e0e0e0',
            borderRadius: 0,
            boxShadow: 'none',
            transition: 'box-shadow 0.3s, background 0.3s',
            backgroundSize: '100% 200%',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', pt: 2 }}>
          <List>
            {navItems.map((item) => (
              <ListItem
                button={true}
                key={item.key}
                selected={selected === item.key}
                onClick={() => {
                  if (isMobile) setMobileOpen(false);
                  onSelect(item.key);
                }}
                component="div"
                sx={{
                  borderRadius: 1.5,
                  mb: 1,
                  mx: 1,
                  minHeight: 44,
                  background: selected === item.key ? '#e3eafc' : 'transparent',
                  color: selected === item.key ? '#1976d2' : '#222',
                  fontWeight: selected === item.key ? 800 : 500,
                  '&:hover': {
                    background: '#e3eafc',
                    color: '#1976d2',
                  },
                  transition: 'background 0.18s, color 0.18s',
                }}
              >
                <ListItemIcon sx={{ color: selected === item.key ? '#1976d2' : '#888', minWidth: 36 }}>{item.icon}</ListItemIcon>
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
          background: '#f7fafd',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Toolbar sx={{ zIndex: 1 }} />
        <Box
          sx={{
            flex: 1,
            width: '100%',
            maxWidth: 1200,
            mx: 'auto',
            my: { xs: 1, sm: 2 },
            p: { xs: 1, sm: 3 },
            borderRadius: 2,
            boxShadow: 'none',
            background: '#fff',
            minHeight: 500,
            border: '1.5px solid #e3eafc',
            boxSizing: 'border-box',
            position: 'relative',
            overflow: 'visible',
          }}
        >
          {children}
        </Box>
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
