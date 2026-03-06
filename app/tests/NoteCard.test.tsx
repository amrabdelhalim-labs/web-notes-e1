/**
 * NoteCard component tests.
 *
 * Covers: rendering (text note, voice note), user interactions.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from './utils';
import NoteCard from '@/app/components/notes/NoteCard';
import type { Note } from '@/app/types';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const textNote: Note = {
  _id: 'note-1',
  title: 'ملاحظة نصية تجريبية',
  content: '<p>محتوى <strong>الملاحظة</strong> هنا</p>',
  type: 'text',
  user: 'user-1',
  createdAt: '2026-03-01T10:00:00.000Z',
  updatedAt: '2026-03-01T10:00:00.000Z',
};

const voiceNote: Note = {
  _id: 'note-2',
  title: 'ملاحظة صوتية',
  type: 'voice',
  audioDuration: 75, // 1:15
  user: 'user-1',
  createdAt: '2026-03-02T08:00:00.000Z',
  updatedAt: '2026-03-02T08:00:00.000Z',
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('NoteCard', () => {
  describe('Text note', () => {
    it('renders the note title', () => {
      render(<NoteCard note={textNote} onEdit={vi.fn()} onDelete={vi.fn()} />);
      expect(screen.getByText('ملاحظة نصية تجريبية')).toBeInTheDocument();
    });

    it('shows "نصية" chip', () => {
      render(<NoteCard note={textNote} onEdit={vi.fn()} onDelete={vi.fn()} />);
      expect(screen.getByText('نصية')).toBeInTheDocument();
    });

    it('strips HTML tags from content preview', () => {
      render(<NoteCard note={textNote} onEdit={vi.fn()} onDelete={vi.fn()} />);
      // Should show plain text, not HTML tags
      expect(screen.getByText(/محتوى/)).toBeInTheDocument();
      expect(screen.queryByText(/<strong>/)).not.toBeInTheDocument();
    });
  });

  describe('Voice note', () => {
    it('renders the note title', () => {
      render(<NoteCard note={voiceNote} onEdit={vi.fn()} onDelete={vi.fn()} />);
      expect(screen.getByText('ملاحظة صوتية')).toBeInTheDocument();
    });

    it('shows "صوتية" chip', () => {
      render(<NoteCard note={voiceNote} onEdit={vi.fn()} onDelete={vi.fn()} />);
      expect(screen.getByText('صوتية')).toBeInTheDocument();
    });

    it('shows formatted duration (1:15)', () => {
      render(<NoteCard note={voiceNote} onEdit={vi.fn()} onDelete={vi.fn()} />);
      expect(screen.getByText(/1:15/)).toBeInTheDocument();
    });
  });

  describe('User interactions', () => {
    it('calls onEdit with the note when edit button is clicked', () => {
      const onEdit = vi.fn();
      render(<NoteCard note={textNote} onEdit={onEdit} onDelete={vi.fn()} />);
      fireEvent.click(screen.getByRole('button', { name: /تعديل/i }));
      expect(onEdit).toHaveBeenCalledOnce();
      expect(onEdit).toHaveBeenCalledWith(textNote);
    });

    it('calls onDelete with the note when delete button is clicked', () => {
      const onDelete = vi.fn();
      render(<NoteCard note={textNote} onEdit={vi.fn()} onDelete={onDelete} />);
      fireEvent.click(screen.getByRole('button', { name: /حذف/i }));
      expect(onDelete).toHaveBeenCalledOnce();
      expect(onDelete).toHaveBeenCalledWith(textNote);
    });
  });
});
