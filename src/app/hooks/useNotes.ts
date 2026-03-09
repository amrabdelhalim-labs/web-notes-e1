'use client';

/**
 * useNotes — custom hook for notes management.
 *
 * Encapsulates API calls, loading/error state, pagination, filtering,
 * and CRUD operations for notes.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Note, NoteType, NoteInput, UpdateNoteInput } from '@/app/types';
import { DEFAULT_PAGE_SIZE } from '@/app/config';
import {
  getNotesApi,
  getNoteApi,
  createNoteApi,
  updateNoteApi,
  deleteNoteApi,
} from '@/app/lib/api';
import { useOfflineStatus } from '@/app/hooks/useOfflineStatus';
import {
  cacheNotes,
  getCachedNotes,
  cleanStaleNotes,
  enqueuePendingOp,
  getPendingOps,
  removePendingOp,
  removeCachedNote,
  incrementPendingOpFailure,
  type PendingOperation,
} from '@/app/lib/db';

interface UseNotesOptions {
  /** Initial page size (default 10) */
  pageSize?: number;
  /** Auto-fetch on mount */
  autoFetch?: boolean;
}

interface UseNotesReturn {
  notes: Note[];
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  count: number;
  typeFilter: NoteType | '';
  searchQuery: string;
  isOnline: boolean;
  setPage: (p: number) => void;
  setTypeFilter: (t: NoteType | '') => void;
  setSearchQuery: (q: string) => void;
  fetchNotes: () => Promise<void>;
  createNote: (input: NoteInput) => Promise<Note>;
  updateNote: (id: string, input: UpdateNoteInput) => Promise<Note>;
  deleteNote: (id: string) => Promise<void>;
  getNote: (id: string) => Promise<Note>;
  processQueue: () => Promise<void>;
}

/**
 * Client-side filter helper — used for offline mode so search/filter still work
 * against the locally cached notes.
 */
function applyLocalFilter(notes: Note[], type: NoteType | '', query: string): Note[] {
  let result = notes;
  if (type) {
    result = result.filter((n) => n.type === type);
  }
  if (query.trim()) {
    const q = query.trim().toLowerCase();
    result = result.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        (typeof n.content === 'string' && n.content.toLowerCase().includes(q))
    );
  }
  return result;
}

