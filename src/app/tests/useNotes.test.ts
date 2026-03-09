/**
 * useNotes Hook Tests
 *
 * Tests the custom hook that manages notes CRUD, pagination,
 * filtering, and search state.
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useNotes } from '@/app/hooks/useNotes';
import type { Device } from '@/app/types';

// Mock all API functions
vi.mock('@/app/lib/api', () => ({
  getNotesApi: vi.fn(),
  getNoteApi: vi.fn(),
  createNoteApi: vi.fn(),
  updateNoteApi: vi.fn(),
  deleteNoteApi: vi.fn(),
  getDevicesApi: vi.fn(),
}));

let mockOnlineStatus = true;
vi.mock('@/app/hooks/useOfflineStatus', () => ({
  useOfflineStatus: () => mockOnlineStatus,
}));

vi.mock('@/app/lib/db', () => ({
  getCachedNotes: vi.fn().mockResolvedValue([]),
  cacheNotes: vi.fn().mockResolvedValue(undefined),
  cleanStaleNotes: vi.fn().mockResolvedValue(0),
  enqueuePendingOp: vi.fn().mockResolvedValue(undefined),
  getPendingOps: vi.fn().mockResolvedValue([]),
  removePendingOp: vi.fn().mockResolvedValue(undefined),
  removeCachedNote: vi.fn().mockResolvedValue(undefined),
  incrementPendingOpFailure: vi.fn().mockResolvedValue(undefined),
}));

import {
  getNotesApi,
  getNoteApi,
  createNoteApi,
  updateNoteApi,
  deleteNoteApi,
  getDevicesApi,
} from '@/app/lib/api';

import {
  getCachedNotes,
  enqueuePendingOp,
  getPendingOps,
  removePendingOp,
  removeCachedNote,
  incrementPendingOpFailure,
  cacheNotes,
  cleanStaleNotes,
} from '@/app/lib/db';

const mockGetCachedNotes = vi.mocked(getCachedNotes);
const mockEnqueuePendingOp = vi.mocked(enqueuePendingOp);
const mockGetPendingOps = vi.mocked(getPendingOps);
const mockRemovePendingOp = vi.mocked(removePendingOp);
const mockRemoveCachedNote = vi.mocked(removeCachedNote);
const mockIncrementPendingOpFailure = vi.mocked(incrementPendingOpFailure);
const mockCleanStaleNotes = vi.mocked(cleanStaleNotes);

const mockGetNotes = vi.mocked(getNotesApi);
const mockGetNote = vi.mocked(getNoteApi);
const mockCreateNote = vi.mocked(createNoteApi);
const mockUpdateNote = vi.mocked(updateNoteApi);
const mockDeleteNote = vi.mocked(deleteNoteApi);
const mockGetDevices = vi.mocked(getDevicesApi);

const sampleNote = {
  _id: 'n1',
  title: 'Test Note',
  content: 'Body',
  type: 'text' as const,
  user: 'u1',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  _cachedAt: Date.now(),
};

const emptyResponse = {
  data: { notes: [], count: 0, page: 1, totalPages: 0 },
};

const oneNoteResponse = {
  data: { notes: [sampleNote], count: 1, page: 1, totalPages: 1 },
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  // processQueue requires device-trusted='true' and device-id to be set;
  // configure both so existing tests don't need per-test boilerplate.
  localStorage.setItem('device-trusted', 'true');
  localStorage.setItem('device-id', 'test-device-id');
  // Restore defaults after clearAllMocks wipes call history but not implementations
  mockOnlineStatus = true;
  mockGetNotes.mockResolvedValue(emptyResponse);
  mockGetCachedNotes.mockResolvedValue([]);
  mockEnqueuePendingOp.mockResolvedValue(1);
  mockGetPendingOps.mockResolvedValue([]);
  mockRemovePendingOp.mockResolvedValue(undefined);
  mockRemoveCachedNote.mockResolvedValue(undefined);
  mockIncrementPendingOpFailure.mockResolvedValue(undefined);
  vi.mocked(cacheNotes).mockResolvedValue(undefined);
  vi.mocked(cleanStaleNotes).mockResolvedValue(0);
  // processQueue server-side trust verification: current device is trusted by default.
  // Individual tests that want a revoked-device scenario override this.
  mockGetDevices.mockResolvedValue({ data: [{ deviceId: 'test-device-id' } as unknown as Device] });
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

    expect(mockGetNotes).toHaveBeenLastCalledWith(
      expect.objectContaining({
        type: undefined,
        q: undefined,
      })
    );
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
      })
    );

    expect(mockCreateNote).toHaveBeenCalledTimes(1);
    expect(note._id).toBe('n1');
  });

  it('updateNote calls API and refreshes list', async () => {
    mockUpdateNote.mockResolvedValue({ data: sampleNote, message: 'ok' });
    const { result } = renderHook(() => useNotes({ autoFetch: false }));

    const note = await act(() => result.current.updateNote('n1', { title: 'Updated' }));

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

  it('getNote caches the fetched note (with audioData) for offline use', async () => {
    const voiceNote = {
      ...sampleNote,
      type: 'voice' as const,
      audioData: 'base64audio',
      audioDuration: 30,
    };
    mockGetNote.mockResolvedValue({ data: voiceNote });
    localStorage.setItem('device-trusted', 'true');

    const { result } = renderHook(() => useNotes({ autoFetch: false }));
    await act(() => result.current.getNote('n1'));

    // cacheNotes should have been called from getNote (not just from fetchNotes)
    expect(vi.mocked(cacheNotes)).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ _id: 'n1', audioData: 'base64audio' })])
    );
  });

  it('getNote does NOT cache when device is untrusted', async () => {
    mockGetNote.mockResolvedValue({ data: sampleNote });
    localStorage.removeItem('device-trusted');
    vi.mocked(cacheNotes).mockClear();

    const { result } = renderHook(() => useNotes({ autoFetch: false }));
    await act(() => result.current.getNote('n1'));

    expect(vi.mocked(cacheNotes)).not.toHaveBeenCalled();
  });

  it('getNote serves from Dexie cache when offline (no API call)', async () => {
    mockOnlineStatus = false;
    localStorage.setItem('device-trusted', 'true');
    const voiceNote = {
      ...sampleNote,
      type: 'voice' as const,
      audioData: 'base64audio',
      audioDuration: 30,
      _cachedAt: Date.now(),
    };
    mockGetCachedNotes.mockResolvedValueOnce([voiceNote]);

    const { result } = renderHook(() => useNotes({ autoFetch: false }));
    const note = await act(() => result.current.getNote('n1'));

    // Must NOT call the server API when offline
    expect(mockGetNote).not.toHaveBeenCalled();
    // Must return the cached voice note complete with audioData
    expect(note.audioData).toBe('base64audio');
    expect(note.audioDuration).toBe(30);
  });

  it('getNote throws when offline and cache is empty', async () => {
    mockOnlineStatus = false;
    localStorage.setItem('device-trusted', 'true');
    mockGetCachedNotes.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useNotes({ autoFetch: false }));
    await expect(act(() => result.current.getNote('n1'))).rejects.toThrow(/الملاحظة/);
    expect(mockGetNote).not.toHaveBeenCalled();
  });

  it('getNote throws when offline and device is untrusted', async () => {
    mockOnlineStatus = false;
    localStorage.removeItem('device-trusted');

    const { result } = renderHook(() => useNotes({ autoFetch: false }));
    await expect(act(() => result.current.getNote('n1'))).rejects.toThrow(/الملاحظة/);
    expect(mockGetNote).not.toHaveBeenCalled();
  });

  it('getNote falls back to cache when server fails while online', async () => {
    mockGetNote.mockRejectedValueOnce(new Error('Network error'));
    localStorage.setItem('device-trusted', 'true');
    mockGetCachedNotes.mockResolvedValueOnce([{ ...sampleNote, _cachedAt: Date.now() }]);

    const { result } = renderHook(() => useNotes({ autoFetch: false }));
    const note = await act(() => result.current.getNote('n1'));

    expect(note.title).toBe('Test Note');
  });

  it('getNote throws when server fails and cache is empty', async () => {
    mockGetNote.mockRejectedValueOnce(new Error('Network error'));
    // getCachedNotes returns [] (default mock)

    const { result } = renderHook(() => useNotes({ autoFetch: false }));
    await expect(act(() => result.current.getNote('missing'))).rejects.toThrow();
  });

  it('getNote re-throws 401 auth errors without trying cache', async () => {
    mockGetNote.mockRejectedValueOnce(new Error('401 Unauthorized'));
    const { result } = renderHook(() => useNotes({ autoFetch: false }));

    await expect(act(() => result.current.getNote('n1'))).rejects.toThrow('401');
  });
});

// ─── Offline mode — CRUD enqueues pending ops ────────────────────────────────

describe('offline CRUD', () => {
  beforeEach(() => {
    mockOnlineStatus = false;
    mockGetCachedNotes.mockResolvedValue([sampleNote]);
  });

  it('fetchNotes offline: filters out tmp_ notes from cached data', async () => {
    const tmpNote = {
      ...sampleNote,
      _id: 'tmp_abc123',
      title: 'Pending Note',
    };
    mockGetCachedNotes.mockResolvedValue([sampleNote, tmpNote]);

    const { result } = renderHook(() => useNotes());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Only the real (server-persisted) note must appear; the tmp_ note is hidden.
    expect(result.current.notes.some((n) => n._id === 'tmp_abc123')).toBe(false);
    expect(result.current.notes.some((n) => n._id === 'n1')).toBe(true);
  });

  it('createNote offline: returns temp note, queues op, does NOT add to UI state', async () => {
    const { result } = renderHook(() => useNotes({ autoFetch: false }));

    const created = await act(() =>
      result.current.createNote({ title: 'Offline Note', type: 'text', content: 'c' })
    );

    expect(created._id).toMatch(/^tmp_/);
    expect(mockEnqueuePendingOp).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'create', noteTitle: 'Offline Note' })
    );
    // Pending notes must NOT appear in the notes list — navigating to /notes/{tmp_id}
    // would crash because no server record exists yet.
    expect(result.current.notes.some((n) => n._id === created._id)).toBe(false);
  });

  it('createNote offline: does NOT call createNoteApi', async () => {
    const { result } = renderHook(() => useNotes({ autoFetch: false }));
    await act(() => result.current.createNote({ title: 'X', type: 'text', content: '' }));
    expect(vi.mocked(createNoteApi)).not.toHaveBeenCalled();
  });

  it('createNote offline: persists tempNote to Dexie so it survives page reload', async () => {
    const { result } = renderHook(() => useNotes({ autoFetch: false }));

    const created = await act(() =>
      result.current.createNote({
        title: 'Offline Voice',
        type: 'voice',
        audioData: 'base64audio',
        audioDuration: 15,
      })
    );

    // cacheNotes must be called with the temp note (including audioData) so the note
    // is readable from Dexie after a page reload while still offline.
    expect(vi.mocked(cacheNotes)).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          _id: created._id,
          title: 'Offline Voice',
          audioData: 'base64audio',
          audioDuration: 15,
        }),
      ])
    );
  });

  it('updateNote offline: persists optimistic note to Dexie so it survives page reload', async () => {
    mockGetCachedNotes.mockResolvedValue([sampleNote]);
    const { result } = renderHook(() => useNotes());
    await waitFor(() => expect(result.current.loading).toBe(false));

    vi.mocked(cacheNotes).mockClear();
    await act(() => result.current.updateNote('n1', { title: 'Updated Offline' }));

    // The optimistic note (with the new title) must be written to Dexie so the
    // change persists after a page reload while still offline.
    expect(vi.mocked(cacheNotes)).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ _id: 'n1', title: 'Updated Offline' })])
    );
  });

  it('updateNote offline: applies update optimistically and enqueues op with snapshot', async () => {
    mockGetNotes.mockResolvedValue(oneNoteResponse);
    const { result } = renderHook(() => useNotes());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.updateNote('n1', { title: 'New Title' }));

    expect(mockEnqueuePendingOp).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'update',
        noteId: 'n1',
        noteTitle: 'Test Note',
      })
    );
  });

  it('deleteNote offline: removes from state, calls removeCachedNote, enqueues op', async () => {
    mockGetNotes.mockResolvedValue(oneNoteResponse);
    const { result } = renderHook(() => useNotes());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.deleteNote('n1'));

    expect(mockRemoveCachedNote).toHaveBeenCalledWith('n1');
    expect(mockEnqueuePendingOp).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'delete', noteId: 'n1' })
    );
  });
});

// ─── Offline CRUD — untrusted device blocking ─────────────────────────────────
// When the device is not trusted, offline mutations must be refused immediately
// rather than silently queued into an unreachable pendingOps table.

describe('offline CRUD — untrusted device', () => {
  beforeEach(() => {
    mockOnlineStatus = false;
    localStorage.removeItem('device-trusted'); // device NOT trusted
    mockGetCachedNotes.mockResolvedValue([sampleNote]);
  });

  it('createNote throws and rolls back optimistic insert when untrusted', async () => {
    const { result } = renderHook(() => useNotes({ autoFetch: false }));

    await expect(
      act(() => result.current.createNote({ title: 'Untrusted Note', type: 'text', content: '' }))
    ).rejects.toThrow(/موثوق/);

    // No temp note was added to UI state (blocked before any state mutation)
    expect(result.current.notes).toHaveLength(0);
    // No op queued
    expect(mockEnqueuePendingOp).not.toHaveBeenCalled();
  });

  it('updateNote throws and does not enqueue op when offline and untrusted', async () => {
    // Hook renders offline+untrusted — notes list stays empty (cache skipped).
    // The test validates the security invariant: no op is queued when trust is absent.
    const { result } = renderHook(() => useNotes({ autoFetch: false }));

    await expect(
      act(() => result.current.updateNote('n1', { title: 'Hacked Title' }))
    ).rejects.toThrow(/موثوق/);

    expect(mockEnqueuePendingOp).not.toHaveBeenCalled();
  });

  it('deleteNote throws and does not enqueue op when offline and untrusted', async () => {
    // Security invariant: no op is queued when trust is absent.
    const { result } = renderHook(() => useNotes({ autoFetch: false }));

    await expect(act(() => result.current.deleteNote('n1'))).rejects.toThrow(/موثوق/);

    expect(mockEnqueuePendingOp).not.toHaveBeenCalled();
  });

  it('fetchNotes does NOT populate cache when untrusted', async () => {
    // Even if online, a successful fetch must not write to IndexedDB
    mockOnlineStatus = true;
    localStorage.removeItem('device-trusted');
    mockGetNotes.mockResolvedValue(oneNoteResponse);

    const { result } = renderHook(() => useNotes());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Server data shows up in the UI (online fetch works fine)
    expect(result.current.notes).toHaveLength(1);
    // But nothing was written to the local cache
    expect(vi.mocked(cacheNotes)).not.toHaveBeenCalled();
  });

  it('fetchNotes does NOT read from cache when untrusted', async () => {
    // Even offline, getCachedNotes must not be called for untrusted devices
    mockGetCachedNotes.mockResolvedValue([sampleNote]);
    mockOnlineStatus = false;

    const { result } = renderHook(() => useNotes());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockGetCachedNotes).not.toHaveBeenCalled();
  });
});

describe('optimistic UI (online)', () => {
  it('createNote: shows temp note before API resolves', async () => {
    let resolveCreate!: (v: { data: import('@/app/types').Note; message: string }) => void;
    vi.mocked(createNoteApi).mockReturnValueOnce(
      new Promise((res) => {
        resolveCreate = res;
      }) as ReturnType<typeof createNoteApi>
    );

    const { result } = renderHook(() => useNotes({ autoFetch: false }));

    // Start the create — don't await
    act(() => {
      void result.current.createNote({ title: 'Opt', type: 'text', content: '' });
    });

    // Temp note should appear immediately
    await waitFor(() =>
      expect(result.current.notes.some((n) => n._id.startsWith('tmp_'))).toBe(true)
    );

    // Resolve the API
    resolveCreate({ data: sampleNote, message: 'ok' });
    await waitFor(() => expect(result.current.notes.some((n) => n._id === 'n1')).toBe(true));
  });

  it('createNote: temp note preserves audioData and audioDuration from input', async () => {
    let resolveCreate!: (v: { data: import('@/app/types').Note; message: string }) => void;
    vi.mocked(createNoteApi).mockReturnValueOnce(
      new Promise((res) => {
        resolveCreate = res;
      }) as ReturnType<typeof createNoteApi>
    );

    const { result } = renderHook(() => useNotes({ autoFetch: false }));

    act(() => {
      void result.current.createNote({
        title: 'Voice Note',
        type: 'voice',
        audioData: 'base64audio',
        audioDuration: 42,
      });
    });

    await waitFor(() =>
      expect(result.current.notes.some((n) => n._id.startsWith('tmp_'))).toBe(true)
    );

    const tempNote = result.current.notes.find((n) => n._id.startsWith('tmp_'))!;
    expect(tempNote.audioData).toBe('base64audio');
    expect(tempNote.audioDuration).toBe(42);

    resolveCreate({ data: sampleNote, message: 'ok' });
  });

  it('createNote: rolls back temp note on API failure', async () => {
    vi.mocked(createNoteApi).mockRejectedValueOnce(new Error('Server error'));
    const { result } = renderHook(() => useNotes({ autoFetch: false }));

    await expect(
      act(() => result.current.createNote({ title: 'Rollback', type: 'text', content: '' }))
    ).rejects.toThrow();

    expect(result.current.notes.every((n) => !n._id.startsWith('tmp_'))).toBe(true);
  });

  it('updateNote: rolls back to original note on API failure', async () => {
    mockGetNotes.mockResolvedValue(oneNoteResponse);
    vi.mocked(updateNoteApi).mockRejectedValueOnce(new Error('Server error'));
    const { result } = renderHook(() => useNotes());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await expect(
      act(() => result.current.updateNote('n1', { title: 'Bad Update' }))
    ).rejects.toThrow();

    const note = result.current.notes.find((n) => n._id === 'n1');
    expect(note?.title).toBe('Test Note');
  });

  it('deleteNote: restores note on API failure', async () => {
    mockGetNotes.mockResolvedValue(oneNoteResponse);
    vi.mocked(deleteNoteApi).mockRejectedValueOnce(new Error('Server error'));
    const { result } = renderHook(() => useNotes());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await expect(act(() => result.current.deleteNote('n1'))).rejects.toThrow();

    expect(result.current.notes.some((n) => n._id === 'n1')).toBe(true);
  });
});

// ─── processQueue ─────────────────────────────────────────────────────────────

describe('processQueue', () => {
  it('on success calls removePendingOp (not incrementPendingOpFailure)', async () => {
    mockGetPendingOps.mockResolvedValue([
      {
        id: 7,
        type: 'create',
        payload: { title: 'Q', type: 'text', content: '' },
        timestamp: Date.now(),
      },
    ]);
    vi.mocked(createNoteApi).mockResolvedValue({ data: sampleNote, message: 'ok' });

    const { result } = renderHook(() => useNotes({ autoFetch: false }));

    await act(() => result.current.processQueue());

    expect(mockRemovePendingOp).toHaveBeenCalledWith(7);
    expect(mockIncrementPendingOpFailure).not.toHaveBeenCalled();
  });

  it('on failure calls incrementPendingOpFailure (not removePendingOp)', async () => {
    mockGetPendingOps.mockResolvedValue([
      {
        id: 8,
        type: 'create',
        payload: { title: 'Q', type: 'text', content: '' },
        timestamp: Date.now(),
      },
    ]);
    vi.mocked(createNoteApi).mockRejectedValueOnce(new Error('fail'));

    const { result } = renderHook(() => useNotes({ autoFetch: false }));

    await act(() => result.current.processQueue());

    expect(mockIncrementPendingOpFailure).toHaveBeenCalledWith(8);
    expect(mockRemovePendingOp).not.toHaveBeenCalled();
  });

  it('skips API call for op with no payload, but still removes it from queue', async () => {
    mockGetPendingOps.mockResolvedValue([
      { id: 9, type: 'create', timestamp: Date.now() }, // no payload
    ]);

    const { result } = renderHook(() => useNotes({ autoFetch: false }));
    await act(() => result.current.processQueue());

    // No API call made (payload was missing)
    expect(vi.mocked(createNoteApi)).not.toHaveBeenCalled();
    // The malformed op should be removed so it doesn't block the queue forever
    expect(mockRemovePendingOp).toHaveBeenCalledWith(9);
  });

  // ── Trust gate ────────────────────────────────────────────────────────

  it('aborts without syncing when device-trusted is absent from localStorage', async () => {
    localStorage.removeItem('device-trusted');
    mockGetPendingOps.mockResolvedValue([
      {
        id: 10,
        type: 'create',
        payload: { title: 'Should not sync', type: 'text', content: '' },
        timestamp: Date.now(),
      },
    ]);

    const { result } = renderHook(() => useNotes({ autoFetch: false }));
    await act(() => result.current.processQueue());

    expect(mockGetPendingOps).not.toHaveBeenCalled();
    expect(vi.mocked(createNoteApi)).not.toHaveBeenCalled();
  });

  it('aborts without syncing when device-trusted is "false" in localStorage', async () => {
    // localStorage.removeItem behaviour — value not 'true' → blocked
    localStorage.setItem('device-trusted', 'false');
    mockGetPendingOps.mockResolvedValue([
      {
        id: 11,
        type: 'create',
        payload: { title: 'Should not sync', type: 'text', content: '' },
        timestamp: Date.now(),
      },
    ]);

    const { result } = renderHook(() => useNotes({ autoFetch: false }));
    await act(() => result.current.processQueue());

    expect(mockGetPendingOps).not.toHaveBeenCalled();
    expect(vi.mocked(createNoteApi)).not.toHaveBeenCalled();
  });

  it('syncs normally when device-trusted is "true" in localStorage', async () => {
    localStorage.setItem('device-trusted', 'true');
    mockGetPendingOps.mockResolvedValue([
      {
        id: 12,
        type: 'create',
        payload: { title: 'Should sync', type: 'text', content: '' },
        timestamp: Date.now(),
      },
    ]);
    vi.mocked(createNoteApi).mockResolvedValue({ data: sampleNote, message: 'ok' });

    const { result } = renderHook(() => useNotes({ autoFetch: false }));
    await act(() => result.current.processQueue());

    expect(mockGetPendingOps).toHaveBeenCalled();
    expect(vi.mocked(createNoteApi)).toHaveBeenCalled();
    expect(mockRemovePendingOp).toHaveBeenCalledWith(12);
  });

  // ── Stale-entry cleanup ───────────────────────────────────────────────

  it('create op sync: removes temp note from Dexie immediately after success', async () => {
    mockGetPendingOps.mockResolvedValue([
      {
        id: 13,
        type: 'create',
        tempId: 'tmp_sync_test',
        payload: { title: 'Synced Note', type: 'text', content: '' },
        noteTitle: 'Synced Note',
        timestamp: Date.now(),
      },
    ]);
    vi.mocked(createNoteApi).mockResolvedValue({ data: sampleNote, message: 'ok' });

    const { result } = renderHook(() => useNotes({ autoFetch: false }));
    await act(() => result.current.processQueue());

    // The stale tmp_ Dexie entry must be deleted so it does not accumulate in
    // IndexedDB or resurface if cleanStaleNotes has a glitch.
    expect(mockRemoveCachedNote).toHaveBeenCalledWith('tmp_sync_test');
  });

  it('create op sync: does NOT call removeCachedNote when op has no tempId', async () => {
    mockGetPendingOps.mockResolvedValue([
      {
        id: 14,
        type: 'create',
        // tempId intentionally absent (malformed op)
        payload: { title: 'No TempId', type: 'text', content: '' },
        timestamp: Date.now(),
      },
    ]);
    vi.mocked(createNoteApi).mockResolvedValue({ data: sampleNote, message: 'ok' });

    const { result } = renderHook(() => useNotes({ autoFetch: false }));
    await act(() => result.current.processQueue());

    expect(mockRemoveCachedNote).not.toHaveBeenCalled();
  });

  it('always calls cleanStaleNotes after processing ops (catch-all for pre-existing entries)', async () => {
    mockGetPendingOps.mockResolvedValue([
      {
        id: 15,
        type: 'create',
        tempId: 'tmp_stale_cleanup',
        payload: { title: 'Any Note', type: 'text', content: '' },
        timestamp: Date.now(),
      },
    ]);
    vi.mocked(createNoteApi).mockResolvedValue({ data: sampleNote, message: 'ok' });

    const { result } = renderHook(() => useNotes({ autoFetch: false }));

    mockCleanStaleNotes.mockClear();
    await act(() => result.current.processQueue());

    expect(mockCleanStaleNotes).toHaveBeenCalledOnce();
  });
  // ── Server-side trust verification ─────────────────────────────────────────

  it('aborts sync when server confirms device is no longer trusted', async () => {
    mockGetPendingOps.mockResolvedValue([
      {
        id: 16,
        type: 'create',
        payload: { title: 'Secret Note', type: 'text', content: '' },
        timestamp: Date.now(),
      },
    ]);
    // Server returns a device list that does NOT contain the current device
    mockGetDevices.mockResolvedValue({ data: [] as Device[] });

    const { result } = renderHook(() => useNotes({ autoFetch: false }));
    await act(() => result.current.processQueue());

    // No API writes must have occurred
    expect(vi.mocked(createNoteApi)).not.toHaveBeenCalled();
    expect(mockRemovePendingOp).not.toHaveBeenCalled();
  });

  it('dispatches device:trust-revoked event when server says device is not trusted', async () => {
    mockGetPendingOps.mockResolvedValue([
      {
        id: 17,
        type: 'create',
        payload: { title: 'Note', type: 'text', content: '' },
        timestamp: Date.now(),
      },
    ]);
    mockGetDevices.mockResolvedValue({ data: [] as Device[] });

    const listener = vi.fn();
    window.addEventListener('device:trust-revoked', listener, { once: true });

    const { result } = renderHook(() => useNotes({ autoFetch: false }));
    await act(() => result.current.processQueue());

    expect(listener).toHaveBeenCalledOnce();
    window.removeEventListener('device:trust-revoked', listener);
  });

  it('aborts sync when getDevicesApi throws (server unreachable during verification)', async () => {
    mockGetPendingOps.mockResolvedValue([
      {
        id: 18,
        type: 'create',
        payload: { title: 'Note', type: 'text', content: '' },
        timestamp: Date.now(),
      },
    ]);
    mockGetDevices.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useNotes({ autoFetch: false }));
    await act(() => result.current.processQueue());

    // Conservative policy: sync is blocked when trust cannot be verified
    expect(vi.mocked(createNoteApi)).not.toHaveBeenCalled();
    expect(mockRemovePendingOp).not.toHaveBeenCalled();
  });

  it('aborts when device-id is missing from localStorage (device identity unknown)', async () => {
    localStorage.removeItem('device-id');
    mockGetPendingOps.mockResolvedValue([
      {
        id: 19,
        type: 'create',
        payload: { title: 'Note', type: 'text', content: '' },
        timestamp: Date.now(),
      },
    ]);

    const { result } = renderHook(() => useNotes({ autoFetch: false }));
    await act(() => result.current.processQueue());

    // device-id is required for getDevicesApi — neither should be called
    expect(mockGetDevices).not.toHaveBeenCalled();
    expect(vi.mocked(createNoteApi)).not.toHaveBeenCalled();
  });

  // ── Concurrency mutex ──────────────────────────────────────────────────

  it('concurrent calls: second call is a no-op while the first is in-flight', async () => {
    mockGetPendingOps.mockResolvedValue([
      {
        id: 20,
        type: 'create',
        payload: { title: 'Concurrent Note', type: 'text', content: '' },
        timestamp: Date.now(),
      },
    ]);
    vi.mocked(createNoteApi).mockResolvedValue({ data: sampleNote, message: 'ok' });

    const { result } = renderHook(() => useNotes({ autoFetch: false }));

    // Fire both calls synchronously before any awaits resolve.
    // The mutex (processingRef) is set synchronously at the top of the first
    // call, so the second call sees it immediately and returns with no-op.
    const first = result.current.processQueue();
    const second = result.current.processQueue();
    await act(() => Promise.all([first, second]));

    // createNoteApi and getPendingOps must each be called exactly once
    expect(vi.mocked(createNoteApi)).toHaveBeenCalledOnce();
    expect(mockGetPendingOps).toHaveBeenCalledOnce();
  });});

// ─── Offline filter / applyLocalFilter ───────────────────────────────────────

describe('offline filter (applyLocalFilter)', () => {
  const textNote = { ...sampleNote, _id: 'n1', title: 'Hello World', type: 'text' as const };
  const voiceNote = { ...sampleNote, _id: 'n2', title: 'Voice memo', type: 'voice' as const };
  const textNote2 = { ...sampleNote, _id: 'n3', title: 'Another text', type: 'text' as const };

  beforeEach(() => {
    mockOnlineStatus = false;
    mockGetCachedNotes.mockResolvedValue([textNote, voiceNote, textNote2]);
    // Offline — getNotesApi should not be called
    mockGetNotes.mockResolvedValue(emptyResponse);
  });

  it('shows all cached notes when no filter/search', async () => {
    const { result } = renderHook(() => useNotes());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.notes).toHaveLength(3);
  });

  it('filters by type offline', async () => {
    const { result } = renderHook(() => useNotes());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setTypeFilter('voice'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.notes).toHaveLength(1);
    expect(result.current.notes[0].type).toBe('voice');
  });

  it('filters by search query offline', async () => {
    const { result } = renderHook(() => useNotes());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setSearchQuery('hello'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.notes).toHaveLength(1);
    expect(result.current.notes[0].title).toBe('Hello World');
  });

  it('combines type + search query offline', async () => {
    const { result } = renderHook(() => useNotes());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setTypeFilter('text');
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setSearchQuery('another');
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.notes).toHaveLength(1);
    expect(result.current.notes[0]._id).toBe('n3');
  });

  it('returns empty list when no match found offline', async () => {
    const { result } = renderHook(() => useNotes());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setSearchQuery('zzznomatch'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.notes).toHaveLength(0);
  });
});

// ─── Undo event listener ─────────────────────────────────────────────────────

describe('undo event listener (notes:undo-op)', () => {
  it('create undo: offline temp note is never in state; undo event is handled without crash', async () => {
    // Must be offline BEFORE the hook renders so the createNote callback captures isOnline=false.
    mockOnlineStatus = false;
    const { result } = renderHook(() => useNotes({ autoFetch: false }));

    // Offline create — temp note is queued in pendingOps + Dexie but NOT in UI state.
    const tempNote = await act(() =>
      result.current.createNote({ title: 'To undo', type: 'text', content: '' })
    );

    // Temp note must NOT be in the notes list.
    expect(result.current.notes.some((n) => n._id === tempNote._id)).toBe(false);

    const countBefore = result.current.count;

    // Dispatch undo event — the handler must not crash and must not change count
    // (the temp was never counted).
    act(() => {
      window.dispatchEvent(
        new CustomEvent('notes:undo-op', {
          detail: { op: { type: 'create', tempId: tempNote._id, timestamp: Date.now() } },
        })
      );
    });

    await waitFor(() => {
      expect(result.current.notes.every((n) => n._id !== tempNote._id)).toBe(true);
      expect(result.current.count).toBe(countBefore);
    });
  });

  it('update undo: restores the original note snapshot', async () => {
    mockGetNotes.mockResolvedValue(oneNoteResponse);
    const { result } = renderHook(() => useNotes());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const snapshot = { ...sampleNote, title: 'Original Title' };

    act(() => {
      window.dispatchEvent(
        new CustomEvent('notes:undo-op', {
          detail: {
            op: { type: 'update', noteId: 'n1', noteSnapshot: snapshot, timestamp: Date.now() },
          },
        })
      );
    });

    await waitFor(() => {
      const note = result.current.notes.find((n) => n._id === 'n1');
      expect(note?.title).toBe('Original Title');
    });
  });

  it('delete undo: re-adds the snapshot note to state', async () => {
    const { result } = renderHook(() => useNotes({ autoFetch: false }));

    const snapshot = sampleNote;

    act(() => {
      window.dispatchEvent(
        new CustomEvent('notes:undo-op', {
          detail: {
            op: { type: 'delete', noteId: 'n1', noteSnapshot: snapshot, timestamp: Date.now() },
          },
        })
      );
    });

    await waitFor(() => expect(result.current.notes.some((n) => n._id === 'n1')).toBe(true));
  });
});
