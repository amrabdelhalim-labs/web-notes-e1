'use client';

/**
 * ProfileEditor
 *
 * Two sections:
 *   1. Profile info — inline per-field editing (pencil → TextField → ✓/✗)
 *      Each field saves independently via updateUserApi on confirm.
 *   2. Password change — grouped form (fields are logically coupled).
 *
 * Pattern: inspired by the chat-app reference (EditableInput component).
 * Avoids "save all" anti-pattern; gives instant per-field feedback.
 */

import { useState, useCallback, useEffect, useRef, type KeyboardEvent, type SyntheticEvent } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import DevicesIcon from '@mui/icons-material/Devices';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import LaptopIcon from '@mui/icons-material/Laptop';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import { useAuth } from '@/app/hooks/useAuth';
import { updateUserApi, changePasswordApi } from '@/app/lib/api';
import { useTranslations } from 'next-intl';
import type { UserLanguagePref } from '@/app/types';
import { usePushNotifications } from '@/app/hooks/usePushNotifications';
import { usePwaStatus } from '@/app/hooks/usePwaStatus';
import { useDevices } from '@/app/hooks/useDevices';
import { useOfflineStatus } from '@/app/hooks/useOfflineStatus';

// ─── Shared validation ───────────────────────────────────────────────────────────

type TFunc = (key: string) => string;

/** Returns an error string (via t) if the username is invalid, otherwise null. */
function validateUsername(val: string, t: TFunc): string | null {
  if (val.length < 3) return t('usernameErrors.tooShort');
  if (/\s/.test(val)) return t('usernameErrors.hasSpaces');
  if (!/^[a-z0-9._-]+$/.test(val))
    return t('usernameErrors.invalidChars');
  return null;
}

// ─── EditableField ─────────────────────────────────────────────────────────

interface EditableFieldProps {
  label: string;
  fieldId: string;
  value: string;
  type?: string;
  helperText?: string;
  readOnly?: boolean;
  validate?: (val: string) => string | null;
  onSave: (val: string) => Promise<void>;
  t: ReturnType<typeof useTranslations>;
}

