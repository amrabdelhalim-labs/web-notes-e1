'use client';

/**
 * NoteList — grid of NoteCards with search, filter, and pagination.
 */

import { useState } from 'react';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Pagination from '@mui/material/Pagination';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import SearchIcon from '@mui/icons-material/Search';
import AllInboxIcon from '@mui/icons-material/AllInbox';
import StickyNote2Icon from '@mui/icons-material/StickyNote2';
import MicIcon from '@mui/icons-material/Mic';
import InboxIcon from '@mui/icons-material/Inbox';
import type { Note, NoteType } from '@/app/types';
import NoteCard from '@/app/components/notes/NoteCard';
import { useTranslations } from 'next-intl';

interface NoteListProps {
  notes: Note[];
  loading: boolean;
  page: number;
  totalPages: number;
  count: number;
  typeFilter: NoteType | '';
  searchQuery: string;
  onPageChange: (page: number) => void;
  onTypeFilterChange: (type: NoteType | '') => void;
  onSearchChange: (query: string) => void;
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
}

export default function NoteList({
  notes,
  loading,
  page,
  totalPages,
  count,
  typeFilter,
  searchQuery,
  onPageChange,
  onTypeFilterChange,
  onSearchChange,
  onEdit,
  onDelete,
}: NoteListProps) {
  const [searchInput, setSearchInput] = useState(searchQuery);
  const t = useTranslations('NoteList');

  // Debounced search — fires on Enter or blur
  const commitSearch = () => {
    if (searchInput.trim() !== searchQuery) {
      onSearchChange(searchInput.trim());
    }
  };

  return (
    <Stack spacing={3}>
      {/* ── Toolbar: search + filter ── */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ sm: 'center' }}
        flexWrap={{ sm: 'wrap' }}
      >
        <TextField
          placeholder={t('searchPlaceholder')}
          size="small"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && commitSearch()}
          onBlur={commitSearch}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            },
          }}
          sx={{
            flexGrow: 1,
            width: { xs: '100%', sm: 'auto' },
            minWidth: { sm: 200 },
            maxWidth: { sm: 350 },
          }}
        />

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap',
            width: { xs: '100%', sm: 'auto' },
          }}
        >
          <ToggleButtonGroup
            value={typeFilter}
            exclusive
            onChange={(_, v) => onTypeFilterChange((v ?? '') as NoteType | '')}
            size="small"
            sx={{ flexShrink: 0 }}
          >
            <ToggleButton value="" aria-label={t('all')}>
              <AllInboxIcon sx={{ mr: 0.5 }} fontSize="small" />
              {t('all')}
            </ToggleButton>
            <ToggleButton value="text" aria-label={t('text')}>
              <StickyNote2Icon sx={{ mr: 0.5 }} fontSize="small" />
              {t('text')}
            </ToggleButton>
            <ToggleButton value="voice" aria-label={t('voice')}>
              <MicIcon sx={{ mr: 0.5 }} fontSize="small" />
              {t('voice')}
            </ToggleButton>
          </ToggleButtonGroup>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}
          >
            {t('noteCount', { count })}
          </Typography>
        </Box>
      </Stack>

      {/* ── Loading ── */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {/* ── Empty state ── */}
      {!loading && notes.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <InboxIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            {t('emptyTitle')}
          </Typography>
          <Typography variant="body2" color="text.disabled">
            {searchQuery || typeFilter ? t('emptyFilterHint') : t('emptyCreateHint')}
          </Typography>
        </Box>
      )}

      {/* ── Notes grid ── */}
      {!loading && notes.length > 0 && (
        <Grid container spacing={2}>
          {notes.map((note) => (
            <Grid key={note._id} size={{ xs: 12, sm: 6, md: 4 }}>
              <NoteCard note={note} onEdit={onEdit} onDelete={onDelete} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, p) => onPageChange(p)}
            color="primary"
            shape="rounded"
          />
        </Box>
      )}
    </Stack>
  );
}
