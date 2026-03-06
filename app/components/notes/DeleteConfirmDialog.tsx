'use client';

/**
 * DeleteConfirmDialog — confirmation before deleting a note.
 */

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { useState } from 'react';

interface DeleteConfirmDialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function DeleteConfirmDialog({
  open,
  title,
  onClose,
  onConfirm,
}: DeleteConfirmDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>تأكيد الحذف</DialogTitle>
      <DialogContent>
        <DialogContentText>
          هل أنت متأكد من حذف الملاحظة &quot;{title}&quot;؟ لا يمكن التراجع عن هذا الإجراء.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          إلغاء
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleConfirm}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : undefined}
        >
          {loading ? 'جارٍ الحذف...' : 'حذف'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
