/**
 * EditNotePage Tests
 *
 * Tests the edit note page (/notes/[id]/edit).
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@/app/tests/utils';
import EditNotePage from '@/app/[locale]/notes/[id]/edit/page';
import type { Note } from '@/app/types';

const mockPush = vi.fn();
vi.mock('@/app/lib/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/notes/n1/edit',
  Link: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) =>
    React.createElement('a', { href, ...props }, children),
  redirect: vi.fn(),
}));

const sampleNote: Note = {
  _id: 'n1',
  title: 'Existing Note',
  content: '<p>Existing content</p>',
  type: 'text',
  user: 'u1',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-03-01T12:00:00Z',
};

let mockGetNote: ReturnType<typeof vi.fn<(...args: unknown[]) => unknown>>;
const mockUpdateNote = vi.fn().mockResolvedValue(sampleNote);

vi.mock('@/app/hooks/useNotes', () => ({
  useNotes: () => ({
    getNote: (...args: unknown[]) => mockGetNote(...args),
    updateNote: mockUpdateNote,
  }),
}));

vi.mock('@/app/components/layout/MainLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock NoteEditorForm
vi.mock('@/app/components/notes/NoteEditorForm', () => ({
  default: ({ mode, initialData, onSubmit, onCancel }: {
    mode: string;
    initialData?: { title: string };
    onSubmit: (data: unknown) => Promise<void>;
    onCancel: () => void;
  }) => (
    <div data-testid="note-editor">
      <span data-testid="editor-mode">{mode}</span>
      <span data-testid="editor-title">{initialData?.title}</span>
      <button data-testid="submit-btn" onClick={() => onSubmit({ title: 'Updated' })}>save</button>
      <button data-testid="cancel-btn" onClick={onCancel}>cancel</button>
    </div>
  ),
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
  return render(<EditNotePage params={resolvedParams(id)} />);
}

describe('EditNotePage', () => {
  it('shows heading with note title after load', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/تعديل: Existing Note/)).toBeInTheDocument();
    });
  });

  it('renders NoteEditorForm in edit mode', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('editor-mode').textContent).toBe('edit');
    });
  });

  it('passes note data to editor', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('editor-title').textContent).toBe('Existing Note');
    });
  });

  it('navigates back to note detail on cancel', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('cancel-btn')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('cancel-btn'));
    expect(mockPush).toHaveBeenCalledWith('/notes/n1');
  });

  it('navigates back to note after successful save', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('submit-btn')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('submit-btn'));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/notes/n1');
    });
  });

  it('shows error when note not found', async () => {
    mockGetNote = vi.fn().mockRejectedValue(new Error('لم يتم العثور على الملاحظة'));
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('لم يتم العثور على الملاحظة')).toBeInTheDocument();
    });
  });

  it('shows back button', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/الرجوع/)).toBeInTheDocument();
    });
  });
});
