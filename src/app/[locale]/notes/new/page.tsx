'use client';

import { useCallback } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useTranslations } from 'next-intl';
import MainLayout from '@/app/components/layout/MainLayout';
import NoteEditorForm from '@/app/components/notes/NoteEditorForm';
import { useNotes } from '@/app/hooks/useNotes';
import { useRouter } from '@/app/lib/navigation';
import type { NoteInput, UpdateNoteInput } from '@/app/types';

export default function NewNotePage() {
  const t = useTranslations('NewNotePage');
  const router = useRouter();
  const { createNote } = useNotes({ autoFetch: false });

  const handleSubmit = useCallback(
    async (data: NoteInput | UpdateNoteInput) => {
      await createNote(data as NoteInput);
      router.push('/notes');
    },
    [createNote, router],
  );

  const handleCancel = useCallback(() => {
    router.push('/notes');
  }, [router]);

  return (
    <MainLayout>
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowForwardIcon />}
          onClick={handleCancel}
          sx={{ mb: 1 }}
        >
          {t('back')}
        </Button>
        <Typography variant="h5" component="h1" fontWeight={700}>
          {t('title')}
        </Typography>
      </Box>

      <NoteEditorForm
        mode="create"
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </MainLayout>
  );
}
