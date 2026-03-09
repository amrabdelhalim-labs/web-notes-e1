/**
 * warmUpCache.test.ts — unit tests for the post-activation offline seeding utility.
 *
 * Verifies:
 *   - Notes list is fetched and seeded into Dexie (phase 1)
 *   - Voice notes are individually re-fetched for audioData (phase 2a)
 *   - Phase 2a is capped at MAX_AUDIO_PREFETCH notes
 *   - Non-voice notes are NOT individually re-fetched
 *   - Page shells are pre-fetched via fetch() (phase 2b)
 *   - If the list fetch fails the function returns without throwing
 *   - Individual voice-note failures are swallowed (other notes still processed)
 *   - prefetchPageShells builds correct URLs for all supported locales
 */

import { warmUpOfflineCache, prefetchPageShells, waitForSWControl } from '@/app/lib/warmUpCache';

// ── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('@/app/lib/api', () => ({
  getNotesApi: vi.fn(),
  getNoteApi: vi.fn(),
}));

vi.mock('@/app/lib/db', () => ({
  cacheNotes: vi.fn().mockResolvedValue(undefined),
}));

import { getNotesApi, getNoteApi } from '@/app/lib/api';
import { cacheNotes } from '@/app/lib/db';

const mockGetNotesApi = vi.mocked(getNotesApi);
const mockGetNoteApi = vi.mocked(getNoteApi);
const mockCacheNotes = vi.mocked(cacheNotes);

// ── Fixtures ─────────────────────────────────────────────────────────────────

const makeNote = (id: string, type: 'text' | 'voice' = 'text') => ({
  _id: id,
  title: `Note ${id}`,
  content: type === 'text' ? 'content' : undefined,
  audioData: type === 'voice' ? `base64audio_${id}` : undefined,
  audioDuration: type === 'voice' ? 10 : undefined,
  type,
  user: 'u1',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
});

const textNote1 = makeNote('t1', 'text');
const textNote2 = makeNote('t2', 'text');
const voiceNote1 = makeNote('v1', 'voice');
const voiceNote2 = makeNote('v2', 'voice');

// ── Setup ─────────────────────────────────────────────────────────────────────

