'use client';

/**
 * ConnectionIndicator
 *
 * Connection status menu in the AppBar.
 * Shows online/offline status and pending sync operations.
 * Provides manual sync trigger when online.
 */

import { useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
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
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import SyncIcon from '@mui/icons-material/Sync';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import InstallMobileIcon from '@mui/icons-material/InstallMobile';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import ConstructionIcon from '@mui/icons-material/Construction';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import GppBadIcon from '@mui/icons-material/GppBad';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useTranslations } from 'next-intl';
import { useOfflineStatus, CONNECTIVITY_CHECK_EVENT } from '@/app/hooks/useOfflineStatus';
import { useSyncStatus } from '@/app/hooks/useSyncStatus';
import { usePwaStatus } from '@/app/hooks/usePwaStatus';
import { getPendingOps, removePendingOp, cacheNotes, type PendingOperation } from '@/app/lib/db';

const TRUSTED_KEY = 'device-trusted';
const TRUST_CHANGED_EVENT = 'device-trust-changed';

export default function ConnectionIndicator() {
  const t = useTranslations('ConnectionStatus');
  const isOnline = useOfflineStatus();
  const { pendingCount, hasPending, hasFailures, refresh } = useSyncStatus();
  const { swState, installState, installCheckPending, triggerInstall } = usePwaStatus();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isTrusted, setIsTrusted] = useState(() => localStorage.getItem(TRUSTED_KEY) === 'true');
  const [pendingOps, setPendingOps] = useState<PendingOperation[]>([]);

  const menuOpen = Boolean(anchorEl);

  useEffect(() => {
    const readTrust = () => setIsTrusted(localStorage.getItem(TRUSTED_KEY) === 'true');
    const handleStorage = (e: StorageEvent) => {
      if (e.key === TRUSTED_KEY) readTrust();
    };

    readTrust();
    window.addEventListener(TRUST_CHANGED_EVENT, readTrust as EventListener);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(TRUST_CHANGED_EVENT, readTrust as EventListener);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const handleOpen = async (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
    refresh();
    try {
      const ops = await getPendingOps();
      // Most recent first
      setPendingOps([...ops].reverse());
    } catch {}
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
      window.dispatchEvent(new CustomEvent('notes:process-offline-queue'));

      // Wait a bit then refresh status
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await refresh();
    } catch (error) {
      console.error('Manual sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCheckAndSync = async () => {
    setIsChecking(true);
    try {
      // 1. Trigger connectivity check
      window.dispatchEvent(new Event(CONNECTIVITY_CHECK_EVENT));

      // Wait for connectivity check to complete
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 2. Trigger sync (if online and has pending)
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'PROCESS_OFFLINE_QUEUE' });
      }
      window.dispatchEvent(new CustomEvent('notes:process-offline-queue'));

      // Wait then refresh status
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await refresh();
    } catch (error) {
      console.error('Check and sync failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleUndoOp = async (op: PendingOperation) => {
    if (op.id === undefined) return;
    try {
      await removePendingOp(op.id);
      // For delete undo: restore the note to local cache so it survives page reload
      if (op.type === 'delete' && op.noteSnapshot) {
        await cacheNotes([op.noteSnapshot]);
      }
      // Notify useNotes to revert optimistic state
      window.dispatchEvent(new CustomEvent('notes:undo-op', { detail: { op } }));
      // Remove from local list (the next op in queue will now show)
      setPendingOps((prev) => prev.filter((o) => o.id !== op.id));
      await refresh();
    } catch (err) {
      console.error('Undo failed:', err);
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
          {isOnline ? <WifiIcon fontSize="small" /> : <WifiOffIcon fontSize="small" />}
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
        anchorOrigin={{ vertical: 'bottom', horizontal: isMobile ? 'right' : 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: isMobile ? 'right' : 'left' }}
        marginThreshold={8}
        PaperProps={{
          elevation: 3,
          sx: {
            minWidth: isMobile ? 'min(340px, calc(100vw - 32px))' : 288,
            maxWidth: isMobile ? 'calc(100vw - 32px)' : 400,
            overflowX: 'hidden',
          },
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
              <WifiIcon
                sx={(theme) => ({
                  color: theme.palette.mode === 'dark' ? 'success.main' : 'success.dark',
                })}
                fontSize="medium"
              />
            ) : (
              <WifiOffIcon
                sx={(theme) => ({
                  color: theme.palette.mode === 'dark' ? 'warning.main' : 'warning.dark',
                })}
                fontSize="medium"
              />
            )}
          </ListItemIcon>
          <ListItemText
            primary={
              <Typography
                variant="subtitle2"
                fontWeight={600}
                sx={(theme) => ({ color: theme.palette.text.primary })}
              >
                {isOnline ? t('online') : t('offline')}
              </Typography>
            }
            secondary={
              <Typography
                variant="caption"
                sx={(theme) => ({ color: theme.palette.text.secondary })}
              >
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
              <PendingIcon
                sx={(theme) => ({
                  color: theme.palette.mode === 'dark' ? 'warning.main' : 'warning.dark',
                })}
                fontSize="medium"
              />
            ) : (
              <CheckCircleIcon
                sx={(theme) => ({
                  color: theme.palette.mode === 'dark' ? 'success.main' : 'success.dark',
                })}
                fontSize="medium"
              />
            )}
          </ListItemIcon>
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  variant="subtitle2"
                  fontWeight={600}
                  sx={(theme) => ({ color: theme.palette.text.primary })}
                >
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
              <Typography
                variant="caption"
                sx={(theme) => ({ color: theme.palette.text.secondary })}
              >
                {hasPending ? t('pendingOperations', { count: pendingCount }) : t('allSynced')}
              </Typography>
            }
          />
        </MenuItem>

        {/* Pending Operations List */}
        {hasPending && (
          <>
            <Divider />

            {/* Section title */}
            <MenuItem disabled sx={{ opacity: 1, pt: 1.5, pb: 0.5, px: 2 }}>
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
                {t('pendingOpsTitle')}
              </Typography>
            </MenuItem>

            {/* Failure warning chip */}
            {hasFailures && (
              <MenuItem disabled sx={{ opacity: 1, px: 2, pb: 1 }}>
                <Chip
                  icon={<WarningAmberIcon sx={{ fontSize: '0.9rem !important' }} />}
                  label={t('hasFailuresWarning')}
                  size="small"
                  color="error"
                  variant="outlined"
                  sx={{
                    fontSize: '0.65rem',
                    height: 'auto',
                    minHeight: 22,
                    '& .MuiChip-label': { whiteSpace: 'normal', py: 0.25 },
                    maxWidth: '100%',
                  }}
                />
              </MenuItem>
            )}

            {/* Sync-blocked chip: app installed but device not yet trusted — pending ops will never sync */}
            {installState === 'standalone-untrusted' && (
              <MenuItem disabled sx={{ opacity: 1, px: 2, pb: 1 }}>
                <Chip
                  icon={<GppBadIcon sx={{ fontSize: '0.9rem !important' }} />}
                  label={t('syncBlockedUntrustedWarning')}
                  size="small"
                  color="warning"
                  variant="outlined"
                  sx={{
                    fontSize: '0.65rem',
                    height: 'auto',
                    minHeight: 22,
                    '& .MuiChip-label': { whiteSpace: 'normal', py: 0.25 },
                    maxWidth: '100%',
                  }}
                />
              </MenuItem>
            )}

            {/* Last 5 ops, most recent first */}
            {pendingOps.slice(0, 5).map((op) => (
              <MenuItem
                key={op.id}
                disableGutters
                sx={{ py: 0.5, px: 2, gap: 1, minHeight: { xs: 48, sm: 40 } }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  {op.type === 'create' ? (
                    <AddCircleOutlineIcon fontSize="small" color="success" />
                  ) : op.type === 'update' ? (
                    <EditOutlinedIcon fontSize="small" color="primary" />
                  ) : (
                    <DeleteOutlineIcon fontSize="small" color="error" />
                  )}
                </ListItemIcon>

                <ListItemText
                  sx={{ my: 0, flex: 1, minWidth: 0 }}
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Typography
                        variant="caption"
                        fontWeight={600}
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: { xs: '35vw', sm: 110 },
                          display: 'block',
                        }}
                      >
                        {op.noteTitle ??
                          (op.type === 'create'
                            ? t('opCreate')
                            : op.type === 'update'
                              ? t('opUpdate')
                              : t('opDelete'))}
                      </Typography>
                      {(op.failureCount ?? 0) > 0 && (
                        <Chip
                          label={t('opFailed', { count: op.failureCount ?? 0 })}
                          size="small"
                          color="error"
                          sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700 }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Typography
                      variant="caption"
                      sx={(theme) => ({ fontSize: '0.65rem', color: theme.palette.text.secondary })}
                    >
                      {op.type === 'create'
                        ? t('opCreate')
                        : op.type === 'update'
                          ? t('opUpdate')
                          : t('opDelete')}
                    </Typography>
                  }
                />

                <Button
                  size="small"
                  variant="outlined"
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleUndoOp(op);
                  }}
                  sx={{
                    minWidth: { xs: 60, sm: 52 },
                    minHeight: { xs: 36, sm: 28 },
                    fontSize: '0.7rem',
                    py: { xs: 0.5, sm: 0.25 },
                    px: { xs: 1, sm: 0.75 },
                    ml: 'auto',
                    flexShrink: 0,
                  }}
                >
                  {t('opUndo')}
                </Button>
              </MenuItem>
            ))}

            {/* Overflow indicator */}
            {pendingOps.length > 5 && (
              <MenuItem disabled sx={{ opacity: 1, py: 0.5, px: 2 }}>
                <Typography
                  variant="caption"
                  sx={(theme) => ({ color: theme.palette.text.secondary, fontStyle: 'italic' })}
                >
                  {t('opMore', { count: pendingOps.length - 5 })}
                </Typography>
              </MenuItem>
            )}
          </>
        )}

        {/* Manual Check and Sync Button */}
        <Divider />
        <MenuItem
          onClick={handleCheckAndSync}
          disabled={isChecking}
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
            {isChecking ? (
              <CircularProgress size={22} color="primary" />
            ) : (
              <SyncIcon color="primary" fontSize="medium" />
            )}
          </ListItemIcon>
          <ListItemText
            primary={
              <Typography variant="body2" fontWeight={600} color="primary.main">
                {isChecking ? t('checkingAndSyncing') : t('checkAndSync')}
              </Typography>
            }
          />
        </MenuItem>

        {/* Quick Sync Button - only when pending */}
        {isOnline && hasPending && (
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
        )}

        <Divider />

        {/* Install App Button — visible when the browser is ready and device is trusted */}
        {installState === 'installable' && triggerInstall && (
          <>
            <MenuItem
              onClick={() => {
                void triggerInstall();
                handleClose();
              }}
              sx={{
                color: 'primary.main',
                fontWeight: 600,
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <ListItemIcon>
                <InstallMobileIcon color="primary" fontSize="medium" />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="body2" fontWeight={600} color="primary.main">
                    {t('installApp')}
                  </Typography>
                }
              />
            </MenuItem>
            <Divider />
          </>
        )}

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
        <MenuItem disabled sx={{ opacity: 1, py: 1.25, px: 2 }}>
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
            ) : installState === 'standalone-untrusted' ? (
              <PhoneAndroidIcon
                fontSize="small"
                sx={(theme) => ({ color: theme.palette.warning.main })}
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
                        : installState === 'standalone-untrusted'
                          ? theme.palette.warning.main
                          : installState === 'installable'
                            ? theme.palette.primary.main
                            : theme.palette.text.disabled,
                  })}
                >
                  {installState === 'standalone'
                    ? t('installStandalone')
                    : installState === 'standalone-untrusted'
                      ? t('installStandaloneUntrusted')
                      : installState === 'installable'
                        ? t('installInstallable')
                        : installCheckPending
                          ? t('swChecking')
                          : isTrusted
                            ? t('installNotInstallable')
                            : t('installBlockedByTrust')}
                </Typography>
              </Box>
            }
          />
        </MenuItem>

        {/* Device Trust row */}
        <MenuItem disabled sx={{ opacity: 1, py: 1.25, pb: 2, px: 2 }}>
          <ListItemIcon sx={{ minWidth: 40 }}>
            {isTrusted ? (
              <VerifiedUserIcon
                fontSize="small"
                sx={(theme) => ({
                  color:
                    theme.palette.mode === 'dark'
                      ? theme.palette.success.main
                      : theme.palette.success.dark,
                })}
              />
            ) : (
              <GppBadIcon
                fontSize="small"
                sx={(theme) => ({ color: theme.palette.warning.main })}
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
                  {t('trustLabel')}
                </Typography>
                <Typography
                  variant="caption"
                  component="span"
                  fontWeight={600}
                  sx={(theme) => ({
                    fontSize: '0.75rem',
                    color: isTrusted
                      ? theme.palette.mode === 'dark'
                        ? theme.palette.success.main
                        : theme.palette.success.dark
                      : theme.palette.warning.main,
                  })}
                >
                  {isTrusted ? t('trusted') : t('notTrusted')}
                </Typography>
              </Box>
            }
            secondary={
              !isTrusted ? (
                <Typography
                  variant="caption"
                  sx={(theme) => ({ color: theme.palette.text.secondary, fontSize: '0.65rem' })}
                >
                  {t('notTrustedHint')}
                </Typography>
              ) : null
            }
          />
        </MenuItem>
      </Menu>
    </>
  );
}
