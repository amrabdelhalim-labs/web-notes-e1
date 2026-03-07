/**
 * NoteDetailPage Tests
 *
 * Tests the note view page (/notes/[id]).
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@/app/tests/utils';
import NoteDetailPage from '@/app/[locale]/notes/[id]/page';
import type { Note } from '@/app/types';

const mockPush = vi.fn();
vi.mock('@/app/lib/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/notes/n1',
  Link: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) =>
    React.createElement('a', { href, ...props }, children),
  redirect: vi.fn(),
}));

const sampleNote: Note = {
  _id: 'n1',
  title: 'Test Note',
  content: '<p>Rich content here</p>',
  type: 'text',
  user: 'u1',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-03-01T12:00:00Z',
};

const voiceNote: Note = {
  _id: 'n2',
  title: 'Voice Note',
  type: 'voice',
  audioData: 'SGVsbG8=',
  audioDuration: 90,
  user: 'u1',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-03-01T12:00:00Z',
};

let mockGetNote: ReturnType<typeof vi.fn<(...args: unknown[]) => unknown>>;
const mockDeleteNote = vi.fn().mockResolvedValue(undefined);

vi.mock('@/app/hooks/useNotes', () => ({
  useNotes: () => ({
    getNote: (...args: unknown[]) => mockGetNote(...args),
    deleteNote: mockDeleteNote,
  }),
}));

vi.mock('@/app/components/layout/MainLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock audio utils to avoid Blob issues
vi.mock('@/app/utils/audio', () => ({
  formatDuration: (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`,
  createAudioUrl: () => 'blob:mock-url',
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockGetNote = vi.fn().mockResolvedValue(sampleNote);
});

// React 19's use() reads synchronously if promise has 'status'+'value' set
function resolvedParams(id: string): Promise<{ id: string }> {
  const value = { id };
  const p = Promise.resolve(value) as Promise<{ id: string }> & { status: string; value: { id: string } };
  p.status = 'fulfilled';
  p.value = value;
  return p;
}

function renderPage(id = 'n1') {
  return render(<NoteDetailPage params={resolvedParams(id)} />);
}

describe('NoteDetailPage', () => {
  it('shows loading then note title', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Test Note')).toBeInTheDocument();
    });
  });

  it('shows back button', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/الرجوع/)).toBeInTheDocument();
    });
  });

  it('shows note type chip for text note', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('نصية')).toBeInTheDocument();
    });
  });

  it('renders HTML content for text note', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Rich content here')).toBeInTheDocument();
    });
  });

  it('shows edit and delete buttons', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByLabelText(/تعديل/)).toBeInTheDocument();
      expect(screen.getByLabelText(/حذف/)).toBeInTheDocument();
    });
  });

  it('navigates to edit page on edit click', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByLabelText(/تعديل/)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText(/تعديل/));
    expect(mockPush).toHaveBeenCalledWith('/notes/n1/edit');
  });

  it('opens delete dialog on delete click', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByLabelText(/حذف/)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText(/حذف/));
    expect(screen.getByText('تأكيد الحذف')).toBeInTheDocument();
  });

  it('shows error state on fetch failure', async () => {
    mockGetNote = vi.fn().mockRejectedValue(new Error('Not found'));
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Not found')).toBeInTheDocument();
    });
  });

  it('shows voice player for voice note', async () => {
    mockGetNote = vi.fn().mockResolvedValue(voiceNote);
    renderPage('n2');

    await waitFor(() => {
      expect(screen.getByText('Voice Note')).toBeInTheDocument();
      expect(screen.getByText('صوتية')).toBeInTheDocument();
      expect(screen.getByText(/1:30/)).toBeInTheDocument();
    });
  });
});
