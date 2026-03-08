'use client';

/**
 * DeleteAccountDialog
 *
 * Double-confirmation dialog for account deletion:
 *   1. Click the delete button → dialog opens with a clear warning
 *   2. Enter password to confirm → calls deleteUserApi → logs out
 *
 * The trigger button is disabled while the user is offline — account
 * deletion requires a live server round-trip and cannot be queued.
 */

import { useState, useCallback, type SyntheticEvent } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { useAuth } from '@/app/hooks/useAuth';
import { useRouter } from '@/app/lib/navigation';
import { useOfflineStatus } from '@/app/hooks/useOfflineStatus';
import { deleteUserApi } from '@/app/lib/api';
import { useTranslations } from 'next-intl';

export default function DeleteAccountDialog() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const t = useTranslations('DeleteAccountDialog');
  const isOnline = useOfflineStatus();

  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleOpen = useCallback(() => {
    setOpen(true);
    setPassword('');
    setError('');
  }, []);

  const handleClose = useCallback(() => {
    if (submitting) return;
    setOpen(false);
  }, [submitting]);

  const handleConfirm = useCallback(
    async (e: SyntheticEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!user) return;
      setError('');

      if (!password) {
        setError(t('errors.passwordRequired'));
        return;
      }

      setSubmitting(true);
      try {
        await deleteUserApi(user._id, password);
        logout();
        router.push('/login');
      } catch (err) {
        setError(err instanceof Error ? err.message : t('errors.failed'));
      } finally {
        setSubmitting(false);
      }
    },
    [user, password, logout, router],
  );

  return (
    <>
      <Tooltip
        title={!isOnline ? t('offlineDisabled') : ''}
        arrow
        disableHoverListener={isOnline}
        disableFocusListener={isOnline}
        disableTouchListener={isOnline}
      >
        {/* span needed so Tooltip works on a disabled button */}
        <span>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteForeverIcon />}
            onClick={handleOpen}
            disabled={!isOnline}
            aria-disabled={!isOnline}
          >
            {t('openButton')}
          </Button>
        </span>
      </Tooltip>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="xs"
        fullWidth
        aria-labelledby="delete-account-title"
      >
        <Box component="form" onSubmit={handleConfirm} noValidate>
          <DialogTitle id="delete-account-title" sx={{ color: 'error.main' }}>
            {t('title')}
          </DialogTitle>

          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2 }}>
              {t('warning')}
            </Alert>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t('passwordPrompt')}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              label={t('passwordLabel')}
              type="password"
              fullWidth
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={submitting}
              autoFocus
            />
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleClose} disabled={submitting}>
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="error"
              disabled={submitting || !password}
            >
              {submitting ? <CircularProgress size={22} color="inherit" /> : t('confirm')}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}
