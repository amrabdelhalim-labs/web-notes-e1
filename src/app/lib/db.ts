/**
 * Dexie Offline Database — db.ts
 *
 * Schema:
 *   notes      — local cache of the last fetched notes list.
 *                Serves as the offline read-source when there is no network.
 *   pendingOps — mutation queue for offline writes (create / update / delete).
 *                Processed in order when connectivity resumes.
 *
 * Inspired by the reference project (PWA / Dexie_Actions.jsx) but rewritten
 * as a typed TypeScript class with a proper schema versioning strategy.
 */

import Dexie, { type Table } from 'dexie';
import type { Note, NoteInput, UpdateNoteInput } from '@/app/types';

// ─── Schemas ─────────────────────────────────────────────────────────────────

/** A note stored in the local cache.  Mirrors the server Note shape. */
export type CachedNote = Note & {
  /** Timestamp (ms) when this entry was cached locally. */
  _cachedAt: number;
};

export type PendingOpType = 'create' | 'update' | 'delete';

export interface PendingOperation {
  /** Auto-incrementing primary key. */
  id?: number;
  type: PendingOpType;
  /** Temp client-side _id used for create operations before the server assigns one. */
  tempId?: string;
  /** Real note _id (for update / delete). */
  noteId?: string;
  /** The payload to send to the server. */
  payload?: NoteInput | UpdateNoteInput;
  /** Unix timestamp (ms) when the op was queued. */
  timestamp: number;
}

// ─── Database ─────────────────────────────────────────────────────────────────

export class NotesDb extends Dexie {
  notes!: Table<CachedNote>;
  pendingOps!: Table<PendingOperation>;

  constructor() {
    super('mynotes_offline_db');
    this.version(1).stores({
      /** _id is the primary key from MongoDB; index on type and createdAt for filtering */
      notes: '_id, type, createdAt, _cachedAt',
      /** auto-increment PK; index on type for queue processing */
      pendingOps: '++id, type, timestamp',
    });
  }
}

export const db = new NotesDb();

// ─── Cache helpers ────────────────────────────────────────────────────────────

/** Replace the local notes cache with a fresh page of notes from the server. */
export async function cacheNotes(notes: Note[]): Promise<void> {
  const now = Date.now();
  const entries: CachedNote[] = notes.map((n) => ({ ...n, _cachedAt: now }));
  await db.notes.bulkPut(entries);
}

/** Read notes from the local cache, ordered by createdAt descending. */
export async function getCachedNotes(): Promise<CachedNote[]> {
  return db.notes.orderBy('createdAt').reverse().toArray();
}

/** Remove stale cache entries older than `maxAge` milliseconds. */
export async function pruneCache(maxAge = 7 * 24 * 60 * 60 * 1000): Promise<void> {
  const cutoff = Date.now() - maxAge;
  await db.notes.where('_cachedAt').below(cutoff).delete();
}

// ─── Pending-ops helpers ─────────────────────────────────────────────────────

/** Enqueue an offline mutation. Returns the auto-assigned `id`. */
export async function enqueuePendingOp(op: Omit<PendingOperation, 'id'>): Promise<number> {
  return db.pendingOps.add({ ...op, timestamp: Date.now() }) as Promise<number>;
}

/** Return all queued operations in insertion order. */
export async function getPendingOps(): Promise<PendingOperation[]> {
  return db.pendingOps.orderBy('id').toArray();
}

/** Remove a processed operation from the queue. */
export async function removePendingOp(id: number): Promise<void> {
  await db.pendingOps.delete(id);
}

/** True when there are unflushed offline operations. */
export async function hasPendingOps(): Promise<boolean> {
  return (await db.pendingOps.count()) > 0;
}
