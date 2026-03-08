'use client';

import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import PersonIcon from '@mui/icons-material/Person';
import StickyNote2Icon from '@mui/icons-material/StickyNote2';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { useTranslations, useLocale } from 'next-intl';
import MainLayout from '@/app/components/layout/MainLayout';
import ProfileEditor from '@/app/components/profile/ProfileEditor';
import DeleteAccountDialog from '@/app/components/profile/DeleteAccountDialog';
import { useAuth } from '@/app/hooks/useAuth';
import { getNotesApi } from '@/app/lib/api';
import { getCachedNotes } from '@/app/lib/db';

export default function ProfilePage() {
  const t = useTranslations('ProfilePage');
  const locale = useLocale();
  const { user } = useAuth();
  const [noteCount, setNoteCount] = useState<number | null>(null);

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
    ? new Date(user.createdAt).toLocaleDateString(
        locale === 'ar' ? 'ar-EG' : 'en-US',
        { year: 'numeric', month: 'long', day: 'numeric' },
      )
    : '—';

  return (
    <MainLayout>
      <Box sx={{ maxWidth: 680, mx: 'auto', width: '100%' }}>
        <Typography variant="h5" component="h1" fontWeight={700} gutterBottom>
          {t('title')}
        </Typography>

        {user && (
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                <Chip
                  icon={<PersonIcon />}
                  label={user.displayName || user.username}
                  variant="outlined"
                />
                <Chip
                  icon={<StickyNote2Icon />}
                  label={
                    noteCount !== null
                      ? t('noteCount', { count: noteCount })
                      : '...'
                  }
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
    </MainLayout>
  );
}