function EditableField({ label, fieldId, value, type = 'text', helperText, readOnly, onSave, validate, t }: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  // pendingVal: value waiting for user's confirmation in the dialog
  const [pendingVal, setPendingVal] = useState<string | null>(null);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-dismiss success message after 3 s
  useEffect(() => {
    if (successMsg) {
      successTimer.current = setTimeout(() => setSuccessMsg(null), 3000);
    }
    return () => { if (successTimer.current) clearTimeout(successTimer.current); };
  }, [successMsg]);

  const handleEdit = () => {
    setDraft(value);
    setError(null);
    setSuccessMsg(null);
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setError(null);
  };

  // Step 1: validate + open confirmation dialog
  const handleConfirm = () => {
    const trimmed = draft.trim();
    if (trimmed === value.trim()) { setEditing(false); return; }

    if (validate) {
      const validationErr = validate(trimmed);
      if (validationErr) { setError(validationErr); return; }
    }

    // All client-side checks pass — ask the user to confirm
    setError(null);
    setPendingVal(trimmed);
  };

  // Step 2: user confirmed in dialog — actually save
  const handleDialogConfirm = async () => {
    if (pendingVal === null) return;
    setSaving(true);
    setPendingVal(null);
    try {
      await onSave(pendingVal);
      setEditing(false);
      setSuccessMsg(t('saveSuccess', { label }));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  // Step 2 (cancel): user changed their mind — keep field open
  const handleDialogCancel = () => setPendingVal(null);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') handleConfirm();
    if (e.key === 'Escape') handleCancel();
  };

  return (
    <Box sx={{ py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
        {label}
      </Typography>

      {/* Per-field success confirmation — auto-dismissed after 3 s */}
      {successMsg && !editing && (
        <Stack direction="row" alignItems="center" gap={0.5} mb={0.5}>
          <CheckCircleOutlineIcon sx={{ fontSize: 16, color: 'success.main' }} />
          <Typography variant="caption" color="success.main" role="status" aria-live="polite">
            {successMsg}
          </Typography>
        </Stack>
      )}

      {editing ? (
        <Stack direction="row" alignItems="flex-start" gap={1}>
          <TextField
            id={fieldId}
            value={draft}
            type={type}
            onChange={(e) => setDraft(e.target.value)}
            size="small"
            fullWidth
            autoFocus
            error={!!error}
            helperText={error ?? helperText}
            disabled={saving}
            onKeyDown={handleKeyDown}
            slotProps={{ htmlInput: { 'aria-label': label } }}
          />
          <IconButton
            color="primary"
            size="small"
            onClick={handleConfirm}
            disabled={saving}
            aria-label={t('confirmField', { label })}
            sx={{ mt: 0.5, flexShrink: 0 }}
          >
            {saving ? <CircularProgress size={18} /> : <CheckIcon fontSize="small" />}
          </IconButton>
          <IconButton
            size="small"
            onClick={handleCancel}
            disabled={saving}
            aria-label={t('cancelField', { label })}
            sx={{ mt: 0.5, flexShrink: 0 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      ) : (
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography
            variant="body1"
            sx={{ wordBreak: 'break-word', color: value ? 'text.primary' : 'text.disabled' }}
          >
            {value || '—'}
          </Typography>
          {!readOnly && (
            <IconButton
              size="small"
              onClick={handleEdit}
              aria-label={t('editField', { label })}
              sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' }, flexShrink: 0 }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>
      )}

      {/* ── Confirmation Dialog ───────────────────────────────────────────── */}
      <Dialog
        open={pendingVal !== null}
        onClose={handleDialogCancel}
        aria-labelledby={`confirm-change-${fieldId}-title`}
        aria-describedby={`confirm-change-${fieldId}-desc`}
      >
        <DialogTitle id={`confirm-change-${fieldId}-title`}>
          {t('confirmChangeTitle', { label })}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id={`confirm-change-${fieldId}-desc`} component="div">
            <Typography variant="body2" gutterBottom>
              {t('confirmChangeBody', { label })}
            </Typography>
            <Stack
              direction="row"
              alignItems="center"
              gap={1}
              sx={{
                mt: 1,
                p: 1.5,
                borderRadius: 2,
                bgcolor: 'action.hover',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                wordBreak: 'break-all',
              }}
            >
              <Box component="span" sx={{ color: 'error.main', flexShrink: 0 }}>
                {type === 'password' ? '••••••' : value || '—'}
              </Box>
              <Box component="span" sx={{ color: 'text.secondary', flexShrink: 0 }}>→</Box>
              <Box component="span" sx={{ color: 'success.main', flexShrink: 0 }}>
                {type === 'password' ? '••••••' : pendingVal}
              </Box>
            </Stack>
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            onClick={handleDialogCancel}
            variant="outlined"
            color="inherit"
            aria-label={t('cancelButton')}
          >
            {t('cancelButton')}
          </Button>
          <Button
            onClick={handleDialogConfirm}
            variant="contained"
            color="primary"
            disabled={saving}
            aria-label={t('confirmButton')}
          >
            {saving ? <CircularProgress size={18} color="inherit" /> : t('confirmButton')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ─── ProfileEditor ─────────────────────────────────────────────────────────

export default function ProfileEditor() {
  const { user, updateUser } = useAuth();
  const t = useTranslations('ProfileEditor');
  const isOnline = useOfflineStatus();

  // ── Password fields ───────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  // ── Language preference ───────────────────────────────────────────────
  const [langPref, setLangPref] = useState<UserLanguagePref>(() => user?.language ?? 'unset');
  const [langSaving, setLangSaving] = useState(false);
  const [langMsg, setLangMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ── Push notifications ────────────────────────────────────────────────
  const tp = useTranslations('PushNotifications');
  const { status: pushStatus, subscribe: pushSubscribe, unsubscribe: pushUnsubscribe } = usePushNotifications();
  const { swState } = usePwaStatus();
  
  const swNotReady = swState !== 'active';
  // ── Trusted devices ───────────────────────────────────────────────
  const td = useTranslations('DeviceManager');
  const {
    devices,
    loading: devicesLoading,
    error: devicesError,
    isTrusted: isCurrentDeviceTrusted,
    trustCurrent,
    removeDevice,
  } = useDevices();
  const [trustingDevice, setTrustingDevice] = useState(false);
  const [removingDeviceId, setRemovingDeviceId] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  // Password states for device actions
  const [trustPassword, setTrustPassword] = useState('');
  const [trustPasswordError, setTrustPasswordError] = useState<string | null>(null);
  const [showTrustDialog, setShowTrustDialog] = useState(false);
  const [removePassword, setRemovePassword] = useState('');
  const [removePasswordError, setRemovePasswordError] = useState<string | null>(null);
  // Keep langPref in sync if user updates from another path
  useEffect(() => {
    if (user) setLangPref(user.language);
  }, [user?.language]);

  const saveLangPref = useCallback(
    async (pref: UserLanguagePref) => {
      if (!user) return;
      setLangSaving(true);
      setLangMsg(null);
      try {
        const res = await updateUserApi(user._id, { language: pref });
        updateUser(res.data);
        setLangMsg({ type: 'success', text: t('languageSaveSuccess') });
      } catch (err) {
        setLangMsg({ type: 'error', text: err instanceof Error ? err.message : t('saveFailed') });
      } finally {
        setLangSaving(false);
      }
    },
    [user, updateUser, t],
  );

  // ── Per-field save ────────────────────────────────────────────────────
  const saveField = useCallback(
    async (field: 'username' | 'email' | 'displayName', val: string) => {
      if (!user) return;
      const res = await updateUserApi(user._id, {
        username: field === 'username' ? val : user.username,
        email: field === 'email' ? val : user.email,
        displayName: field === 'displayName' ? val || undefined : user.displayName,
      });
      updateUser(res.data);
    },
    [user, updateUser],
  );

  // ── Password submit ───────────────────────────────────────────────────
  const handlePasswordSubmit = useCallback(
    async (e: SyntheticEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!user) return;
      setPasswordMsg(null);

      if (!currentPassword) {
        setPasswordMsg({ type: 'error', text: t('passwordErrors.currentRequired') });
        return;
      }
      if (newPassword.length < 6) {
        setPasswordMsg({ type: 'error', text: t('passwordErrors.newTooShort') });
        return;
      }
      if (newPassword !== confirmPassword) {
        setPasswordMsg({ type: 'error', text: t('passwordErrors.mismatch') });
        return;
      }
      if (currentPassword === newPassword) {
        setPasswordMsg({ type: 'error', text: t('passwordErrors.sameAsCurrent') });
        return;
      }

      setPasswordSubmitting(true);
      try {
        const res = await changePasswordApi(user._id, {
          currentPassword,
          newPassword,
          confirmPassword,
        });
        setPasswordMsg({ type: 'success', text: res.message || t('passwordErrors.success') });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } catch (err) {
        setPasswordMsg({
          type: 'error',
          text: err instanceof Error ? err.message : t('passwordErrors.failed'),
        });
      } finally {
        setPasswordSubmitting(false);
      }
    },
    [user, currentPassword, newPassword, confirmPassword],
  );

  // ── Trust device (with password) ──────────────────────────────────────
  const handleTrustConfirm = useCallback(async () => {
    if (!trustPassword) return;
    setTrustingDevice(true);
    setTrustPasswordError(null);
    try {
      await trustCurrent(trustPassword);
      setShowTrustDialog(false);
      setTrustPassword('');
    } catch (err) {
      setTrustPasswordError(err instanceof Error ? err.message : td('loadError'));
    } finally {
      setTrustingDevice(false);
    }
  }, [trustPassword, trustCurrent, td]);

  // ── Remove device (with password) ─────────────────────────────────────
  const handleRemoveConfirm = useCallback(async (deviceId: string) => {
    if (!removePassword) return;
    setRemovingDeviceId(deviceId);
    setRemovePasswordError(null);
    try {
      await removeDevice(deviceId, removePassword);
      setConfirmRemoveId(null);
      setRemovePassword('');
    } catch (err) {
      setRemovePasswordError(err instanceof Error ? err.message : td('loadError'));
    } finally {
      setRemovingDeviceId(null);
    }
  }, [removePassword, removeDevice, td]);

  if (!user) return null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* ── Offline notice ────────────────────────────────────────────── */}
      {!isOnline && (
        <Alert severity="info" variant="outlined">
          {t('offlineReadOnly')}
        </Alert>
      )}

      {/* ── Profile Info ──────────────────────────────────────────────── */}
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t('personalInfo')}
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {t('editHint')}
          </Typography>

          <EditableField
            label={t('username')}
            fieldId="profile-username"
            value={user.username}
            validate={(val) => validateUsername(val, t)}
            helperText={t('usernameHelperText')}
            readOnly={!isOnline}
            onSave={(val) => saveField('username', val)}
            t={t}
          />
          <EditableField
            label={t('email')}
            fieldId="profile-email"
            value={user.email}
            type="email"
            readOnly={!isOnline}
            onSave={(val) => saveField('email', val)}
            t={t}
          />
          <EditableField
            label={t('displayName')}
            fieldId="profile-displayName"
            value={user.displayName ?? ''}
            helperText={t('displayNameHelperText')}
            readOnly={!isOnline}
            onSave={(val) => saveField('displayName', val)}
            t={t}
          />
        </CardContent>
      </Card>

      {/* ── Language Preference ───────────────────────────────────────── */}
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t('languagePrefTitle')}
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {t('languagePrefHint')}
          </Typography>

          {langMsg && (
            <Alert severity={langMsg.type} sx={{ mb: 2 }}>
              {langMsg.text}
            </Alert>
          )}

          <FormControl component="fieldset" disabled={langSaving || !isOnline}>
            <FormLabel component="legend" sx={{ mb: 1, fontSize: '0.875rem' }}>
              {t('languagePrefLabel')}
            </FormLabel>
            <RadioGroup
              value={langPref}
              onChange={(e) => {
                const val = e.target.value as UserLanguagePref;
                setLangPref(val);
                saveLangPref(val);
              }}
            >
              <FormControlLabel value="ar" control={<Radio />} label={t('languageAr')} />
              <FormControlLabel value="en" control={<Radio />} label={t('languageEn')} />
              <FormControlLabel value="unset" control={<Radio />} label={t('languageUnset')} />
            </RadioGroup>
          </FormControl>

          {langSaving && <CircularProgress size={18} sx={{ mt: 1 }} />}
        </CardContent>
      </Card>

      {/* ── Push Notifications ────────────────────────────────────────── */}
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" gap={1} mb={1}>
            <NotificationsIcon color="primary" />
            <Typography variant="h6">{tp('title')}</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {tp('hint')}
          </Typography>

          {swNotReady && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">{tp('requiresServiceWorker')}</Typography>
              <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                {tp('serviceWorkerStatus')}: {swState === 'unsupported' ? tp('swUnsupported') : swState === 'checking' ? tp('swChecking') : swState === 'installing' ? tp('swInstalling') : tp('swInactive')}
              </Typography>
            </Alert>
          )}

          {!swNotReady && !isCurrentDeviceTrusted && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {tp('requiresTrust')}
            </Alert>
          )}
          
          {!swNotReady && isCurrentDeviceTrusted && pushStatus === 'unsupported' && (
            <Typography variant="body2" color="text.secondary">
              {tp('unsupported')}
            </Typography>
          )}
          {!swNotReady && isCurrentDeviceTrusted && pushStatus === 'denied' && (
            <Typography variant="body2" color="error">
              {tp('denied')}
            </Typography>
          )}
          {!swNotReady && isCurrentDeviceTrusted && (pushStatus === 'unsubscribed' || pushStatus === 'subscribed') && (
            <Button
              variant={pushStatus === 'subscribed' ? 'outlined' : 'contained'}
              color={pushStatus === 'subscribed' ? 'inherit' : 'primary'}
              startIcon={pushStatus === 'subscribed' ? <NotificationsOffIcon /> : <NotificationsIcon />}
              onClick={pushStatus === 'subscribed' ? pushUnsubscribe : pushSubscribe}
              disabled={!isOnline}
            >
              {pushStatus === 'subscribed' ? tp('unsubscribe') : tp('subscribe')}
            </Button>
          )}
          {pushStatus === 'loading' && <CircularProgress size={24} />}
          {pushStatus === 'subscribed' && (
            <Typography variant="caption" color="success.main" display="block" mt={1}>
              ✔ {tp('subscribed')}
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* ── Trusted Devices ──────────────────────────────────────────── */}
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" gap={1} mb={1}>
            <DevicesIcon color="primary" />
            <Typography variant="h6">{td('title')}</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {td('hint')}
          </Typography>

          {devicesError && (
            <Alert severity="error" sx={{ mb: 2 }}>{td('loadError')}</Alert>
          )}

          {devicesLoading ? (
            <CircularProgress size={24} />
          ) : (
            <>
              {devices.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {td('noDevices')}
                </Typography>
              )}

              {devices.map((device) => (
                <Box
                  key={device.deviceId}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    py: 1.5,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Stack direction="row" alignItems="center" gap={1.5} sx={{ minWidth: 0 }}>
                    {device.os === 'Android' || device.os === 'iOS' ? (
                      <PhoneAndroidIcon color="action" />
                    ) : (
                      <LaptopIcon color="action" />
                    )}
                    <Box sx={{ minWidth: 0 }}>
                      <Stack direction="row" alignItems="center" gap={1}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                          {device.name || `${device.browser} — ${device.os}`}
                        </Typography>
                        {device.isCurrent && (
                          <Chip label={td('currentDevice')} size="small" color="primary" variant="outlined" />
                        )}
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {td('lastSeen', { date: new Date(device.lastSeenAt).toLocaleDateString() })}
                      </Typography>
                    </Box>
                  </Stack>

                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setConfirmRemoveId(device.deviceId)}
                    disabled={removingDeviceId === device.deviceId || !isOnline}
                    aria-label={td('removeButton')}
                  >
                    {removingDeviceId === device.deviceId ? (
                      <CircularProgress size={18} />
                    ) : (
                      <DeleteOutlineIcon fontSize="small" />
                    )}
                  </IconButton>
                </Box>
              ))}

              {!isCurrentDeviceTrusted && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {td('currentNotTrusted')}
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<DevicesIcon />}
                    onClick={() => {
                      setTrustPassword('');
                      setTrustPasswordError(null);
                      setShowTrustDialog(true);
                    }}
                    disabled={trustingDevice || !isOnline}
                  >
                    {td('trustButton')}
                  </Button>
                </Box>
              )}
            </>
          )}

          {/* ── Trust confirmation dialog (with password) ─────────── */}
          <Dialog
            open={showTrustDialog}
            onClose={() => setShowTrustDialog(false)}
            aria-labelledby="trust-device-dialog-title"
          >
            <DialogTitle id="trust-device-dialog-title">{td('trustConfirmTitle')}</DialogTitle>
            <DialogContent>
              <DialogContentText sx={{ mb: 2 }}>{td('trustConfirmBody')}</DialogContentText>
              <TextField
                label={td('passwordLabel')}
                type="password"
                fullWidth
                autoFocus
                value={trustPassword}
                onChange={(e) => { setTrustPassword(e.target.value); setTrustPasswordError(null); }}
                error={!!trustPasswordError}
                helperText={trustPasswordError ?? td('passwordHint')}
                disabled={trustingDevice}
                onKeyDown={(e) => { if (e.key === 'Enter') handleTrustConfirm(); }}
                autoComplete="current-password"
              />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
              <Button onClick={() => setShowTrustDialog(false)} variant="outlined" color="inherit" disabled={trustingDevice}>
                {td('cancelButton')}
              </Button>
              <Button
                variant="contained"
                color="primary"
                disabled={trustingDevice || !trustPassword}
                onClick={handleTrustConfirm}
              >
                {trustingDevice ? <CircularProgress size={18} color="inherit" /> : td('trustButton')}
              </Button>
            </DialogActions>
          </Dialog>

          {/* ── Remove confirmation dialog (with password) ───────────── */}
          <Dialog
            open={confirmRemoveId !== null}
            onClose={() => { setConfirmRemoveId(null); setRemovePassword(''); setRemovePasswordError(null); }}
            aria-labelledby="confirm-remove-device-title"
          >
            <DialogTitle id="confirm-remove-device-title">{td('confirmRemoveTitle')}</DialogTitle>
            <DialogContent>
              <DialogContentText sx={{ mb: 2 }}>{td('confirmRemoveBody')}</DialogContentText>
              <TextField
                label={td('passwordLabel')}
                type="password"
                fullWidth
                autoFocus
                value={removePassword}
                onChange={(e) => { setRemovePassword(e.target.value); setRemovePasswordError(null); }}
                error={!!removePasswordError}
                helperText={removePasswordError ?? td('passwordHint')}
                disabled={!!removingDeviceId}
                onKeyDown={(e) => { if (e.key === 'Enter' && confirmRemoveId) handleRemoveConfirm(confirmRemoveId); }}
                autoComplete="current-password"
              />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
              <Button
                onClick={() => { setConfirmRemoveId(null); setRemovePassword(''); setRemovePasswordError(null); }}
                variant="outlined"
                color="inherit"
                disabled={!!removingDeviceId}
              >
                {td('cancelButton')}
              </Button>
              <Button
                variant="contained"
                color="error"
                disabled={!!removingDeviceId || !removePassword}
                onClick={() => confirmRemoveId && handleRemoveConfirm(confirmRemoveId)}
              >
                {removingDeviceId ? <CircularProgress size={18} color="inherit" /> : td('confirmButton')}
              </Button>
            </DialogActions>
          </Dialog>
        </CardContent>
      </Card>

      {/* ── Password Change ───────────────────────────────────────────── */}
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t('changePassword')}
          </Typography>

          {passwordMsg && (
            <Alert severity={passwordMsg.type} sx={{ mb: 2 }}>
              {passwordMsg.text}
            </Alert>
          )}

          <Box component="form" onSubmit={handlePasswordSubmit} noValidate
            sx={{ opacity: isOnline ? 1 : 0.5, pointerEvents: isOnline ? 'auto' : 'none' }}
          >
            <TextField
              label={t('currentPassword')}
              type="password"
              fullWidth
              required
              margin="normal"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              disabled={passwordSubmitting || !isOnline}
            />

            <Divider sx={{ my: 1 }} />

            <TextField
              label={t('newPassword')}
              type="password"
              fullWidth
              required
              margin="normal"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              disabled={passwordSubmitting || !isOnline}
            />
            <TextField
              label={t('confirmPassword')}
              type="password"
              fullWidth
              required
              margin="normal"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              disabled={passwordSubmitting || !isOnline}
            />

            <Button
              type="submit"
              variant="contained"
              disabled={passwordSubmitting || !isOnline}
              sx={{ mt: 2 }}
            >
              {passwordSubmitting ? <CircularProgress size={22} color="inherit" /> : t('changePasswordButton')}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
