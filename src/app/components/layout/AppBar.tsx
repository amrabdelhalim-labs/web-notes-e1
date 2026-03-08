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
import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '@/app/hooks/useAuth';
import { useRouter } from '@/app/lib/navigation';
import { useTranslations } from 'next-intl';
import LanguageToggle from '@/app/components/common/LanguageToggle';
import ThemeToggle from '@/app/components/common/ThemeToggle';
import Tooltip from '@mui/material/Tooltip';
import ConnectionIndicator from '@/app/components/common/ConnectionIndicator';
import { useOfflineStatus } from '@/app/hooks/useOfflineStatus';
import { Z_INDEX } from '@/app/lib/ui-constants';

interface AppBarProps {
  onMenuClick: () => void;
}

export default function AppBar({ onMenuClick }: AppBarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const t = useTranslations('AppBar');
  const tApp = useTranslations('App');
  const isOnline = useOfflineStatus();

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
    <MuiAppBar position="fixed" sx={{ zIndex: Z_INDEX.appBar }}>
      <Toolbar sx={{ gap: 0.5, px: { xs: 1, sm: 2 } }}>
        {/* زر القائمة — حافة البداية، يظهر على xs/sm/md فقط */}
        <IconButton
          edge="start"
          color="inherit"
          aria-label={t('menu')}
          onClick={onMenuClick}
          sx={{ display: { md: 'none' }, mr: { xs: 0.5, sm: 1 }, flexShrink: 0 }}
        >
          <MenuIcon />
        </IconButton>

        {/* عنوان التطبيق — يأخذ المساحة ويختفي على xs */}
        <Typography
          variant="h6"
          component="h1"
          noWrap
          sx={{ flexGrow: 1, fontWeight: 700, minWidth: 0, display: { xs: 'none', sm: 'block' } }}
        >
          {tApp('name')}
        </Typography>

        {/* Spacer مرن على xs بدلاً من العنوان */}
        <Box sx={{ flexGrow: 1, display: { sm: 'none' } }} />

        {/* ── مجموعة أيقونات الحافة المعاكسة ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0, sm: 0.5 }, flexShrink: 0 }}>
          <ConnectionIndicator />
          <ThemeToggle />
          <LanguageToggle />
          {user && (
            <IconButton
              color="inherit"
              onClick={handleMenuOpen}
              aria-label={t('userMenu')}
              size="small"
              sx={{ ml: { xs: 0, sm: 0.5 } }}
            >
              <AccountCircleIcon />
            </IconButton>
          )}
        </Box>
      </Toolbar>

      {/* قائمة المستخدم — portal، لا تحتاج أن تكون داخل Toolbar */}
      {user && (
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
          <Tooltip
            title={!isOnline ? t('logoutOfflineDisabled') : ''}
            arrow
            disableHoverListener={isOnline}
          >
            <span>
              <MenuItem onClick={handleLogout} disabled={!isOnline} aria-disabled={!isOnline}>
                <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
                <ListItemText>{t('logout')}</ListItemText>
              </MenuItem>
            </span>
          </Tooltip>
        </Menu>
      )}
    </MuiAppBar>
  );
}
