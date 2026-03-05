'use client';

/**
 * AppBar — top navigation bar.
 *
 * Shows the app title, theme toggle, and user menu (profile / logout).
 * Accepts an onMenuClick prop so MainLayout can toggle the sidebar.
 */

import { useState } from 'react';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import MenuIcon from '@mui/icons-material/Menu';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import { useThemeMode } from '@/app/hooks/useThemeMode';
import { useAuth } from '@/app/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { APP_NAME_AR } from '@/app/config';

interface AppBarProps {
  onMenuClick: () => void;
}

export default function AppBar({ onMenuClick }: AppBarProps) {
  const { mode, toggleMode } = useThemeMode();
  const { user, logout } = useAuth();
  const router = useRouter();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleProfile = () => {
    handleMenuClose();
    router.push('/profile');
  };
  const handleLogout = () => {
    handleMenuClose();
    logout();
    router.push('/login');
  };

  return (
    <MuiAppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
      <Toolbar>
        {/* زر القائمة — يظهر فقط على الشاشات الصغيرة والمتوسطة */}
        <IconButton
          edge="start"
          color="inherit"
          aria-label="القائمة"
          onClick={onMenuClick}
          sx={{ ml: 1, display: { md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        <Typography
          variant="h6"
          component="h1"
          sx={{ flexGrow: 1, fontWeight: 700 }}
        >
          {APP_NAME_AR}
        </Typography>

        {/* Theme toggle */}
        <IconButton color="inherit" onClick={toggleMode} aria-label="تبديل السمة">
          {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
        </IconButton>

        {/* User menu */}
        {user && (
          <>
            <IconButton color="inherit" onClick={handleMenuOpen} aria-label="حساب المستخدم">
              <AccountCircleIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={menuOpen}
              onClose={handleMenuClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            >
              <MenuItem disabled>
                <Typography variant="body2" color="text.secondary">
                  {user.displayName || user.username}
                </Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleProfile}>
                <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                <ListItemText>الملف الشخصي</ListItemText>
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
                <ListItemText>تسجيل الخروج</ListItemText>
              </MenuItem>
            </Menu>
          </>
        )}
      </Toolbar>
    </MuiAppBar>
  );
}
