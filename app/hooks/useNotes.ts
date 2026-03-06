'use client';

/**
 * useNotes — custom hook for notes management.
 *
 * Encapsulates API calls, loading/error state, pagination, filtering,
 * and CRUD operations for notes.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Note, NoteType, NoteInput, UpdateNoteInput } from '@/app/types';
import {
  getNotesApi,
  getNoteApi,
  createNoteApi,
  updateNoteApi,
  deleteNoteApi,
} from '@/app/lib/api';

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
  setPage: (p: number) => void;
  setTypeFilter: (t: NoteType | '') => void;
  setSearchQuery: (q: string) => void;
  fetchNotes: () => Promise<void>;
  createNote: (input: NoteInput) => Promise<Note>;
  updateNote: (id: string, input: UpdateNoteInput) => Promise<Note>;
  deleteNote: (id: string) => Promise<void>;
  getNote: (id: string) => Promise<Note>;
}

export function useNotes(options: UseNotesOptions = {}): UseNotesReturn {
  const { pageSize = 10, autoFetch = true } = options;

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);
  const [typeFilter, setTypeFilter] = useState<NoteType | ''>('');
  const [searchQuery, setSearchQuery] = useState('');

  const didMount = useRef(false);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getNotesApi({
        page,
        limit: pageSize,
        type: typeFilter || undefined,
        q: searchQuery || undefined,
      });
      setNotes(res.data.notes);
      setCount(res.data.count);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء جلب الملاحظات');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, typeFilter, searchQuery]);

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
    const res = await createNoteApi(input);
    // Refresh list after creation
    await fetchNotes();
    return res.data;
  }, [fetchNotes]);

  const updateNote = useCallback(
    async (id: string, input: UpdateNoteInput): Promise<Note> => {
      const res = await updateNoteApi(id, input);
      await fetchNotes();
      return res.data;
    },
    [fetchNotes],
  );

  const deleteNote = useCallback(
    async (id: string): Promise<void> => {
      await deleteNoteApi(id);
      await fetchNotes();
    },
    [fetchNotes],
  );

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
    setPage,
    setTypeFilter: setTypeFilterAndReset,
    setSearchQuery: setSearchQueryAndReset,
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,
    getNote,
  };
}