let mockFetch: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();

  // Mock global fetch (used for page-shell pre-fetching)
  mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
  vi.stubGlobal('fetch', mockFetch);

  // Mock navigator.serviceWorker so waitForSWControl resolves immediately
  vi.stubGlobal('navigator', {
    ...navigator,
    serviceWorker: { controller: {}, addEventListener: vi.fn(), getRegistration: vi.fn() },
  });

  // Default: list returns 2 text + 2 voice notes
  mockGetNotesApi.mockResolvedValue({
    data: {
      notes: [textNote1, textNote2, voiceNote1, voiceNote2],
      count: 4,
      page: 1,
      totalPages: 1,
    },
  });

  // Default: individual note fetch returns the note unchanged
  mockGetNoteApi.mockImplementation(async (id: string) => ({
    data: makeNote(id, id.startsWith('v') ? 'voice' : 'text'),
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ── warmUpOfflineCache ────────────────────────────────────────────────────────

describe('warmUpOfflineCache', () => {
  it('fetches the notes list with MAX_CACHED_NOTES limit', async () => {
    await warmUpOfflineCache();
    expect(mockGetNotesApi).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: expect.any(Number) })
    );
  });

  it('seeds all notes from the list into Dexie (phase 1)', async () => {
    await warmUpOfflineCache();
    expect(mockCacheNotes).toHaveBeenCalledWith([textNote1, textNote2, voiceNote1, voiceNote2]);
  });

  it('individually re-fetches only voice notes (phase 2a)', async () => {
    await warmUpOfflineCache();
    // Voice notes re-fetched
    expect(mockGetNoteApi).toHaveBeenCalledWith('v1');
    expect(mockGetNoteApi).toHaveBeenCalledWith('v2');
    // Text notes NOT individually re-fetched
    expect(mockGetNoteApi).not.toHaveBeenCalledWith('t1');
    expect(mockGetNoteApi).not.toHaveBeenCalledWith('t2');
  });

  it('upserts each voice note (with audioData) back into Dexie', async () => {
    await warmUpOfflineCache();
    const cacheCallArgs = mockCacheNotes.mock.calls.flat(1) as (typeof voiceNote1)[][];
    const cachedIds = cacheCallArgs.flatMap((notes) =>
      Array.isArray(notes) ? notes.map((n) => n._id) : []
    );
    expect(cachedIds).toContain('v1');
    expect(cachedIds).toContain('v2');
  });

  it('pre-fetches page shells for all supported locales (phase 2b)', async () => {
    await warmUpOfflineCache();
    // Allow the fire-and-forget background task to process
    await Promise.resolve();

    const fetchedUrls: string[] = mockFetch.mock.calls.map((call) => call[0] as string);
    // Notes list page
    expect(fetchedUrls).toContain('/ar/notes');
    expect(fetchedUrls).toContain('/en/notes');
    // New note page
    expect(fetchedUrls).toContain('/ar/notes/new');
    expect(fetchedUrls).toContain('/en/notes/new');
    // Profile page
    expect(fetchedUrls).toContain('/ar/profile');
    expect(fetchedUrls).toContain('/en/profile');
  });

  it('pre-fetches individual note view + edit pages for each note', async () => {
    await warmUpOfflineCache();
    await Promise.resolve();

    const fetchedUrls: string[] = mockFetch.mock.calls.map((call) => call[0] as string);
    expect(fetchedUrls).toContain('/ar/notes/t1');
    expect(fetchedUrls).toContain('/en/notes/t1');
    expect(fetchedUrls).toContain('/ar/notes/t1/edit');
    expect(fetchedUrls).toContain('/en/notes/t1/edit');
    expect(fetchedUrls).toContain('/ar/notes/v1');
    expect(fetchedUrls).toContain('/ar/notes/v1/edit');
  });

  it('returns without throwing when the list API fails', async () => {
    mockGetNotesApi.mockRejectedValueOnce(new Error('Server error'));
    await expect(warmUpOfflineCache()).resolves.toBeUndefined();
  });

  it('does not seed Dexie when list API fails', async () => {
    mockGetNotesApi.mockRejectedValueOnce(new Error('Server error'));
    await warmUpOfflineCache();
    // Only 0 cacheNotes calls (list phase itself failed before calling cacheNotes)
    expect(mockCacheNotes).not.toHaveBeenCalled();
  });

  it('does not individually fetch voice notes when list API fails', async () => {
    mockGetNotesApi.mockRejectedValueOnce(new Error('Server error'));
    await warmUpOfflineCache();
    expect(mockGetNoteApi).not.toHaveBeenCalled();
  });

  it('swallows individual voice-note fetch failures without throwing', async () => {
    mockGetNoteApi.mockRejectedValue(new Error('Note 503'));
    await expect(warmUpOfflineCache()).resolves.toBeUndefined();
  });

  it('still processes other voice notes when one individual fetch fails', async () => {
    // v1 fails, v2 succeeds
    mockGetNoteApi.mockImplementation(async (id: string) => {
      if (id === 'v1') throw new Error('Timeout');
      return { data: makeNote(id, 'voice') };
    });

    await warmUpOfflineCache();
    // v2 should still be cached
    const cacheCallArgs = mockCacheNotes.mock.calls.flat(1) as (typeof voiceNote1)[][];
    const cachedIds = cacheCallArgs.flatMap((notes) =>
      Array.isArray(notes) ? notes.map((n) => n._id) : []
    );
    expect(cachedIds).toContain('v2');
  });

  it('works correctly when there are no voice notes', async () => {
    mockGetNotesApi.mockResolvedValue({
      data: { notes: [textNote1, textNote2], count: 2, page: 1, totalPages: 1 },
    });

    await warmUpOfflineCache();
    expect(mockGetNoteApi).not.toHaveBeenCalled();
    expect(mockCacheNotes).toHaveBeenCalledWith([textNote1, textNote2]);
  });

  it('works correctly when the notes list is empty', async () => {
    mockGetNotesApi.mockResolvedValue({
      data: { notes: [], count: 0, page: 1, totalPages: 0 },
    });

    await warmUpOfflineCache();
    expect(mockCacheNotes).toHaveBeenCalledWith([]);
    expect(mockGetNoteApi).not.toHaveBeenCalled();
  });
});

