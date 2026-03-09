'use client';

import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import PersonIcon from '@mui/icons-material/Person';
import StickyNote2Icon from '@mui/icons-material/StickyNote2';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useTranslations, useLocale } from 'next-intl';
import MainLayout from '@/app/components/layout/MainLayout';
import ProfileEditor from '@/app/components/profile/ProfileEditor';
import DeleteAccountDialog from '@/app/components/profile/DeleteAccountDialog';
import PwaActivationDialog from '@/app/components/common/PwaActivationDialog';
import { useAuth } from '@/app/hooks/useAuth';
import { getNotesApi } from '@/app/lib/api';
import { getCachedNotes } from '@/app/lib/db';
import { usePwaActivation } from '@/app/context/PwaActivationContext';

export default function ProfilePage() {
  const t = useTranslations('ProfilePage');
  const locale = useLocale();
  const { user } = useAuth();
  const [noteCount, setNoteCount] = useState<number | null>(null);
  const { isActivated, deactivate, isDeactivating } = usePwaActivation();
  const [activationDialogOpen, setActivationDialogOpen] = useState(false);

  // Only show the Activate button when the device is trusted.
  // Re-reads localStorage on storage events and device-trust-changed so the
  // UI updates immediately when trust is granted or revoked remotely.
  const [isTrusted, setIsTrusted] = useState(false);
  useEffect(() => {
    const readTrusted = () => setIsTrusted(localStorage.getItem('device-trusted') === 'true');
    readTrusted();
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'device-trusted') readTrusted();
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('device-trust-changed', readTrusted);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('device-trust-changed', readTrusted);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    getNotesApi({ page: 1, limit: 1 })
      .then((res) => {
        if (!cancelled) setNoteCount(res.data.count);
      })
      .catch(async () => {
        // Offline fallback: count cached notes from IndexedDB
        if (!cancelled) {
          try {
            const cached = await getCachedNotes();
            setNoteCount(cached.length);
          } catch {
            setNoteCount(null);
          }
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const joinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  return (
    <MainLayout>
      <Box sx={{ maxWidth: 680, mx: 'auto', width: '100%' }}>
        <Typography variant="h5" component="h1" fontWeight={700} gutterBottom>
          {t('title')}
        </Typography>

        {user && (
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                <Chip
                  icon={<PersonIcon />}
                  label={user.displayName || user.username}
                  variant="outlined"
                />
                <Chip
                  icon={<StickyNote2Icon />}
                  label={noteCount !== null ? t('noteCount', { count: noteCount }) : '...'}
                  variant="outlined"
                />
                <Chip
                  icon={<CalendarMonthIcon />}
                  label={t('joinDate', { date: joinDate })}
                  variant="outlined"
                />
              </Stack>
            </CardContent>
          </Card>
        )}

        <ProfileEditor />

        {/* ── Offline mode (PWA) activation section ── */}
        <Box sx={{ mt: 4 }}>
          <Divider sx={{ mb: 3 }} />
          <Typography variant="h6" gutterBottom>
            {t('pwaSection')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('pwaSectionHint')}
          </Typography>

          {/* Not activated + device trusted → show activate button */}
          {!isActivated && isTrusted && (
            <Button
              variant="contained"
              startIcon={<WifiOffIcon />}
              onClick={() => setActivationDialogOpen(true)}
            >
              {t('pwaActivateButton')}
            </Button>
          )}

          {/* Active → show status chip + deactivate option */}
          {isActivated && (
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
              <Chip
                icon={<CheckCircleIcon />}
                label={t('pwaActiveLabel')}
                color="success"
                variant="outlined"
              />
              <Button
                size="small"
                color="error"
                onClick={() => deactivate()}
                disabled={isDeactivating}
                startIcon={
                  isDeactivating ? <CircularProgress size={14} color="inherit" /> : undefined
                }
              >
                {t('pwaDeactivateButton')}
              </Button>
            </Stack>
          )}

          {/* Device not trusted AND not activated → inform user */}
          {!isTrusted && !isActivated && (
            <Typography variant="body2" color="text.secondary">
              {t('pwaTrustRequired')}
            </Typography>
          )}
        </Box>

        <Box sx={{ mt: 4 }}>
          <Divider sx={{ mb: 3 }} />
          <Typography variant="h6" color="error" gutterBottom>
            {t('dangerZone')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('dangerWarning')}
          </Typography>
          <DeleteAccountDialog />
        </Box>
      </Box>

      <PwaActivationDialog
        open={activationDialogOpen}
        onClose={() => setActivationDialogOpen(false)}
      />
    </MainLayout>
  );
}
