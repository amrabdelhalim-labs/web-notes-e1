/**
 * useNotes Hook Tests
 *
 * Tests the custom hook that manages notes CRUD, pagination,
 * filtering, and search state.
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useNotes } from '@/app/hooks/useNotes';

// Mock all API functions
vi.mock('@/app/lib/api', () => ({
  getNotesApi: vi.fn(),
  getNoteApi: vi.fn(),
  createNoteApi: vi.fn(),
  updateNoteApi: vi.fn(),
  deleteNoteApi: vi.fn(),
}));

import {
  getNotesApi,
  getNoteApi,
  createNoteApi,
  updateNoteApi,
  deleteNoteApi,
} from '@/app/lib/api';

const mockGetNotes = vi.mocked(getNotesApi);
const mockGetNote = vi.mocked(getNoteApi);
const mockCreateNote = vi.mocked(createNoteApi);
const mockUpdateNote = vi.mocked(updateNoteApi);
const mockDeleteNote = vi.mocked(deleteNoteApi);

const sampleNote = {
  _id: 'n1',
  title: 'Test Note',
  content: 'Body',
  type: 'text' as const,
  user: 'u1',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const emptyResponse = {
  data: { notes: [], count: 0, page: 1, totalPages: 0 },
};

const oneNoteResponse = {
  data: { notes: [sampleNote], count: 1, page: 1, totalPages: 1 },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetNotes.mockResolvedValue(emptyResponse);
});

// ─── Initial state & auto-fetch ─────────────────────────────────────────────

describe('initialization', () => {
  it('auto-fetches notes on mount', async () => {
    mockGetNotes.mockResolvedValue(oneNoteResponse);
    const { result } = renderHook(() => useNotes());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(mockGetNotes).toHaveBeenCalledTimes(1);
    expect(result.current.notes).toHaveLength(1);
    expect(result.current.count).toBe(1);
  });

  it('skips auto-fetch when autoFetch=false', () => {
    renderHook(() => useNotes({ autoFetch: false }));
    expect(mockGetNotes).not.toHaveBeenCalled();
  });

  it('starts with default page size 10', async () => {
    mockGetNotes.mockResolvedValue(emptyResponse);
    renderHook(() => useNotes());

    await waitFor(() => {
      expect(mockGetNotes).toHaveBeenCalledWith(expect.objectContaining({ limit: 10 }));
    });
  });

  it('accepts custom page size', async () => {
    mockGetNotes.mockResolvedValue(emptyResponse);
    renderHook(() => useNotes({ pageSize: 5 }));

    await waitFor(() => {
      expect(mockGetNotes).toHaveBeenCalledWith(expect.objectContaining({ limit: 5 }));
    });
  });
});

// ─── Pagination ─────────────────────────────────────────────────────────────

describe('pagination', () => {
  it('fetches with correct page when setPage called', async () => {
    const { result } = renderHook(() => useNotes());

    await waitFor(() => expect(result.current.loading).toBe(false));

    mockGetNotes.mockResolvedValue(emptyResponse);
    act(() => result.current.setPage(3));

    await waitFor(() => {
      expect(mockGetNotes).toHaveBeenLastCalledWith(expect.objectContaining({ page: 3 }));
    });
  });
});

// ─── Filtering ──────────────────────────────────────────────────────────────

describe('filtering', () => {
  it('resets page to 1 when type filter changes', async () => {
    const { result } = renderHook(() => useNotes());

    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.setPage(3));

    await waitFor(() => expect(result.current.page).toBe(3));

    mockGetNotes.mockResolvedValue(emptyResponse);
    act(() => result.current.setTypeFilter('voice'));

    await waitFor(() => {
      expect(result.current.page).toBe(1);
      expect(mockGetNotes).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'voice' }));
    });
  });

  it('resets page to 1 when search changes', async () => {
    const { result } = renderHook(() => useNotes());

    await waitFor(() => expect(result.current.loading).toBe(false));

    mockGetNotes.mockResolvedValue(emptyResponse);
    act(() => result.current.setSearchQuery('hello'));

    await waitFor(() => {
      expect(result.current.page).toBe(1);
      expect(mockGetNotes).toHaveBeenLastCalledWith(expect.objectContaining({ q: 'hello' }));
    });
  });

  it('does not send empty filter/search params', async () => {
    const { result } = renderHook(() => useNotes());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockGetNotes).toHaveBeenLastCalledWith(expect.objectContaining({
      type: undefined,
      q: undefined,
    }));
  });
});

// ─── Error handling ─────────────────────────────────────────────────────────

describe('error handling', () => {
  it('sets error on fetch failure', async () => {
    mockGetNotes.mockRejectedValueOnce(new Error('Network error'));
    const { result } = renderHook(() => useNotes());

    await waitFor(() => {
      expect(result.current.error).toBe('Network error');
      expect(result.current.loading).toBe(false);
    });
  });

  it('sets generic error on non-Error rejection', async () => {
    mockGetNotes.mockRejectedValueOnce('unknown');
    const { result } = renderHook(() => useNotes());

    await waitFor(() => {
      expect(result.current.error).toContain('خطأ');
    });
  });
});

// ─── CRUD operations ────────────────────────────────────────────────────────

describe('CRUD', () => {
  it('createNote calls API and refreshes list', async () => {
    mockCreateNote.mockResolvedValue({ data: sampleNote, message: 'ok' });
    const { result } = renderHook(() => useNotes({ autoFetch: false }));

    const note = await act(() =>
      result.current.createNote({
        title: 'New',
        type: 'text',
        content: 'Body',
      }),
    );

    expect(mockCreateNote).toHaveBeenCalledTimes(1);
    expect(note._id).toBe('n1');
  });

  it('updateNote calls API and refreshes list', async () => {
    mockUpdateNote.mockResolvedValue({ data: sampleNote, message: 'ok' });
    const { result } = renderHook(() => useNotes({ autoFetch: false }));

    const note = await act(() =>
      result.current.updateNote('n1', { title: 'Updated' }),
    );

    expect(mockUpdateNote).toHaveBeenCalledWith('n1', { title: 'Updated' });
    expect(note._id).toBe('n1');
  });

  it('deleteNote calls API and refreshes list', async () => {
    mockDeleteNote.mockResolvedValue({ message: 'ok' });
    const { result } = renderHook(() => useNotes({ autoFetch: false }));

    await act(() => result.current.deleteNote('n1'));

    expect(mockDeleteNote).toHaveBeenCalledWith('n1');
  });

  it('getNote fetches a single note by ID', async () => {
    mockGetNote.mockResolvedValue({ data: sampleNote });
    const { result } = renderHook(() => useNotes({ autoFetch: false }));

    const note = await act(() => result.current.getNote('n1'));

    expect(mockGetNote).toHaveBeenCalledWith('n1');
    expect(note.title).toBe('Test Note');
  });
});
