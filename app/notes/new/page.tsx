'use client';

/**
 * Create Note Page — /notes/new
 *
 * Full-page form for creating a new note (text or voice).
 * Navigates to /notes on success or cancel.
 */

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import MainLayout from '@/app/components/layout/MainLayout';
import NoteEditorForm from '@/app/components/notes/NoteEditorForm';
import { useNotes } from '@/app/hooks/useNotes';
import type { NoteInput, UpdateNoteInput } from '@/app/types';

export default function NewNotePage() {
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
      {/* Page header */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowForwardIcon />}
          onClick={handleCancel}
          sx={{ mb: 1 }}
        >
          الرجوع للملاحظات
        </Button>
        <Typography variant="h5" component="h1" fontWeight={700}>
          ملاحظة جديدة
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
