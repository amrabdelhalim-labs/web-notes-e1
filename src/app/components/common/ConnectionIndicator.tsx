'use client';

/**
 * ConnectionIndicator
 *
 * Connection status menu in the AppBar.
 * Shows online/offline status and pending sync operations.
 * Provides manual sync trigger when online.
 */

import { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import SyncIcon from '@mui/icons-material/Sync';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import InstallMobileIcon from '@mui/icons-material/InstallMobile';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import ConstructionIcon from '@mui/icons-material/Construction';
import { useTranslations } from 'next-intl';
import { useOfflineStatus } from '@/app/hooks/useOfflineStatus';
import { useSyncStatus } from '@/app/hooks/useSyncStatus';
import { usePwaStatus } from '@/app/hooks/usePwaStatus';

export default function ConnectionIndicator() {
  const t = useTranslations('ConnectionStatus');
  const isOnline = useOfflineStatus();
  const { pendingCount, hasPending, refresh } = useSyncStatus();
  const { swState, installState } = usePwaStatus();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const menuOpen = Boolean(anchorEl);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
    refresh(); // Refresh sync status when opening menu
  };

  const handleClose = () => setAnchorEl(null);

  const handleManualSync = async () => {
    if (!isOnline || !hasPending) return;
    
    setIsSyncing(true);
    try {
      // Trigger sync via service worker message or direct call
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'PROCESS_OFFLINE_QUEUE' });
      }
      // Also trigger via custom event for useNotes hook
      window.dispatchEvent(new CustomEvent('trigger-sync'));
      
      // Wait a bit then refresh status
      await new Promise(resolve => setTimeout(resolve, 1500));
      await refresh();
    } catch (error) {
      console.error('Manual sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const showBadge = hasPending && isOnline;

  // Tooltip text based on status
  const tooltipText = isOnline 
    ? hasPending 
      ? t('connectedDescription') 
      : t('online')
    : t('offline');

  return (
    <>
      <Tooltip title={tooltipText}>
        <IconButton
          color="inherit"
          onClick={handleOpen}
          aria-label={t('connectionStatus')}
          size="small"
          sx={{
            position: 'relative',
            mx: 0.5,
          }}
        >
          {isOnline ? (
            <WifiIcon fontSize="small" />
          ) : (
            <WifiOffIcon fontSize="small" />
          )}
          {showBadge && (
            <Box
              sx={{
                position: 'absolute',
                top: 2,
                right: 2,
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: (theme) => theme.palette.warning.main,
                border: '1.5px solid',
                borderColor: 'background.paper',
              }}
            />
          )}
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{
          sx: { minWidth: 280 },
        }}
      >
        {/* Connection Status */}
        <MenuItem 
          disabled 
          sx={{ 
            opacity: 1,
            py: 1.5,
          }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            {isOnline ? (
              <WifiIcon sx={(theme) => ({ 
                color: theme.palette.mode === 'dark' ? 'success.main' : 'success.dark',
              })} fontSize="medium" />
            ) : (
              <WifiOffIcon sx={(theme) => ({ 
                color: theme.palette.mode === 'dark' ? 'warning.main' : 'warning.dark',
              })} fontSize="medium" />
            )}
          </ListItemIcon>
          <ListItemText
            primary={
              <Typography variant="subtitle2" fontWeight={600} sx={(theme) => ({ color: theme.palette.text.primary })}>
                {isOnline ? t('online') : t('offline')}
              </Typography>
            }
            secondary={
              <Typography variant="caption" sx={(theme) => ({ color: theme.palette.text.secondary })}>
                {isOnline ? t('connectedDescription') : t('offlineDescription')}
              </Typography>
            }
          />
        </MenuItem>

        <Divider />

        {/* Sync Status */}
        <MenuItem 
          disabled 
          sx={{ 
            opacity: 1,
            py: 1.5,
          }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            {hasPending ? (
              <PendingIcon sx={(theme) => ({ 
                color: theme.palette.mode === 'dark' ? 'warning.main' : 'warning.dark',
              })} fontSize="medium" />
            ) : (
              <CheckCircleIcon sx={(theme) => ({ 
                color: theme.palette.mode === 'dark' ? 'success.main' : 'success.dark',
              })} fontSize="medium" />
            )}
          </ListItemIcon>
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle2" fontWeight={600} sx={(theme) => ({ color: theme.palette.text.primary })}>
                  {hasPending ? t('syncPending') : t('synced')}
                </Typography>
                {hasPending && (
                  <Chip
                    label={pendingCount}
                    size="small"
                    color="warning"
                    sx={{ 
                      height: 20, 
                      fontSize: '0.7rem',
                      fontWeight: 700,
                    }}
                  />
                )}
              </Box>
            }
            secondary={
              <Typography variant="caption" sx={(theme) => ({ color: theme.palette.text.secondary })}>
                {hasPending
                  ? t('pendingOperations', { count: pendingCount })
                  : t('allSynced')}
              </Typography>
            }
          />
        </MenuItem>

        {/* Manual Sync Button */}
        {isOnline && hasPending && (
          <>
            <Divider />
            <MenuItem
              onClick={handleManualSync}
              disabled={isSyncing}
              sx={{
                color: 'primary.main',
                fontWeight: 600,
                '&:hover': {
                  bgcolor: 'action.hover',
                },
                '&.Mui-disabled': {
                  opacity: 0.6,
                },
              }}
            >
              <ListItemIcon>
                {isSyncing ? (
                  <CircularProgress size={22} color="primary" />
                ) : (
                  <SyncIcon color="primary" fontSize="medium" />
                )}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="body2" fontWeight={600} color="primary.main">
                    {isSyncing ? t('syncing') : t('syncNow')}
                  </Typography>
                }
              />
            </MenuItem>
          </>
        )}

        <Divider />

        {/* PWA Status */}
        <MenuItem disabled sx={{ opacity: 1, pt: 2, pb: 1, px: 2 }}>
          <Typography
            variant="overline"
            sx={(theme) => ({
              color: theme.palette.text.secondary,
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              lineHeight: 1.2,
            })}
          >
            {t('pwaTitle')}
          </Typography>
        </MenuItem>

        {/* Service Worker row */}
        <MenuItem disabled sx={{ opacity: 1, py: 1.25, px: 2 }}>
          <ListItemIcon sx={{ minWidth: 40 }}>
            <ConstructionIcon
              fontSize="small"
              sx={(theme) => ({
                color:
                  swState === 'active'
                    ? theme.palette.mode === 'dark'
                      ? theme.palette.success.main
                      : theme.palette.success.dark
                    : swState === 'installing'
                      ? theme.palette.warning.main
                      : theme.palette.text.disabled,
              })}
            />
          </ListItemIcon>
          <ListItemText
            sx={{ my: 0 }}
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography
                  variant="caption"
                  component="span"
                  sx={(theme) => ({
                    color: theme.palette.text.secondary,
                    fontSize: '0.7rem',
                  })}
                >
                  {t('swLabel')}
                </Typography>
                <Typography
                  variant="caption"
                  component="span"
                  fontWeight={600}
                  sx={(theme) => ({
                    fontSize: '0.75rem',
                    color:
                      swState === 'active'
                        ? theme.palette.mode === 'dark'
                          ? theme.palette.success.main
                          : theme.palette.success.dark
                        : swState === 'installing'
                          ? theme.palette.warning.main
                          : theme.palette.text.disabled,
                  })}
                >
                  {swState === 'active'
                    ? t('swActive')
                    : swState === 'installing'
                      ? t('swInstalling')
                      : swState === 'checking'
                        ? t('swChecking')
                        : swState === 'unsupported'
                          ? t('swUnsupported')
                          : t('swInactive')}
                </Typography>
              </Box>
            }
          />
        </MenuItem>

        {/* Install state row */}
        <MenuItem disabled sx={{ opacity: 1, py: 1.25, pb: 2, px: 2 }}>
          <ListItemIcon sx={{ minWidth: 40 }}>
            {installState === 'standalone' ? (
              <PhoneAndroidIcon
                fontSize="small"
                sx={(theme) => ({
                  color:
                    theme.palette.mode === 'dark'
                      ? theme.palette.success.main
                      : theme.palette.success.dark,
                })}
              />
            ) : (
              <InstallMobileIcon
                fontSize="small"
                sx={(theme) => ({
                  color:
                    installState === 'installable'
                      ? theme.palette.primary.main
                      : theme.palette.text.disabled,
                })}
              />
            )}
          </ListItemIcon>
          <ListItemText
            sx={{ my: 0 }}
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography
                  variant="caption"
                  component="span"
                  sx={(theme) => ({
                    color: theme.palette.text.secondary,
                    fontSize: '0.7rem',
                  })}
                >
                  {t('installLabel')}
                </Typography>
                <Typography
                  variant="caption"
                  component="span"
                  fontWeight={600}
                  sx={(theme) => ({
                    fontSize: '0.75rem',
                    color:
                      installState === 'standalone'
                        ? theme.palette.mode === 'dark'
                          ? theme.palette.success.main
                          : theme.palette.success.dark
                        : installState === 'installable'
                          ? theme.palette.primary.main
                          : theme.palette.text.disabled,
                  })}
                >
                  {t(
                    installState === 'standalone'
                      ? 'installStandalone'
                      : installState === 'installable'
                        ? 'installInstallable'
                        : 'installNotInstallable',
                  )}
                </Typography>
              </Box>
            }
          />
        </MenuItem>
      </Menu>
    </>
  );
}
