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
  const didMount = useRef(false);
  const prevOnline = useRef(true);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!isOnline) {
        const cached = await getCachedNotes();
        setNotes(cached);
        setCount(cached.length);
        setTotalPages(1);
        return;
      }
      const res = await getNotesApi({
        page,
        limit: pageSize,
        type: typeFilter || undefined,
        q: searchQuery || undefined,
      });
      setNotes(res.data.notes);
      setCount(res.data.count);
      setTotalPages(res.data.totalPages);
      cacheNotes(res.data.notes).catch(() => {}); // best-effort background cache
    } catch (err) {
      // API failed — fall back to Dexie cache if available
      try {
        const cached = await getCachedNotes();
        if (cached.length > 0) {
          setNotes(cached);
          setCount(cached.length);
          setTotalPages(1);
          return;
        }
      } catch { /* ignore secondary failure */ }
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء جلب الملاحظات');
    } finally {
      setLoading(false);
    }
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
    if (!isOnline) {
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
      await enqueuePendingOp({ type: 'create', tempId, payload: input, timestamp: Date.now() });
      return tempNote;
    }
    const res = await createNoteApi(input);
    await fetchNotes();
    return res.data;
  }, [fetchNotes, isOnline]);

  const updateNote = useCallback(
    async (id: string, input: UpdateNoteInput): Promise<Note> => {
      if (!isOnline) {
        const updated: Note = { _id: id, title: '', type: 'text', user: '', createdAt: '', updatedAt: new Date().toISOString(), ...input };
        setNotes((prev) =>
          prev.map((n) => (n._id === id ? { ...n, ...input, updatedAt: new Date().toISOString() } : n)),
        );
        await enqueuePendingOp({ type: 'update', noteId: id, payload: input, timestamp: Date.now() });
        return updated;
      }
      const res = await updateNoteApi(id, input);
      await fetchNotes();
      return res.data;
    },
    [fetchNotes, isOnline],
  );

  const deleteNote = useCallback(
    async (id: string): Promise<void> => {
      if (!isOnline) {
        setNotes((prev) => prev.filter((n) => n._id !== id));
        setCount((c) => Math.max(0, c - 1));
        await enqueuePendingOp({ type: 'delete', noteId: id, timestamp: Date.now() });
        return;
      }
      await deleteNoteApi(id);
      await fetchNotes();
    },
    [fetchNotes, isOnline],
  );

  const processQueue = useCallback(async () => {
    const ops = await getPendingOps();
    if (ops.length === 0) return;
    for (const op of ops) {
      try {
        if (op.type === 'create' && op.payload) {
          await createNoteApi(op.payload as NoteInput);
        } else if (op.type === 'update' && op.noteId && !op.noteId.startsWith('tmp_') && op.payload) {
          await updateNoteApi(op.noteId, op.payload as UpdateNoteInput);
        } else if (op.type === 'delete' && op.noteId && !op.noteId.startsWith('tmp_')) {
          await deleteNoteApi(op.noteId);
        }
        if (op.id !== undefined) await removePendingOp(op.id);
      } catch {
        // Remove the failed op to avoid blocking subsequent ops
        if (op.id !== undefined) await removePendingOp(op.id);
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

  const getNote = useCallback(async (id: string): Promise<Note> => {
    const res = await getNoteApi(id);
    return res.data;
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
