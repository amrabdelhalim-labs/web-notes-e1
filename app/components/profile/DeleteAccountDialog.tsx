'use client';

/**
 * DeleteAccountDialog
 *
 * Double-confirmation dialog for account deletion:
 *   1. Click the delete button → dialog opens with a clear warning
 *   2. Enter password to confirm → calls deleteUserApi → logs out
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
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { useAuth } from '@/app/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { deleteUserApi } from '@/app/lib/api';

export default function DeleteAccountDialog() {
  const { user, logout } = useAuth();
  const router = useRouter();

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
        setError('كلمة المرور مطلوبة لتأكيد حذف الحساب');
        return;
      }

      setSubmitting(true);
      try {
        await deleteUserApi(user._id, password);
        logout();
        router.push('/login');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'فشل حذف الحساب');
      } finally {
        setSubmitting(false);
      }
    },
    [user, password, logout, router],
  );

  return (
    <>
      <Button
        variant="outlined"
        color="error"
        startIcon={<DeleteForeverIcon />}
        onClick={handleOpen}
      >
        حذف الحساب نهائياً
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="xs"
        fullWidth
        aria-labelledby="delete-account-title"
      >
        <Box component="form" onSubmit={handleConfirm} noValidate>
          <DialogTitle id="delete-account-title" sx={{ color: 'error.main' }}>
            حذف الحساب
          </DialogTitle>

          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2 }}>
              هذا الإجراء <strong>نهائي ولا يمكن التراجع عنه</strong>.
              سيتم حذف حسابك وجميع ملاحظاتك بشكل دائم.
            </Alert>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              أدخل كلمة المرور لتأكيد الحذف:
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              label="كلمة المرور"
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
              إلغاء
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="error"
              disabled={submitting || !password}
            >
              {submitting ? <CircularProgress size={22} color="inherit" /> : 'حذف الحساب'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}
