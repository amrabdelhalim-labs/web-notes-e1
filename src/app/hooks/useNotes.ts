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
        (typeof n.content === 'string' && n.content.toLowerCase().includes(q)),
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
    
    // Step 1: Always load from cache first for instant UI
    let cachedData: typeof notes = [];
    try {
      cachedData = await getCachedNotes();
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
    
    // Step 2: If online, fetch fresh data from server in background
    if (isOnline) {
      try {
        const res = await getNotesApi({
          page,
          limit: pageSize,
          type: typeFilter || undefined,
          q: searchQuery || undefined,
        });

        // Re-inject any optimistic creates still pending sync
        const allPendingOps = await getPendingOps();
        const pendingCreates = allPendingOps
          .filter((op) => op.type === 'create' && op.tempId && op.payload)
          .map((op) => ({
            _id: op.tempId!,
            title: (op.payload as NoteInput).title ?? '',
            content: (op.payload as NoteInput).content,
            type: (op.payload as NoteInput).type ?? 'text',
            user: '',
            createdAt: new Date(op.timestamp).toISOString(),
            updatedAt: new Date(op.timestamp).toISOString(),
          } as Note));
        const serverIds = new Set(res.data.notes.map((n) => n._id));
        const uniqueTemps = pendingCreates.filter((n) => !serverIds.has(n._id));
        // Update UI with fresh server data + any unsynced creates
        setNotes([...uniqueTemps, ...res.data.notes]);
        setCount(res.data.count + uniqueTemps.length);
        setTotalPages(res.data.totalPages);

        // Update cache in background (fire and forget)
        cacheNotes(res.data.notes).catch(() => {});
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

  const createNote = useCallback(async (input: NoteInput): Promise<Note> => {
    // Optimistic: show the note immediately with a temp id
    const tempId = `tmp_${crypto.randomUUID()}`;
    const tempNote: Note = {
      _id: tempId,
      title: input.title,
      content: input.content,
      type: input.type,
      user: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotes((prev) => [tempNote, ...prev]);
    setCount((c) => c + 1);

    if (!isOnline) {
      await enqueuePendingOp({
        type: 'create',
        tempId,
        payload: input,
        noteTitle: input.title,
        timestamp: Date.now(),
      });
      return tempNote;
    }

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
  }, [isOnline]);

  const updateNote = useCallback(
    async (id: string, input: UpdateNoteInput): Promise<Note> => {
      // Capture snapshot before mutation (for rollback or undo)
      const currentNote = notesRef.current.find((n) => n._id === id);
      const optimisticNote: Note = currentNote
        ? { ...currentNote, ...input, updatedAt: new Date().toISOString() }
        : { _id: id, title: '', type: 'text', user: '', createdAt: '', updatedAt: new Date().toISOString(), ...input };

      setNotes((prev) => prev.map((n) => (n._id === id ? optimisticNote : n)));

      if (!isOnline) {
        await enqueuePendingOp({
          type: 'update',
          noteId: id,
          payload: input,
          noteTitle: currentNote?.title ?? (input as { title?: string }).title,
          noteSnapshot: currentNote,
          timestamp: Date.now(),
        });
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
    [isOnline],
  );

  const deleteNote = useCallback(
    async (id: string): Promise<void> => {
      // Capture snapshot for rollback or undo
      const noteToDelete = notesRef.current.find((n) => n._id === id);
      setNotes((prev) => prev.filter((n) => n._id !== id));
      setCount((c) => Math.max(0, c - 1));

      if (!isOnline) {
        // Remove from local cache so it won't reappear on page reload
        removeCachedNote(id).catch(() => {});
        await enqueuePendingOp({
          type: 'delete',
          noteId: id,
          noteTitle: noteToDelete?.title,
          noteSnapshot: noteToDelete,
          timestamp: Date.now(),
        });
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
    [isOnline],
  );

  const processQueue = useCallback(async () => {
    const ops = await getPendingOps();
    if (ops.length === 0) return;
    for (const op of ops) {
      try {
        if (op.type === 'create' && op.payload) {
          const res = await createNoteApi(op.payload as NoteInput);
          // Replace the optimistic temp note in state with the real server note
          if (op.tempId) {
            setNotes((prev) => prev.map((n) => (n._id === op.tempId ? res.data : n)));
          }
          cacheNotes([res.data]).catch(() => {});
        } else if (op.type === 'update' && op.noteId && !op.noteId.startsWith('tmp_') && op.payload) {
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
    const handler = () => { processQueue(); };
    window.addEventListener('notes:process-offline-queue', handler);
    return () => window.removeEventListener('notes:process-offline-queue', handler);
  }, [processQueue]);

  // Revert optimistic state when user undoes a pending operation from the drawer
  useEffect(() => {
    const handleUndoOp = (e: Event) => {
      const op = (e as CustomEvent<{ op: PendingOperation }>).detail?.op;
      if (!op) return;
      if (op.type === 'create' && op.tempId) {
        setNotes((prev) => prev.filter((n) => n._id !== op.tempId));
        setCount((c) => Math.max(0, c - 1));
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

  const getNote = useCallback(async (id: string): Promise<Note> => {
    try {
      const res = await getNoteApi(id);
      return res.data;
    } catch (err) {
      // Re-throw auth failures immediately — no point looking in cache
      const isAuthError = err instanceof Error && err.message.includes('401');
      if (isAuthError) throw err;

      // Network / server error — try local cache as fallback
      try {
        const cached = await getCachedNotes();
        const found = cached.find((n) => n._id === id);
        if (found) return found;
      } catch { /* ignore db errors */ }

      throw new Error('تعذر تحميل الملاحظة. تحقق من اتصالك بالإنترنت.');
    }
  }, []);

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
