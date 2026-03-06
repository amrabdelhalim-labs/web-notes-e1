'use client';

import { useRouter } from 'next/navigation';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import CardActionArea from '@mui/material/CardActionArea';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StickyNote2Icon from '@mui/icons-material/StickyNote2';
import MicIcon from '@mui/icons-material/Mic';
import type { Note } from '@/app/types';
import { formatDuration } from '@/app/utils/audio';
import { stripHtml, formatDateShort } from '@/app/utils/notes';

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
}

export default function NoteCard({ note, onEdit, onDelete }: NoteCardProps) {
  const router = useRouter();
  const isVoice = note.type === 'voice';
  const preview = isVoice
    ? `تسجيل صوتي — ${formatDuration(note.audioDuration ?? 0)}`
    : stripHtml(note.content ?? '');

  return (
    <Card
      variant="outlined"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'box-shadow 0.2s, transform 0.2s, border-color 0.2s',
        '&:hover': {
          boxShadow: (t) =>
            t.palette.mode === 'dark'
              ? '0 4px 20px rgba(0,0,0,0.6)'
              : '0 4px 20px rgba(0,0,0,0.15)',
          borderColor: 'primary.main',
          transform: 'translateY(-2px)',
        },
      }}
    >
      {/* Clickable area → navigates to note detail/view page */}
      <CardActionArea
        onClick={() => router.push(`/notes/${note._id}`)}
        sx={{ flexGrow: 1, alignItems: 'flex-start', display: 'flex', flexDirection: 'column' }}
      >
        <CardContent sx={{ width: '100%' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
            <Typography variant="h6" component="h3" noWrap sx={{ fontWeight: 600, flexGrow: 1 }}>
              {note.title}
            </Typography>
            <Chip
              icon={isVoice ? <MicIcon /> : <StickyNote2Icon />}
              label={isVoice ? 'صوتية' : 'نصية'}
              size="small"
              color={isVoice ? 'secondary' : 'primary'}
              variant="outlined"
              sx={{ mr: 1, flexShrink: 0 }}
            />
          </Stack>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mb: 1.5,
              lineHeight: 1.6,
            }}
          >
            {preview}
          </Typography>

          {/* Date — text.secondary for clear readability */}
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
            {formatDateShort(note.updatedAt)}
          </Typography>
        </CardContent>
      </CardActionArea>

      <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
        <Tooltip title="تعديل">
          <IconButton
            size="small"
            color="primary"
            onClick={(e) => { e.stopPropagation(); onEdit(note); }}
            aria-label="تعديل الملاحظة"
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="حذف">
          <IconButton
            size="small"
            color="error"
            onClick={(e) => { e.stopPropagation(); onDelete(note); }}
            aria-label="حذف الملاحظة"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
}
