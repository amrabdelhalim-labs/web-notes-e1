/**
 * NotesPage Tests
 *
 * Tests the main notes list page (/notes).
 */

import { render, screen, fireEvent } from '@/app/tests/utils';
import NotesPage from '@/app/notes/page';
import type { Note } from '@/app/types';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/notes',
}));

const sampleNote: Note = {
  _id: 'n1',
  title: 'Test Note',
  content: '<p>Body</p>',
  type: 'text',
  user: 'u1',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const mockDeleteNote = vi.fn().mockResolvedValue(undefined);

vi.mock('@/app/hooks/useNotes', () => ({
  useNotes: () => ({
    notes: [sampleNote],
    loading: false,
    error: null,
    page: 1,
    totalPages: 1,
    count: 1,
    typeFilter: '',
    searchQuery: '',
    setPage: vi.fn(),
    setTypeFilter: vi.fn(),
    setSearchQuery: vi.fn(),
    deleteNote: mockDeleteNote,
  }),
}));

// Mock layout to simplify
vi.mock('@/app/components/layout/MainLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock NoteCard
vi.mock('@/app/components/notes/NoteCard', () => ({
  default: ({ note, onEdit, onDelete }: { note: Note; onEdit: (n: Note) => void; onDelete: (n: Note) => void }) => (
    <div data-testid={`note-${note._id}`}>
      <span>{note.title}</span>
      <button data-testid="edit-btn" onClick={() => onEdit(note)}>edit</button>
      <button data-testid="delete-btn" onClick={() => onDelete(note)}>delete</button>
    </div>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('NotesPage', () => {
  it('renders notes list', () => {
    render(<NotesPage />);
    expect(screen.getByText('Test Note')).toBeInTheDocument();
  });

  it('renders FAB for creating new note', () => {
    render(<NotesPage />);
    expect(screen.getByLabelText(/إنشاء ملاحظة جديدة/)).toBeInTheDocument();
  });

  it('navigates to /notes/new when FAB clicked', () => {
    render(<NotesPage />);
    fireEvent.click(screen.getByLabelText(/إنشاء ملاحظة جديدة/));
    expect(mockPush).toHaveBeenCalledWith('/notes/new');
  });

  it('navigates to edit page on edit click', () => {
    render(<NotesPage />);
    fireEvent.click(screen.getByTestId('edit-btn'));
    expect(mockPush).toHaveBeenCalledWith('/notes/n1/edit');
  });

  it('opens delete dialog on delete click', () => {
    render(<NotesPage />);
    fireEvent.click(screen.getByTestId('delete-btn'));
    // Dialog should open with confirm text
    expect(screen.getByText('تأكيد الحذف')).toBeInTheDocument();
  });
});