// ── prefetchPageShells ────────────────────────────────────────────────────────

describe('prefetchPageShells', () => {
  it('includes /notes, /notes/new, /profile for every supported locale', async () => {
    await prefetchPageShells([]);
    const urls: string[] = mockFetch.mock.calls.map((c) => c[0] as string);
    expect(urls).toContain('/ar/notes');
    expect(urls).toContain('/en/notes');
    expect(urls).toContain('/ar/notes/new');
    expect(urls).toContain('/en/notes/new');
    expect(urls).toContain('/ar/profile');
    expect(urls).toContain('/en/profile');
  });

  it('includes view and edit page for each provided noteId', async () => {
    await prefetchPageShells(['abc123', 'def456']);
    const urls: string[] = mockFetch.mock.calls.map((c) => c[0] as string);
    expect(urls).toContain('/ar/notes/abc123');
    expect(urls).toContain('/en/notes/abc123');
    expect(urls).toContain('/ar/notes/abc123/edit');
    expect(urls).toContain('/en/notes/abc123/edit');
    expect(urls).toContain('/ar/notes/def456');
    expect(urls).toContain('/ar/notes/def456/edit');
  });

  it('caps individual note pages at 20 note IDs', async () => {
    const ids = Array.from({ length: 30 }, (_, i) => `note_${i}`);
    await prefetchPageShells(ids);
    // Only the first 20 notes should have their pages pre-cached
    const urls: string[] = mockFetch.mock.calls.map((c) => c[0] as string);
    expect(urls).toContain('/ar/notes/note_19');
    expect(urls).not.toContain('/ar/notes/note_20');
  });

  it('never throws even if fetch rejects', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
    await expect(prefetchPageShells(['n1'])).resolves.toBeUndefined();
  });

  it('passes credentials: include to each fetch call', async () => {
    await prefetchPageShells(['n1']);
    for (const call of mockFetch.mock.calls) {
      expect(call[1]).toMatchObject({ credentials: 'include' });
    }
  });
});

// ── waitForSWControl ──────────────────────────────────────────────────────────

describe('waitForSWControl', () => {
  it('resolves immediately when SW is already controlling', async () => {
    vi.stubGlobal('navigator', {
      ...navigator,
      serviceWorker: { controller: {}, addEventListener: vi.fn() },
    });
    await expect(waitForSWControl()).resolves.toBeUndefined();
  });

  it('resolves immediately when serviceWorker is not supported', async () => {
    vi.stubGlobal('navigator', {});
    await expect(waitForSWControl()).resolves.toBeUndefined();
  });

  it('waits for controllerchange event when no controller yet', async () => {
    let changeHandler: (() => void) | undefined;
    vi.stubGlobal('navigator', {
      ...navigator,
      serviceWorker: {
        controller: null,
        addEventListener: (_event: string, handler: () => void) => {
          changeHandler = handler;
        },
      },
    });

    const promise = waitForSWControl();
    // Should not resolve yet
    let resolved = false;
    promise.then(() => {
      resolved = true;
    });
    await Promise.resolve();
    expect(resolved).toBe(false);

    // Fire the controllerchange event
    changeHandler!();
    await expect(promise).resolves.toBeUndefined();
  });
});
