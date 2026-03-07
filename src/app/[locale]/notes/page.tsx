'use client';

import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import { useTranslations } from 'next-intl';
import MainLayout from '@/app/components/layout/MainLayout';
import NoteList from '@/app/components/notes/NoteList';
import DeleteConfirmDialog from '@/app/components/notes/DeleteConfirmDialog';
import { useNotes } from '@/app/hooks/useNotes';
import { useRouter } from '@/app/lib/navigation';
import type { Note } from '@/app/types';

export default function NotesPage() {
  const t = useTranslations('NotesPage');
  const router = useRouter();
  const {
    notes,
    loading,
    error,
    page,
    totalPages,
    count,
    typeFilter,
    searchQuery,
    setPage,
    setTypeFilter,
    setSearchQuery,
    deleteNote,
  } = useNotes();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null);

  const handleEdit = useCallback(
    (note: Note) => {
      router.push(`/notes/${note._id}/edit`);
    },
    [router],
  );

  const handleDeleteClick = useCallback((note: Note) => {
    setDeleteTarget(note);
    setDeleteOpen(true);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    await deleteNote(deleteTarget._id);
  }, [deleteTarget, deleteNote]);

  return (
    <MainLayout>
      <Box sx={{ position: 'relative', pb: 10 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <NoteList
          notes={notes}
          loading={loading}
          page={page}
          totalPages={totalPages}
          count={count}
          typeFilter={typeFilter}
          searchQuery={searchQuery}
          onPageChange={setPage}
          onTypeFilterChange={setTypeFilter}
          onSearchChange={setSearchQuery}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
        />

        {/* FAB — create new note */}
        <Fab
          variant="extended"
          color="primary"
          aria-label={t('createNote')}
          onClick={() => router.push('/notes/new')}
          sx={{
            position: 'fixed',
            bottom: { xs: 20, md: 32 },
            right: { xs: 16, md: 32 },
            gap: { xs: 0, sm: 1 },
            px: { xs: 0, sm: 2.5 },
            width: { xs: 56, sm: 'auto' },
            height: { xs: 56, sm: 48 },
            borderRadius: { xs: '50%', sm: '24px' },
            minWidth: 0,
            zIndex: (theme) => theme.zIndex.fab,
            '&:hover': { boxShadow: 8 },
          }}
        >
          <AddIcon />
          <Typography
            variant="button"
            component="span"
            sx={{ lineHeight: 1, display: { xs: 'none', sm: 'inline' } }}
          >
            {t('newNote')}
          </Typography>
        </Fab>

        <DeleteConfirmDialog
          open={deleteOpen}
          title={deleteTarget?.title ?? ''}
          onClose={() => {
            setDeleteOpen(false);
            setDeleteTarget(null);
          }}
          onConfirm={handleDelete}
        />
      </Box>
    </MainLayout>
  );
}
