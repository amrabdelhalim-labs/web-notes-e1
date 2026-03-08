/**
 * NewNotePage Tests
 *
 * Tests the create note page (/notes/new).
 */

import React from 'react';
import { render, screen, fireEvent } from '@/app/tests/utils';
import NewNotePage from '@/app/[locale]/notes/new/page';

const mockPush = vi.fn();
vi.mock('@/app/lib/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/notes/new',
  Link: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => React.createElement('a', { href, ...props }, children),
  redirect: vi.fn(),
}));

const mockCreateNote = vi.fn().mockResolvedValue({ _id: 'new', title: 'Test' });

vi.mock('@/app/hooks/useNotes', () => ({
  useNotes: () => ({
    createNote: mockCreateNote,
  }),
}));

vi.mock('@/app/components/layout/MainLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock NoteEditorForm to simplify page-level tests
vi.mock('@/app/components/notes/NoteEditorForm', () => ({
  default: ({
    mode,
    onSubmit,
    onCancel,
  }: {
    mode: string;
    onSubmit: (data: unknown) => Promise<void>;
    onCancel: () => void;
  }) => (
    <div data-testid="note-editor">
      <span data-testid="editor-mode">{mode}</span>
      <button
        data-testid="submit-btn"
        onClick={() => onSubmit({ title: 'Test', type: 'text', content: 'Body' })}
      >
        submit
      </button>
      <button data-testid="cancel-btn" onClick={onCancel}>
        cancel
      </button>
    </div>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('NewNotePage', () => {
  it('renders page heading', () => {
    render(<NewNotePage />);
    expect(screen.getByText('ملاحظة جديدة')).toBeInTheDocument();
  });

  it('renders back button', () => {
    render(<NewNotePage />);
    expect(screen.getByText(/الرجوع/)).toBeInTheDocument();
  });

  it('renders NoteEditorForm in create mode', () => {
    render(<NewNotePage />);
    expect(screen.getByTestId('editor-mode').textContent).toBe('create');
  });

  it('navigates back on cancel', () => {
    render(<NewNotePage />);
    fireEvent.click(screen.getByTestId('cancel-btn'));
    expect(mockPush).toHaveBeenCalledWith('/notes');
  });

  it('navigates to /notes after submit', async () => {
    render(<NewNotePage />);
    fireEvent.click(screen.getByTestId('submit-btn'));

    // Wait for async submit + navigation
    await vi.waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/notes');
    });
  });

  it('navigates back on back button click', () => {
    render(<NewNotePage />);
    fireEvent.click(screen.getByText(/الرجوع/));
    expect(mockPush).toHaveBeenCalledWith('/notes');
  });
});
