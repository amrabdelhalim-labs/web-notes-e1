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
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import { useAuth } from '@/app/hooks/useAuth';
import { updateUserApi, changePasswordApi } from '@/app/lib/api';

// ─── Shared validation ───────────────────────────────────────────────────────────

/** Returns an Arabic error string if the username is invalid, otherwise null. */
function validateUsername(val: string): string | null {
  if (val.length < 3) return 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل';
  if (/\s/.test(val)) return 'لا يسمح بالمسافات في اسم المستخدم';
  if (!/^[a-z0-9._-]+$/.test(val))
    return 'اسم المستخدم يقبل فقط حروفاً صغيرة (a-z)، أرقاماً، ورموز (. _ -)';
  return null;
}

// ─── EditableField ─────────────────────────────────────────────────────────

interface EditableFieldProps {
  label: string;
  fieldId: string;
  value: string;
  type?: string;
  helperText?: string;
  validate?: (val: string) => string | null;
  onSave: (val: string) => Promise<void>;
}

function EditableField({ label, fieldId, value, type = 'text', helperText, onSave, validate }: EditableFieldProps) {
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
      setSuccessMsg(`تم تحديث ${label} بنجاح ✔️`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل الحفظ');
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
            inputProps={{ 'aria-label': label }}
          />
          <IconButton
            color="primary"
            size="small"
            onClick={handleConfirm}
            disabled={saving}
            aria-label={`تأكيد ${label}`}
            sx={{ mt: 0.5, flexShrink: 0 }}
          >
            {saving ? <CircularProgress size={18} /> : <CheckIcon fontSize="small" />}
          </IconButton>
          <IconButton
            size="small"
            onClick={handleCancel}
            disabled={saving}
            aria-label={`إلغاء ${label}`}
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
          <IconButton
            size="small"
            onClick={handleEdit}
            aria-label={`تعديل ${label}`}
            sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' }, flexShrink: 0 }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
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
          تأكيد تغيير {label}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id={`confirm-change-${fieldId}-desc`} component="div">
            <Typography variant="body2" gutterBottom>
              هل تريد تغيير <strong>{label}</strong>؟
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
            aria-label="إلغاء التغيير"
          >
            إلغاء
          </Button>
          <Button
            onClick={handleDialogConfirm}
            variant="contained"
            color="primary"
            disabled={saving}
            aria-label="تأكيد التغيير"
          >
            {saving ? <CircularProgress size={18} color="inherit" /> : 'تأكيد التغيير'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ─── ProfileEditor ─────────────────────────────────────────────────────────

export default function ProfileEditor() {
  const { user, updateUser } = useAuth();

  // ── Password fields ───────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

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
        setPasswordMsg({ type: 'error', text: 'كلمة المرور الحالية مطلوبة' });
        return;
      }
      if (newPassword.length < 6) {
        setPasswordMsg({ type: 'error', text: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' });
        return;
      }
      if (newPassword !== confirmPassword) {
        setPasswordMsg({ type: 'error', text: 'كلمة المرور الجديدة وتأكيدها غير متطابقتين' });
        return;
      }
      if (currentPassword === newPassword) {
        setPasswordMsg({ type: 'error', text: 'كلمة المرور الجديدة يجب أن تختلف عن الحالية' });
        return;
      }

      setPasswordSubmitting(true);
      try {
        const res = await changePasswordApi(user._id, {
          currentPassword,
          newPassword,
          confirmPassword,
        });
        setPasswordMsg({ type: 'success', text: res.message });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } catch (err) {
        setPasswordMsg({
          type: 'error',
          text: err instanceof Error ? err.message : 'فشل تغيير كلمة المرور',
        });
      } finally {
        setPasswordSubmitting(false);
      }
    },
    [user, currentPassword, newPassword, confirmPassword],
  );

  if (!user) return null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* ── Profile Info ──────────────────────────────────────────────── */}
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            البيانات الشخصية
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            اضغط على أيقونة التعديل بجانب أي حقل لتغييره
          </Typography>

          <EditableField
            label="اسم المستخدم"
            fieldId="profile-username"
            value={user.username}
            validate={validateUsername}
            helperText="حروف صغيرة وأرقام ورموز (. _ -) فقط — بدون مسافات"
            onSave={(val) => saveField('username', val)}
          />
          <EditableField
            label="البريد الإلكتروني"
            fieldId="profile-email"
            value={user.email}
            type="email"
            onSave={(val) => saveField('email', val)}
          />
          <EditableField
            label="اسم العرض"
            fieldId="profile-displayName"
            value={user.displayName ?? ''}
            helperText="اختياري — يظهر بدلا من اسم المستخدم"
            onSave={(val) => saveField('displayName', val)}
          />
        </CardContent>
      </Card>

      {/* ── Password Change ───────────────────────────────────────────── */}
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            تغيير كلمة المرور
          </Typography>

          {passwordMsg && (
            <Alert severity={passwordMsg.type} sx={{ mb: 2 }}>
              {passwordMsg.text}
            </Alert>
          )}

          <Box component="form" onSubmit={handlePasswordSubmit} noValidate>
            <TextField
              label="كلمة المرور الحالية"
              type="password"
              fullWidth
              required
              margin="normal"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              disabled={passwordSubmitting}
            />

            <Divider sx={{ my: 1 }} />

            <TextField
              label="كلمة المرور الجديدة"
              type="password"
              fullWidth
              required
              margin="normal"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              disabled={passwordSubmitting}
            />
            <TextField
              label="تأكيد كلمة المرور الجديدة"
              type="password"
              fullWidth
              required
              margin="normal"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              disabled={passwordSubmitting}
            />

            <Button
              type="submit"
              variant="contained"
              disabled={passwordSubmitting}
              sx={{ mt: 2 }}
            >
              {passwordSubmitting ? <CircularProgress size={22} color="inherit" /> : 'تغيير كلمة المرور'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
