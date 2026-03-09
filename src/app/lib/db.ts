/**
 * Dexie Offline Database — db.ts
 *
 * Schema:
 *   notes      — local cache of the last fetched notes list.
 *                Serves as the offline read-source when there is no network.
 *   pendingOps — mutation queue for offline writes (create / update / delete).
 *                Processed in order when connectivity resumes.
 *   devices    — local cache of the user's trusted devices list.
 *                Allows the profile page to show devices offline.
 *
 * Inspired by the reference project (PWA / Dexie_Actions.jsx) but rewritten
 * as a typed TypeScript class with a proper schema versioning strategy.
 */

import Dexie, { type Table } from 'dexie';
import type { Note, NoteInput, UpdateNoteInput, Device } from '@/app/types';
import { MAX_CACHED_NOTES } from '@/app/config';

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
  /** Human-readable note title — shown in the Pending Operations panel. */
  noteTitle?: string;
  /** Full note snapshot before the mutation — used for undo. */
  noteSnapshot?: Note;
  /** The payload to send to the server. */
  payload?: NoteInput | UpdateNoteInput;
  /** Unix timestamp (ms) when the op was queued. */
  timestamp: number;
  /** How many times this op failed to sync (kept for retry rather than discarded). */
  failureCount?: number;
}

// ─── Database ─────────────────────────────────────────────────────────────────

/** A trusted device stored in the local cache. Mirrors the server Device shape. */
export type CachedDevice = Device & {
  /** Timestamp (ms) when this entry was cached locally. */
  _cachedAt: number;
};

export class NotesDb extends Dexie {
  notes!: Table<CachedNote>;
  pendingOps!: Table<PendingOperation>;
  devices!: Table<CachedDevice>;

  constructor() {
    super('mynotes_offline_db');
    this.version(1).stores({
      /** _id is the primary key from MongoDB; index on type and createdAt for filtering */
      notes: '_id, type, createdAt, _cachedAt',
      /** auto-increment PK; index on type for queue processing */
      pendingOps: '++id, type, timestamp',
    });
    this.version(2).stores({
      notes: '_id, type, createdAt, _cachedAt',
      pendingOps: '++id, type, timestamp',
      devices: 'deviceId, _cachedAt',
    });
  }
}

export const db = new NotesDb();

// ─── Cache helpers ────────────────────────────────────────────────────────────

/**
 * Replace the local notes cache with a fresh page of notes from the server.
 * Automatically enforces MAX_CACHED_NOTES limit by removing oldest entries.
 *
 * Strategy:
 *   1. Add new notes to cache
 *   2. Keep only the most recent MAX_CACHED_NOTES entries
 *   3. Remove the rest (oldest first by createdAt)
 */
export async function cacheNotes(notes: Note[]): Promise<void> {
  const now = Date.now();
  const entries: CachedNote[] = notes.map((n) => ({ ...n, _cachedAt: now }));

  // Preserve audioData / audioDuration from existing Dexie entries when the
  // incoming records (e.g. from the list API that strips audioData for bandwidth)
  // do not carry them. This prevents a generic fetchNotes() from silently
  // overwriting a fully-cached voice note that was fetched individually via getNote().
  const existing = await db.notes.bulkGet(entries.map((e) => e._id));
  const merged = entries.map((entry, i) => {
    const prev = existing[i];
    if (prev?.audioData && !entry.audioData) {
      return {
        ...entry,
        audioData: prev.audioData,
        audioDuration: entry.audioDuration ?? prev.audioDuration,
      };
    }
    return entry;
  });

  // Add new entries
  await db.notes.bulkPut(merged);

  // Enforce cache size limit
  const totalCount = await db.notes.count();
  if (totalCount > MAX_CACHED_NOTES) {
    // Get all notes sorted by createdAt descending
    const allNotes = await db.notes.orderBy('createdAt').reverse().toArray();

    // Delete the rest
    const toDelete = allNotes.slice(MAX_CACHED_NOTES).map((n) => n._id);
    if (toDelete.length > 0) {
      await db.notes.bulkDelete(toDelete);
    }
  }
}

/** Read notes from the local cache, ordered by createdAt descending. */
export async function getCachedNotes(): Promise<CachedNote[]> {
  return db.notes.orderBy('createdAt').reverse().toArray();
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

/** Increment the failure counter for an op without removing it (keep for retry). */
export async function incrementPendingOpFailure(id: number): Promise<void> {
  const op = await db.pendingOps.get(id);
  if (op) {
    await db.pendingOps.update(id, { failureCount: (op.failureCount ?? 0) + 1 });
  }
}

/** Remove a single note from the local cache (e.g. after an offline delete). */
export async function removeCachedNote(id: string): Promise<void> {
  await db.notes.delete(id);
}

// ─── Device cache helpers ────────────────────────────────────────────────────

/** Replace the local devices cache with a fresh list from the server. */
export async function cacheDevices(devices: Device[]): Promise<void> {
  const now = Date.now();
  const entries: CachedDevice[] = devices.map((d) => ({ ...d, _cachedAt: now }));
  await db.devices.clear();
  if (entries.length > 0) {
    await db.devices.bulkPut(entries);
  }
}

/** Read devices from the local cache. */
export async function getCachedDevices(): Promise<CachedDevice[]> {
  return db.devices.toArray();
}

/**
 * Clear all offline-sensitive data when device trust is revoked.
 *
 * - pendingOps: must be discarded — they must never sync to the server
 *   from a device that is no longer authorised.
 * - notes: cached content is the user's private data; clearing it on
 *   trust revocation prevents the next person who picks up the device
 *   from reading notes through the installed PWA.
 * - devices: kept intentionally — it is only metadata (names/timestamps)
 *   and is re-fetched on the next authenticated session.
 */
export async function clearOfflineData(): Promise<void> {
  await Promise.all([db.pendingOps.clear(), db.notes.clear()]);
}
