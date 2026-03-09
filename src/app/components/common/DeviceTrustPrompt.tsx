'use client';

/**
 * DeviceTrustPrompt
 *
 * Displays a prompt after successful login asking the user if they want to
 * trust the current device. If declined, the user can still trust the device
 * later from the profile settings.
 *
 * This prompt is shown only once per session after login, and only if the
 * device is not already trusted.
 */

import { useState, useEffect, useCallback } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import DevicesIcon from '@mui/icons-material/Devices';
import Stack from '@mui/material/Stack';
import { useTranslations } from 'next-intl';
import { useDevices } from '@/app/hooks/useDevices';
import { useAuth } from '@/app/hooks/useAuth';

const PROMPT_SHOWN_KEY = 'device-trust-prompt-shown';

export default function DeviceTrustPrompt() {
  const t = useTranslations('DeviceTrustPrompt');
  const { user, loading: authLoading } = useAuth();
  const { isTrusted, trustCurrent } = useDevices();

  const [showPrompt, setShowPrompt] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [trusting, setTrusting] = useState(false);

  // Check if we should show the prompt after login
  useEffect(() => {
    if (authLoading || !user) return;

    // Don't show if already trusted
    if (isTrusted) return;

    // Don't show if already shown in this session
    const wasShown = sessionStorage.getItem(PROMPT_SHOWN_KEY);
    if (wasShown === 'true') return;

    // Show the prompt after a short delay to allow UI to settle
    const timeout = setTimeout(() => {
      setShowPrompt(true);
      sessionStorage.setItem(PROMPT_SHOWN_KEY, 'true');
    }, 800);

    return () => clearTimeout(timeout);
  }, [authLoading, user, isTrusted]);

  const handleTrust = useCallback(async () => {
    if (!password) {
      setError(t('passwordRequired'));
      return;
    }

    setTrusting(true);
    setError(null);

    try {
      await trustCurrent(password);
      setShowPrompt(false);
      setPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('trustError'));
    } finally {
      setTrusting(false);
    }
  }, [password, trustCurrent, t]);

  const handleDecline = useCallback(() => {
    setShowPrompt(false);
    setPassword('');
    setError(null);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && password) {
      handleTrust();
    }
  };

  return (
    <Dialog
      open={showPrompt}
      onClose={handleDecline}
      aria-labelledby="device-trust-prompt-title"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="device-trust-prompt-title">
        <Stack direction="row" alignItems="center" gap={1.5}>
          <DevicesIcon color="primary" />
          {t('title')}
        </Stack>
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>{t('body')}</DialogContentText>
        <DialogContentText sx={{ mb: 2, color: 'text.secondary' }}>
          {t('benefits')}
        </DialogContentText>
        <TextField
          label={t('passwordLabel')}
          type="password"
          fullWidth
          autoFocus
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(null);
          }}
          error={!!error}
          helperText={error ?? t('passwordHint')}
          disabled={trusting}
          onKeyDown={handleKeyDown}
          autoComplete="current-password"
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDecline} variant="outlined" color="inherit" disabled={trusting}>
          {t('declineButton')}
        </Button>
        <Button
          onClick={handleTrust}
          variant="contained"
          color="primary"
          disabled={trusting || !password}
          startIcon={trusting ? <CircularProgress size={18} color="inherit" /> : <DevicesIcon />}
        >
          {trusting ? t('trusting') : t('trustButton')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
