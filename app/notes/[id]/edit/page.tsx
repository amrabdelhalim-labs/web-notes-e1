'use client';

/**
 * Edit Note Page — /notes/[id]/edit
 *
 * Fetches the note, then renders NoteEditorForm in edit mode.
 * Navigates back to /notes/[id] on success or cancel.
 */

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import MainLayout from '@/app/components/layout/MainLayout';
import NoteEditorForm from '@/app/components/notes/NoteEditorForm';
import { useNotes } from '@/app/hooks/useNotes';
import type { Note, UpdateNoteInput, NoteInput } from '@/app/types';

interface EditNotePageProps {
  params: Promise<{ id: string }>;
}

export default function EditNotePage({ params }: EditNotePageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { getNote, updateNote } = useNotes({ autoFetch: false });

  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch the note once on mount
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getNote(id)
      .then((data) => {
        if (!cancelled) setNote(data);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : 'لم يتم العثور على الملاحظة');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = useCallback(
    async (data: NoteInput | UpdateNoteInput) => {
      await updateNote(id, data as UpdateNoteInput);
      router.push(`/notes/${id}`);
    },
    [id, updateNote, router],
  );

  const handleCancel = useCallback(() => {
    router.push(`/notes/${id}`);
  }, [id, router]);

  return (
    <MainLayout>
      {/* Page header */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowForwardIcon />}
          onClick={handleCancel}
          sx={{ mb: 1 }}
        >
          الرجوع للملاحظة
        </Button>
        <Typography variant="h5" component="h1" fontWeight={700}>
          {loading ? 'تحميل...' : note ? `تعديل: ${note.title}` : 'تعديل الملاحظة'}
        </Typography>
      </Box>

      {/* Loading */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error fetching note */}
      {error && !loading && (
        <Alert severity="error">{error}</Alert>
      )}

      {/* Form — rendered once the note is loaded */}
      {note && !loading && (
        <NoteEditorForm
          mode="edit"
          initialData={{
            title: note.title,
            type: note.type,
            content: note.content,
            audioData: note.audioData,
            audioDuration: note.audioDuration,
          }}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}
    </MainLayout>
  );
}