export function useNotes(options: UseNotesOptions = {}): UseNotesReturn {
  const { pageSize = DEFAULT_PAGE_SIZE, autoFetch = true } = options;

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);
  const [typeFilter, setTypeFilter] = useState<NoteType | ''>('');
  const [searchQuery, setSearchQuery] = useState('');

  const isOnline = useOfflineStatus();
  const notesRef = useRef<Note[]>([]);
  notesRef.current = notes;
  const didMount = useRef(false);
  // Tracks the *previous* online state so we only call processQueue() on the
  // offline → online transition (not on every render or on initial mount).
  // Background Sync handles the "first load while already online" case via the
  // SW bridge in providers.tsx → 'notes:process-offline-queue' window event.
  const prevOnline = useRef(true);
  /**
   * Fetch notes with offline-first strategy:
   * 1. Load from cache immediately (instant UI)
   * 2. If online, fetch from server in background and update cache
   * 3. Never show error if we have cached data (graceful degradation)
   */

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Only read/write the local IndexedDB cache on trusted devices.
    // On untrusted devices the app still works online, but no private data is
    // persisted locally, so the next person who picks up the device cannot
    // browse notes through the installed PWA without re-authenticating.
    const offlineEnabled = localStorage.getItem('device-trusted') === 'true';

    // Step 1: Load from cache first for instant UI — trusted devices only
    let cachedData: typeof notes = [];
    if (offlineEnabled) {
      try {
        const allCached = await getCachedNotes();
        // Exclude pending (tmp_*) notes — they have no server ID yet, so navigating
        // to their detail page would fail. Pending ops are shown in the
        // ConnectionIndicator instead.
        cachedData = allCached.filter((n) => !n._id.startsWith('tmp_'));
        if (cachedData.length > 0) {
          // Apply client-side filter/search on cached data (works offline too)
          const filtered = applyLocalFilter(cachedData, typeFilter, searchQuery);
          const pageSlice = filtered.slice((page - 1) * pageSize, page * pageSize);
          setNotes(pageSlice);
          setCount(filtered.length);
          setTotalPages(Math.max(1, Math.ceil(filtered.length / pageSize)));
        }
      } catch {
        // Cache read failed - not critical, continue
      }
    }

    // Step 2: If online, fetch fresh data from server in background
    if (isOnline) {
      try {
        const res = await getNotesApi({
          page,
          limit: pageSize,
          type: typeFilter || undefined,
          q: searchQuery || undefined,
        });

        // Show only authoritative server data.
        // Pending offline creates are tracked in the ConnectionIndicator and
        // intentionally hidden from the notes list to prevent navigation to
        // detail pages with non-existent server IDs.
        setNotes(res.data.notes);
        setCount(res.data.count);
        setTotalPages(res.data.totalPages);

        // Update cache in background — trusted devices only (fire and forget)
        if (offlineEnabled) {
          cacheNotes(res.data.notes).catch(() => {});
        }
      } catch (err) {
        // Server fetch failed — only surface error when there is nothing to show
        if (cachedData.length === 0) {
          setError(err instanceof Error ? err.message : 'حدث خطأ أثناء جلب الملاحظات');
        }
        // Otherwise keep showing cached data silently
      }
    } else if (cachedData.length === 0) {
      // Offline with no cached data at all — tell the user explicitly
      setError('لا يوجد اتصال بالإنترنت ولا توجد ملاحظات محفوظة للعرض');
    }
    // else: offline but we have cached data — show it silently (OfflineBanner already visible)

    setLoading(false);
  }, [page, pageSize, typeFilter, searchQuery, isOnline]);

  // Reset page to 1 when filter/search changes
  const setTypeFilterAndReset = useCallback((t: NoteType | '') => {
    setTypeFilter(t);
    setPage(1);
  }, []);

  const setSearchQueryAndReset = useCallback((q: string) => {
    setSearchQuery(q);
    setPage(1);
  }, []);

  // Auto-fetch
  useEffect(() => {
    if (autoFetch) {
      if (!didMount.current) {
        didMount.current = true;
      }
      fetchNotes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, typeFilter, searchQuery]);

  const createNote = useCallback(
    async (input: NoteInput): Promise<Note> => {
      const tempId = `tmp_${crypto.randomUUID()}`;
      const tempNote: Note = {
        _id: tempId,
        title: input.title,
        content: input.content,
        audioData: input.audioData,
        audioDuration: input.audioDuration,
        type: input.type,
        user: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (!isOnline) {
        // Guard: only queue offline ops on trusted devices.
        // On untrusted devices there is no guarantee the op can ever sync
        // (trust may never be granted), so we refuse the mutation immediately
        // rather than silently swallowing it into an unreachable queue.
        if (localStorage.getItem('device-trusted') !== 'true') {
          throw new Error(
            'لا يمكن إنشاء ملاحظات بدون اتصال على جهاز غير موثوق. ثق بهذا الجهاز أولاً.'
          );
        }
        // Queue the op and persist to Dexie, but do NOT add the temp note to the UI.
        // Pending notes are hidden from the list because navigating to a /notes/{tmp_id}
        // page would fail (no server record exists yet). The ConnectionIndicator shows
        // the pending count so the user knows their note is queued for sync.
        await enqueuePendingOp({
          type: 'create',
          tempId,
          payload: input,
          noteTitle: input.title,
          timestamp: Date.now(),
        });
        // Persist the temp note to Dexie so it survives a page reload while offline.
        cacheNotes([tempNote]).catch(() => {});
        // Register a Background Sync tag so the SW can wake up the page and
        // call processQueue() once connectivity is restored — even if the user
        // has closed the tab and reopened it later.
        if (
          'serviceWorker' in navigator &&
          'sync' in
            (navigator.serviceWorker as unknown as {
              ready: Promise<
                ServiceWorkerRegistration & { sync?: { register(tag: string): Promise<void> } }
              >;
            })
        ) {
          navigator.serviceWorker.ready
            .then((reg) =>
              (
                reg as unknown as { sync?: { register(tag: string): Promise<void> } }
              ).sync?.register('notes-sync')
            )
            .catch(() => {});
        }
        return tempNote;
      }

      // Online: optimistic update — the temp note is replaced by the real note
      // within a single server round-trip so the UX flash is imperceptible.
      setNotes((prev) => [tempNote, ...prev]);
      setCount((c) => c + 1);

      try {
        const res = await createNoteApi(input);
        // Replace temp note with the real server note
        setNotes((prev) => prev.map((n) => (n._id === tempId ? res.data : n)));
        cacheNotes([res.data]).catch(() => {});
        return res.data;
      } catch (err) {
        // Rollback optimistic insert on failure
        setNotes((prev) => prev.filter((n) => n._id !== tempId));
        setCount((c) => Math.max(0, c - 1));
        throw err;
      }
    },
    [isOnline]
  );

  const updateNote = useCallback(
    async (id: string, input: UpdateNoteInput): Promise<Note> => {
      // Capture snapshot before mutation (for rollback or undo)
      const currentNote = notesRef.current.find((n) => n._id === id);
      const optimisticNote: Note = currentNote
        ? { ...currentNote, ...input, updatedAt: new Date().toISOString() }
        : {
            _id: id,
            title: '',
            type: 'text',
            user: '',
            createdAt: '',
            updatedAt: new Date().toISOString(),
            ...input,
          };

      setNotes((prev) => prev.map((n) => (n._id === id ? optimisticNote : n)));

      if (!isOnline) {
        if (localStorage.getItem('device-trusted') !== 'true') {
          // Rollback the optimistic update and refuse the op
          if (currentNote) {
            setNotes((prev) => prev.map((n) => (n._id === id ? currentNote : n)));
          } else {
            setNotes((prev) => prev.filter((n) => n._id !== id));
          }
          throw new Error(
            'لا يمكن تعديل ملاحظات بدون اتصال على جهاز غير موثوق. ثق بهذا الجهاز أولاً.'
          );
        }
        await enqueuePendingOp({
          type: 'update',
          noteId: id,
          payload: input,
          noteTitle: currentNote?.title ?? (input as { title?: string }).title,
          noteSnapshot: currentNote,
          timestamp: Date.now(),
        });
        // Persist the optimistic state to Dexie so the update survives a page reload.
        cacheNotes([optimisticNote]).catch(() => {});
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready
            .then((reg) =>
              (
                reg as unknown as { sync?: { register(tag: string): Promise<void> } }
              ).sync?.register('notes-sync')
            )
            .catch(() => {});
        }
        return optimisticNote;
      }

      try {
        const res = await updateNoteApi(id, input);
        setNotes((prev) => prev.map((n) => (n._id === id ? res.data : n)));
        cacheNotes([res.data]).catch(() => {});
        return res.data;
      } catch (err) {
        // Rollback on failure
        if (currentNote) {
          setNotes((prev) => prev.map((n) => (n._id === id ? currentNote : n)));
        } else {
          setNotes((prev) => prev.filter((n) => n._id !== id));
        }
        throw err;
      }
    },
    [isOnline]
  );

  const deleteNote = useCallback(
    async (id: string): Promise<void> => {
      // Capture snapshot for rollback or undo
      const noteToDelete = notesRef.current.find((n) => n._id === id);
      setNotes((prev) => prev.filter((n) => n._id !== id));
      setCount((c) => Math.max(0, c - 1));

      if (!isOnline) {
        if (localStorage.getItem('device-trusted') !== 'true') {
          // Rollback the optimistic delete and refuse the op
          if (noteToDelete) {
            setNotes((prev) => [noteToDelete, ...prev]);
            setCount((c) => c + 1);
          }
          throw new Error(
            'لا يمكن حذف ملاحظات بدون اتصال على جهاز غير موثوق. ثق بهذا الجهاز أولاً.'
          );
        }
        // Remove from local cache so it won't reappear on page reload
        removeCachedNote(id).catch(() => {});
        await enqueuePendingOp({
          type: 'delete',
          noteId: id,
          noteTitle: noteToDelete?.title,
          noteSnapshot: noteToDelete,
          timestamp: Date.now(),
        });
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready
            .then((reg) =>
              (
                reg as unknown as { sync?: { register(tag: string): Promise<void> } }
              ).sync?.register('notes-sync')
            )
            .catch(() => {});
        }
        return;
      }

      try {
        await deleteNoteApi(id);
        removeCachedNote(id).catch(() => {});
      } catch (err) {
        // Rollback on failure
        if (noteToDelete) {
          setNotes((prev) => [noteToDelete, ...prev]);
          setCount((c) => c + 1);
        }
        throw err;
      }
    },
    [isOnline]
  );

  const processQueue = useCallback(async () => {
    // Security gate: never sync from a device that is no longer trusted.
    // Trust is checked at runtime against localStorage (written by useDevices
    // after every server fetch) rather than relying on stale in-memory state.
    if (localStorage.getItem('device-trusted') !== 'true') return;

    const ops = await getPendingOps();
    if (ops.length === 0) return;
    for (const op of ops) {
      try {
        if (op.type === 'create' && op.payload) {
          const res = await createNoteApi(op.payload as NoteInput);
          if (op.tempId) {
            // Temp notes are not added to UI state (see createNote offline path),
            // but this map is kept as a safety net for any edge-case where a
            // tmp_ note might slip into state (e.g. direct state manipulation).
            setNotes((prev) => prev.map((n) => (n._id === op.tempId ? res.data : n)));
            // Delete the stale Dexie entry immediately.  The real server note
            // (with a proper _id) is about to be cached by cacheNotes below.
            removeCachedNote(op.tempId).catch(() => {});
          }
          // Cache the authoritative server note.
          cacheNotes([res.data]).catch(() => {});
        } else if (
          op.type === 'update' &&
          op.noteId &&
          !op.noteId.startsWith('tmp_') &&
          op.payload
        ) {
          const res = await updateNoteApi(op.noteId, op.payload as UpdateNoteInput);
          setNotes((prev) => prev.map((n) => (n._id === op.noteId ? res.data : n)));
          cacheNotes([res.data]).catch(() => {});
        } else if (op.type === 'delete' && op.noteId && !op.noteId.startsWith('tmp_')) {
          await deleteNoteApi(op.noteId);
        }
        // Only remove from queue on success
        if (op.id !== undefined) await removePendingOp(op.id);
      } catch {
        // Keep the op in queue, just mark it as failed for display purposes
        if (op.id !== undefined) await incrementPendingOpFailure(op.id);
      }
    }
    // Catch-all cleanup: remove any tmp_* Dexie entries that were not cleaned up
    // above (e.g. stale entries created by older app versions that lacked the
    // per-op removeCachedNote call).  This is fast and idempotent.
    await cleanStaleNotes().catch(() => {});
    await fetchNotes();
  }, [fetchNotes]);

  // Process offline queue when connection is restored (after processQueue is defined)
  useEffect(() => {
    if (isOnline && !prevOnline.current) {
      processQueue();
    }
    prevOnline.current = isOnline;
  }, [isOnline, processQueue]);

  // SW background-sync triggers queue processing via a DOM custom event
  useEffect(() => {
    const handler = () => {
      processQueue();
    };
    window.addEventListener('notes:process-offline-queue', handler);
    return () => window.removeEventListener('notes:process-offline-queue', handler);
  }, [processQueue]);

  // Revert optimistic state when user undoes a pending operation from the drawer
  useEffect(() => {
    const handleUndoOp = (e: Event) => {
      const op = (e as CustomEvent<{ op: PendingOperation }>).detail?.op;
      if (!op) return;
      if (op.type === 'create' && op.tempId) {
        // Offline creates never enter state, so no note to filter and no count
        // to decrement — just a no-op guard in case a stale event fires.
        setNotes((prev) => prev.filter((n) => n._id !== op.tempId));
      } else if (op.type === 'update' && op.noteId && op.noteSnapshot) {
        setNotes((prev) => prev.map((n) => (n._id === op.noteId ? op.noteSnapshot! : n)));
      } else if (op.type === 'delete' && op.noteId && op.noteSnapshot) {
        setNotes((prev) => [op.noteSnapshot!, ...prev]);
        setCount((c) => c + 1);
      }
    };
    window.addEventListener('notes:undo-op', handleUndoOp);
    return () => window.removeEventListener('notes:undo-op', handleUndoOp);
  }, []);

  const getNote = useCallback(
    async (id: string): Promise<Note> => {
      const isTrusted = localStorage.getItem('device-trusted') === 'true';

      // ── Offline-first: skip the network request entirely when we know we're
      //    offline so the user sees the cached note instantly without waiting for
      //    a network timeout.  audioData is included because cacheNotes() stores
      //    the full note returned by getNoteApi() on every online visit.
      if (!isOnline) {
        if (isTrusted) {
          try {
            const cached = await getCachedNotes();
            const found = cached.find((n) => n._id === id);
            if (found) return found;
          } catch {
            /* ignore db errors */
          }
        }
        throw new Error('تعذر تحميل الملاحظة. تحقق من اتصالك بالإنترنت.');
      }

      // ── Online: fetch from server (includes audioData) ────────────────────
      try {
        const res = await getNoteApi(id);
        // Cache the full note (with audioData if it's a voice note) so the audio
        // player works next time the user opens this note while offline.
        if (isTrusted) {
          cacheNotes([res.data]).catch(() => {});
        }
        return res.data;
      } catch (err) {
        // Re-throw auth failures immediately — no point looking in cache
        const isAuthError = err instanceof Error && err.message.includes('401');
        if (isAuthError) throw err;

        // Server unreachable while nominally online — fall back to cache
        if (isTrusted) {
          try {
            const cached = await getCachedNotes();
            const found = cached.find((n) => n._id === id);
            if (found) return found;
          } catch {
            /* ignore db errors */
          }
        }
        throw new Error('تعذر تحميل الملاحظة. تحقق من اتصالك بالإنترنت.');
      }
    },
    [isOnline]
  );

  return {
    notes,
    loading,
    error,
    page,
    totalPages,
    count,
    typeFilter,
    searchQuery,
    isOnline,
    setPage,
    setTypeFilter: setTypeFilterAndReset,
    setSearchQuery: setSearchQueryAndReset,
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,
    getNote,
    processQueue,
  };
}
