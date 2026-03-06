'use client';

/**
 * Note Detail Page — /notes/[id]
 *
 * View-only display of a single note (rich text or voice playback).
 * Edit → /notes/[id]/edit, Delete → in-place confirm dialog.
 */

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
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
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StickyNote2Icon from '@mui/icons-material/StickyNote2';
import MicIcon from '@mui/icons-material/Mic';
import MainLayout from '@/app/components/layout/MainLayout';
import DeleteConfirmDialog from '@/app/components/notes/DeleteConfirmDialog';
import { useNotes } from '@/app/hooks/useNotes';
import { formatDuration, createAudioUrl } from '@/app/utils/audio';
import { formatDateLong } from '@/app/utils/notes';
import type { Note } from '@/app/types';

interface NoteDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function NoteDetailPage({ params }: NoteDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { getNote, deleteNote } = useNotes({ autoFetch: false });

  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Fetch note on mount
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getNote(id)
      .then((data) => {
        if (cancelled) return;
        setNote(data);
        if (data.type === 'voice' && data.audioData) {
          setAudioUrl(createAudioUrl(data.audioData));
        }
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

  // Revoke audio blob URL on unmount
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
      {/* Back button */}
      <Button
        startIcon={<ArrowForwardIcon />}
        onClick={() => router.push('/notes')}
        sx={{ mb: 2 }}
      >
        الرجوع للملاحظات
      </Button>

      {/* Loading */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error */}
      {error && !loading && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Note */}
      {note && !loading && (
        <Paper sx={{ p: { xs: 2, sm: 3 } }}>
          {/* Header */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
            mb={2}
          >
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="h5" component="h1" fontWeight={700} sx={{ wordBreak: 'break-word' }}>
                {note.title}
              </Typography>
              <Stack direction="row" spacing={1} mt={1} alignItems="center" flexWrap="wrap">
                <Chip
                  icon={note.type === 'voice' ? <MicIcon /> : <StickyNote2Icon />}
                  label={note.type === 'voice' ? 'صوتية' : 'نصية'}
                  size="small"
                  color={note.type === 'voice' ? 'secondary' : 'primary'}
                  variant="outlined"
                />
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                  آخر تعديل: {formatDateLong(note.updatedAt)}
                </Typography>
              </Stack>
            </Box>

            <Stack direction="row" spacing={1} sx={{ flexShrink: 0, ml: 1 }}>
              <Tooltip title="تعديل">
                <IconButton
                  color="primary"
                  onClick={() => router.push(`/notes/${id}/edit`)}
                  aria-label="تعديل الملاحظة"
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="حذف">
                <IconButton
                  color="error"
                  onClick={() => setDeleteOpen(true)}
                  aria-label="حذف الملاحظة"
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>

          <Divider sx={{ mb: 3 }} />

          {/* Content */}
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
              dangerouslySetInnerHTML={{ __html: note.content ?? '' }}
            />
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary" mb={2}>
                مدة التسجيل: {formatDuration(note.audioDuration ?? 0)}
              </Typography>
              {audioUrl && (
                <audio controls src={audioUrl} style={{ width: '100%', maxWidth: 500 }}>
                  المتصفح لا يدعم تشغيل الصوت
                </audio>
              )}
            </Box>
          )}
        </Paper>
      )}

      {/* Delete confirmation */}
      <DeleteConfirmDialog
        open={deleteOpen}
        title={note?.title ?? ''}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />
    </MainLayout>
  );
}
