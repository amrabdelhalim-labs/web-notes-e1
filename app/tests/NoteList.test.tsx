/**
 * NoteList Component Tests
 *
 * Tests for search, filter, pagination, empty state, and loading.
 */

import { render, screen, fireEvent } from '@/app/tests/utils';
import NoteList from '@/app/components/notes/NoteList';
import type { Note } from '@/app/types';

// Mock NoteCard to simplify
vi.mock('@/app/components/notes/NoteCard', () => ({
  default: ({ note, onEdit, onDelete }: { note: Note; onEdit: (n: Note) => void; onDelete: (n: Note) => void }) => (
    <div data-testid={`note-${note._id}`}>
      <span>{note.title}</span>
      <button onClick={() => onEdit(note)}>edit</button>
      <button onClick={() => onDelete(note)}>delete</button>
    </div>
  ),
}));

const makeNote = (id: string, title: string, type: 'text' | 'voice' = 'text'): Note => ({
  _id: id,
  title,
  content: 'body',
  type,
  user: 'u1',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
});

const defaultProps = {
  notes: [makeNote('1', 'Note One'), makeNote('2', 'Note Two')],
  loading: false,
  page: 1,
  totalPages: 1,
  count: 2,
  typeFilter: '' as const,
  searchQuery: '',
  onPageChange: vi.fn(),
  onTypeFilterChange: vi.fn(),
  onSearchChange: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Rendering ──────────────────────────────────────────────────────────────

describe('NoteList rendering', () => {
  it('renders all notes', () => {
    render(<NoteList {...defaultProps} />);
    expect(screen.getByText('Note One')).toBeInTheDocument();
    expect(screen.getByText('Note Two')).toBeInTheDocument();
  });

  it('shows note count', () => {
    render(<NoteList {...defaultProps} />);
    expect(screen.getByText(/2/)).toBeInTheDocument();
  });

  it('shows loading spinner when loading', () => {
    render(<NoteList {...defaultProps} loading={true} notes={[]} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows empty state when no notes and not loading', () => {
    render(<NoteList {...defaultProps} notes={[]} count={0} />);
    expect(screen.getByText(/لا توجد ملاحظات/)).toBeInTheDocument();
  });

  it('shows search hint in empty state when filter active', () => {
    render(<NoteList {...defaultProps} notes={[]} count={0} typeFilter="voice" />);
    expect(screen.getByText(/تغيير معايير/)).toBeInTheDocument();
  });

  it('shows create hint when no filter/search active', () => {
    render(<NoteList {...defaultProps} notes={[]} count={0} />);
    expect(screen.getByText(/إنشاء/)).toBeInTheDocument();
  });
});

// ─── Search ─────────────────────────────────────────────────────────────────

describe('NoteList search', () => {
  it('calls onSearchChange on Enter key', () => {
    render(<NoteList {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText(/بحث/);
    fireEvent.change(searchInput, { target: { value: 'test query' } });
    fireEvent.keyDown(searchInput, { key: 'Enter' });

    expect(defaultProps.onSearchChange).toHaveBeenCalledWith('test query');
  });

  it('calls onSearchChange on blur', () => {
    render(<NoteList {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText(/بحث/);
    fireEvent.change(searchInput, { target: { value: 'blur test' } });
    fireEvent.blur(searchInput);

    expect(defaultProps.onSearchChange).toHaveBeenCalledWith('blur test');
  });
});

// ─── Filter ─────────────────────────────────────────────────────────────────

describe('NoteList filter', () => {
  it('renders filter buttons', () => {
    render(<NoteList {...defaultProps} />);
    expect(screen.getByText('الكل')).toBeInTheDocument();
    expect(screen.getByText('نصية')).toBeInTheDocument();
    expect(screen.getByText('صوتية')).toBeInTheDocument();
  });
});

// ─── Pagination ─────────────────────────────────────────────────────────────

describe('NoteList pagination', () => {
  it('shows pagination when totalPages > 1', () => {
    render(<NoteList {...defaultProps} totalPages={3} />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('hides pagination when totalPages <= 1', () => {
    render(<NoteList {...defaultProps} totalPages={1} />);
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });
});

// ─── Callbacks ──────────────────────────────────────────────────────────────

describe('NoteList callbacks', () => {
  it('calls onEdit when edit button clicked', () => {
    render(<NoteList {...defaultProps} />);
    fireEvent.click(screen.getAllByText('edit')[0]);
    expect(defaultProps.onEdit).toHaveBeenCalledWith(defaultProps.notes[0]);
  });

  it('calls onDelete when delete button clicked', () => {
    render(<NoteList {...defaultProps} />);
    fireEvent.click(screen.getAllByText('delete')[0]);
    expect(defaultProps.onDelete).toHaveBeenCalledWith(defaultProps.notes[0]);
  });
});
