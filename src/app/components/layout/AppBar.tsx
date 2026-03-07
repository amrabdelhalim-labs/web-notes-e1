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
import { useRouter } from '@/app/lib/navigation';
import { useTranslations } from 'next-intl';
import LanguageToggle from '@/app/components/common/LanguageToggle';

interface AppBarProps {
  onMenuClick: () => void;
}

export default function AppBar({ onMenuClick }: AppBarProps) {
  const { mode, toggleMode } = useThemeMode();
  const { user, logout } = useAuth();
  const router = useRouter();
  const t = useTranslations('AppBar');
  const tApp = useTranslations('App');

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
          aria-label={t('menu')}
          onClick={onMenuClick}
          sx={{ ml: 1, display: { md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        <Typography
          variant="h6"
          component="h1"
          noWrap
          sx={{ flexGrow: 1, fontWeight: 700, minWidth: 0 }}
        >
          {tApp('name')}
        </Typography>

        {/* Theme toggle */}
        <IconButton color="inherit" onClick={toggleMode} aria-label={t('toggleTheme')}>
          {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
        </IconButton>

        {/* Language toggle */}
        <LanguageToggle />

        {/* User menu */}
        {user && (
          <>
            <IconButton color="inherit" onClick={handleMenuOpen} aria-label={t('userMenu')}>
              <AccountCircleIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={menuOpen}
              onClose={handleMenuClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            >
              <MenuItem disabled sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 1.5, px: 2, gap: 0.25 }}>
                <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ lineHeight: 1.3 }}>
                  {user.displayName || user.username}
                </Typography>
                {user.displayName && (
                  <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                    @{user.username}
                  </Typography>
                )}
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleProfile}>
                <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                <ListItemText>{t('profile')}</ListItemText>
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
                <ListItemText>{t('logout')}</ListItemText>
              </MenuItem>
            </Menu>
          </>
        )}
      </Toolbar>
    </MuiAppBar>
  );
}
