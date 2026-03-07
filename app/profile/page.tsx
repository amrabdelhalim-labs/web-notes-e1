'use client';

/**
 * Profile Page
 *
 * Displays user stats, profile editor, and account deletion.
 * Protected by PrivateRoute (requires authentication).
 */

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
import MainLayout from '@/app/components/layout/MainLayout';
import ProfileEditor from '@/app/components/profile/ProfileEditor';
import DeleteAccountDialog from '@/app/components/profile/DeleteAccountDialog';
import { useAuth } from '@/app/hooks/useAuth';
import { getNotesApi } from '@/app/lib/api';

export default function ProfilePage() {
  const { user } = useAuth();
  const [noteCount, setNoteCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    getNotesApi({ page: 1, limit: 1 })
      .then((res) => {
        if (!cancelled) setNoteCount(res.data.count);
      })
      .catch(() => {
        if (!cancelled) setNoteCount(null);
      });
    return () => { cancelled = true; };
  }, []);

  const joinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  return (
    <MainLayout>
      {/*
        ── Constrained layout column ──────────────────────────────────────
        Profile/settings pages should NOT span full screen width on large
        displays — it hurts readability and makes forms uncomfortably wide.

        Best practice (GitHub, Google Account, Linear, Notion settings):
          • Single centered column, max ~680 px
          • Full width on mobile (xs/sm) — the outer padding from MainLayout handles spacing
          • No two-column layout — settings are read top-to-bottom sequentially
      */}
      <Box sx={{ maxWidth: 680, mx: 'auto', width: '100%' }}>
        <Typography variant="h5" component="h1" fontWeight={700} gutterBottom>
          الملف الشخصي
        </Typography>

        {/* ── Stats ────────────────────────────────────────────────── */}
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
                  label={noteCount !== null ? `${noteCount} ملاحظة` : '...'}
                  variant="outlined"
                />
                <Chip
                  icon={<CalendarMonthIcon />}
                  label={`انضم ${joinDate}`}
                  variant="outlined"
                />
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* ── Profile Editor ───────────────────────────────────────── */}
        <ProfileEditor />

        {/* ── Danger Zone ─────────────────────────────────────────── */}
        <Box sx={{ mt: 4 }}>
          <Divider sx={{ mb: 3 }} />
          <Typography variant="h6" color="error" gutterBottom>
            منطقة الخطر
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            حذف الحساب نهائي ولا يمكن التراجع عنه. سيتم حذف جميع ملاحظاتك.
          </Typography>
          <DeleteAccountDialog />
        </Box>
      </Box>
    </MainLayout>
  );
}
