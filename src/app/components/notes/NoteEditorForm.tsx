'use client';

/**
 * NoteEditorForm — shared full-page form for creating and editing notes.
 *
 * Used by:
 *  - /notes/new          (mode = 'create')
 *  - /notes/[id]/edit    (mode = 'edit')
 *
 * The parent page is responsible for:
 *  - Fetching an existing note and passing `initialData`
 *  - Calling the API (createNote / updateNote) inside `onSubmit`
 *  - Navigating away on cancel or success
 *
 * This component owns only form state, validation, and rendering.
 */

import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import StickyNote2Icon from '@mui/icons-material/StickyNote2';
import MicIcon from '@mui/icons-material/Mic';
import type { NoteType, NoteInput, UpdateNoteInput } from '@/app/types';
import RichTextEditor from '@/app/components/notes/RichTextEditor';
import VoiceRecorder from '@/app/components/notes/VoiceRecorder';
import { useTranslations } from 'next-intl';
import { useOfflineStatus } from '@/app/hooks/useOfflineStatus';

export interface NoteEditorInitialData {
  title: string;
  type: NoteType;
  content?: string;
  audioData?: string;
  audioDuration?: number;
}

interface NoteEditorFormProps {
  mode: 'create' | 'edit';
  /** Pre-populated values when editing an existing note */
  initialData?: NoteEditorInitialData;
  /** Parent page calls the API and navigates away on success */
  onSubmit: (data: NoteInput | UpdateNoteInput) => Promise<void>;
  /** Called when the user presses Cancel */
  onCancel: () => void;
}

// Bundle all editable fields into one object so the async re-population
// (when edit page finishes fetching) calls setFields exactly once —
// satisfying the React compiler's "no cascading setState" rule.
type Fields = {
  title: string;
  noteType: NoteType;
  content: string;
  audioData: string | undefined;
  audioDuration: number | undefined;
};

function makeFields(d?: NoteEditorInitialData): Fields {
  return {
    title: d?.title ?? '',
    noteType: d?.type ?? 'text',
    content: d?.content ?? '',
    audioData: d?.audioData,
    audioDuration: d?.audioDuration,
  };
}

export default function NoteEditorForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
}: NoteEditorFormProps) {
  const isEdit = mode === 'edit';
  const t = useTranslations('NoteEditorForm');
  const isOnline = useOfflineStatus();

  // ── Form state ──────────────────────────────────────────────────────────────
  const [fields, setFields] = useState<Fields>(() => makeFields(initialData));
  const { title, noteType, content, audioData, audioDuration } = fields;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Re-populate is handled by the parent mounting NoteEditorForm with
  // key={note._id}. When the key changes the component remounts, which
  // re-runs the useState lazy initializer with the correct initialData.
  // No useEffect is needed here.

  const handleRecorded = useCallback((base64: string, dur: number) => {
    setFields((f) => ({ ...f, audioData: base64, audioDuration: dur }));
  }, []);

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = (): string | null => {
    if (!title.trim()) return t('errors.titleRequired');
    if (title.trim().length > 200) return t('errors.titleTooLong');
    if (noteType === 'text' && !content.trim()) return t('errors.contentRequired');
    if (noteType === 'voice' && !audioData) return t('errors.voiceRequired');
    return null;
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (mode === 'create') {
        const input: NoteInput = {
          title: title.trim(),
          type: noteType,
          ...(noteType === 'text' ? { content } : { audioData, audioDuration }),
        };
        await onSubmit(input);
      } else {
        const input: UpdateNoteInput = { title: title.trim() };
        if (noteType === 'text') input.content = content;
        if (noteType === 'voice' && audioData) {
          input.audioData = audioData;
          input.audioDuration = audioDuration;
        }
        await onSubmit(input);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.saveFailed'));
      setLoading(false);
    }
    // Don't reset loading on success — the parent navigates away,
    // keeping the button in the "saving" state prevents double clicks.
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <Paper sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack spacing={3}>
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {!isOnline && (
          <Alert severity="info" variant="outlined">
            {t('offlineHint')}
          </Alert>
        )}

        {/* Note type — only shown when creating (can't change type of existing note) */}
        {!isEdit && (
          <Stack spacing={1}>
            <Typography variant="body2" fontWeight={600}>
              {t('noteTypeLabel')}
            </Typography>
            <ToggleButtonGroup
              value={noteType}
              exclusive
              onChange={(_, v) => v && setFields((f) => ({ ...f, noteType: v as NoteType }))}
              fullWidth
              color="primary"
            >
              <ToggleButton value="text">
                <StickyNote2Icon sx={{ mr: 1 }} />
                {t('text')}
              </ToggleButton>
              <ToggleButton value="voice">
                <MicIcon sx={{ mr: 1 }} />
                {t('voice')}
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        )}

        {/* Title */}
        <TextField
          label={t('titleLabel')}
          value={title}
          onChange={(e) => setFields((f) => ({ ...f, title: e.target.value }))}
          fullWidth
          required
          slotProps={{ htmlInput: { maxLength: 200 } }}
          autoFocus={!isEdit}
          disabled={loading}
        />

        <Divider />

        {/* Content — rich text or voice recorder */}
        <Box>
          <Typography variant="body2" fontWeight={600} mb={1}>
            {noteType === 'voice' ? t('voiceContentLabel') : t('contentLabel')}
          </Typography>

          {noteType === 'text' ? (
            <RichTextEditor
              content={content}
              onChange={(v) => setFields((f) => ({ ...f, content: v }))}
              placeholder={t('contentPlaceholder')}
              minHeight={320}
              maxHeight="55vh"
            />
          ) : (
            <VoiceRecorder
              onRecorded={handleRecorded}
              initialAudio={isEdit ? audioData : undefined}
              initialDuration={isEdit ? audioDuration : undefined}
            />
          )}
        </Box>

        <Divider />

        {/* Action buttons */}
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button startIcon={<CancelIcon />} onClick={onCancel} disabled={loading}>
            {t('cancel')}
          </Button>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
            onClick={handleSubmit}
            disabled={loading}
          >
            {isEdit ? t('saveEdit') : t('create')}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
