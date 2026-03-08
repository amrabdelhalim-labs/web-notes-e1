'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StickyNote2Icon from '@mui/icons-material/StickyNote2';
import MicIcon from '@mui/icons-material/Mic';
import { useTranslations } from 'next-intl';
import { sanitizeHtml } from '@/app/utils/sanitize';
import MainLayout from '@/app/components/layout/MainLayout';
import DeleteConfirmDialog from '@/app/components/notes/DeleteConfirmDialog';
import { useNotes } from '@/app/hooks/useNotes';
import { useRouter } from '@/app/lib/navigation';
import { formatDuration, createAudioUrl } from '@/app/utils/audio';
import { formatDateLong } from '@/app/utils/notes';
import type { Note } from '@/app/types';

interface NoteDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function NoteDetailPage({ params }: NoteDetailPageProps) {
  const { id } = use(params);
  const t = useTranslations('NoteDetailPage');
  const router = useRouter();
  const { getNote, deleteNote } = useNotes({ autoFetch: false });

  const [note, setNote] = useState<Note | null>(null);
  const [status, setStatus] = useState<{ loading: boolean; error: string | null }>({
    loading: true,
    error: null,
  });
  const { loading, error } = status;
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getNote(id)
      .then((data) => {
        if (cancelled) return;
        setNote(data);
        if (data.type === 'voice' && data.audioData) {
          setAudioUrl(createAudioUrl(data.audioData));
        }
        setStatus({ loading: false, error: null });
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

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const handleDelete = useCallback(async () => {
    if (!note) return;
    await deleteNote(note._id);
    router.push('/notes');
  }, [note, deleteNote, router]);

  return (
    <MainLayout>
      <Button
        startIcon={
          <ArrowBackIcon
            sx={(theme) => ({ transform: theme.direction === 'rtl' ? 'scaleX(-1)' : undefined })}
          />
        }
        onClick={() => router.push('/notes')}
        sx={{ mb: 2 }}
      >
        {t('back')}
      </Button>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {error && !loading && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {note && !loading && (
        <Paper sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography
                variant="h5"
                component="h1"
                fontWeight={700}
                sx={{ wordBreak: 'break-word' }}
              >
                {note.title}
              </Typography>
              <Stack direction="row" spacing={1} mt={1} alignItems="center" flexWrap="wrap">
                <Chip
                  icon={note.type === 'voice' ? <MicIcon /> : <StickyNote2Icon />}
                  label={note.type === 'voice' ? t('voice') : t('text')}
                  size="small"
                  color={note.type === 'voice' ? 'secondary' : 'primary'}
                  variant="outlined"
                />
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                  {t('lastModified', { date: formatDateLong(note.updatedAt) })}
                </Typography>
              </Stack>
            </Box>

            <Stack direction="row" spacing={1} sx={{ flexShrink: 0, ml: 1 }}>
              <Tooltip title={t('edit')}>
                <IconButton
                  color="primary"
                  onClick={() => router.push(`/notes/${id}/edit`)}
                  aria-label={t('editNote')}
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title={t('delete')}>
                <IconButton
                  color="error"
                  onClick={() => setDeleteOpen(true)}
                  aria-label={t('deleteNote')}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>

          <Divider sx={{ mb: 3 }} />

          {note.type === 'text' ? (
            <Box
              dir="rtl"
              sx={(theme) => ({
                lineHeight: 1.8,
                color: theme.palette.text.primary,
                '& h2': { fontSize: '1.5rem', fontWeight: 700, mt: 2, mb: 1 },
                '& h3': { fontSize: '1.25rem', fontWeight: 600, mt: 1.5, mb: 0.5 },
                '& ul, & ol': { pl: 3, pr: 0 },
                '& blockquote': {
                  borderLeft: `4px solid ${theme.palette.divider}`,
                  pl: 2,
                  ml: 0,
                  color: theme.palette.text.secondary,
                },
                '& mark': {
                  backgroundColor:
                    theme.palette.mode === 'dark'
                      ? 'rgba(255,213,79,0.30)'
                      : 'rgba(255,213,79,0.55)',
                  color: theme.palette.text.primary,
                  borderRadius: '2px',
                  padding: '0 2px',
                },
              })}
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(note.content ?? '') }}
            />
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary" mb={2}>
                {t('audioDuration', { duration: formatDuration(note.audioDuration ?? 0) })}
              </Typography>
              {audioUrl && (
                <audio controls src={audioUrl} style={{ width: '100%', maxWidth: 500 }}>
                  {t('audioUnsupported')}
                </audio>
              )}
            </Box>
          )}
        </Paper>
      )}

      <DeleteConfirmDialog
        open={deleteOpen}
        title={note?.title ?? ''}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />
    </MainLayout>
  );
}
