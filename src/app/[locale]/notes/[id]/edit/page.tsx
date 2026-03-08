'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useTranslations } from 'next-intl';
import MainLayout from '@/app/components/layout/MainLayout';
import NoteEditorForm from '@/app/components/notes/NoteEditorForm';
import { useNotes } from '@/app/hooks/useNotes';
import { useRouter } from '@/app/lib/navigation';
import type { Note, UpdateNoteInput, NoteInput } from '@/app/types';

interface EditNotePageProps {
  params: Promise<{ id: string }>;
}

export default function EditNotePage({ params }: EditNotePageProps) {
  const { id } = use(params);
  const t = useTranslations('EditNotePage');
  const router = useRouter();
  const { getNote, updateNote } = useNotes({ autoFetch: false });

  const [note, setNote] = useState<Note | null>(null);
  const [status, setStatus] = useState<{ loading: boolean; error: string | null }>({
    loading: true,
    error: null,
  });
  const { loading, error } = status;

  useEffect(() => {
    let cancelled = false;

    getNote(id)
      .then((data) => {
        if (!cancelled) {
          setNote(data);
          setStatus({ loading: false, error: null });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : t('notFound');
          setStatus({ loading: false, error: msg });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = useCallback(
    async (data: NoteInput | UpdateNoteInput) => {
      await updateNote(id, data as UpdateNoteInput);
      router.push(`/notes/${id}`);
    },
    [id, updateNote, router]
  );

  const handleCancel = useCallback(() => {
    router.push(`/notes/${id}`);
  }, [id, router]);

  return (
    <MainLayout>
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={
            <ArrowBackIcon
              sx={(theme) => ({ transform: theme.direction === 'rtl' ? 'scaleX(-1)' : undefined })}
            />
          }
          onClick={handleCancel}
          sx={{ mb: 1 }}
        >
          {t('backToNote')}
        </Button>
        <Typography variant="h5" component="h1" fontWeight={700}>
          {loading
            ? t('loading')
            : note
              ? t('editTitle', { title: note.title })
              : t('editFallback')}
        </Typography>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {error && !loading && <Alert severity="error">{error}</Alert>}

      {note && !loading && (
        <NoteEditorForm
          key={note._id}
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
