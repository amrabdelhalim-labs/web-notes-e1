/**
 * Note Repository
 *
 * Extends BaseRepository with note-specific data access methods.
 * Supports text search, filtering by type, and user-scoped queries.
 *
 * @reference web-booking-e1 — server/src/repositories/event.repository.ts (search pattern)
 * @reference project-chatapp-e1 — server/repositories/message.repository.js (user-scoped queries)
 */

import { BaseRepository } from './base.repository';
import Note from '@/app/models/Note';
import type { INote, NoteType, PaginatedResult } from '@/app/types';

class NoteRepository extends BaseRepository<INote> {
  constructor() {
    super(Note);
  }

  /** Find all notes belonging to a user, sorted by newest first. */
  async findByUser(userId: string): Promise<INote[]> {
    return this.findAll({ user: userId }, { sort: { createdAt: -1 } });
  }

  /** Find notes by user with safe pagination. */
  async findByUserPaginated(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResult<INote>> {
    return this.findPaginated(page, limit, { user: userId }, {
      sort: { createdAt: -1 },
    });
  }

  /** Find notes by user filtered by type (text/voice). */
  async findByType(
    userId: string,
    type: NoteType,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResult<INote>> {
    return this.findPaginated(page, limit, { user: userId, type }, {
      sort: { createdAt: -1 },
    });
  }

  /**
   * Search notes by title/content using regex.
   * Escapes special regex characters from the search term for safety.
   *
   * @reference web-booking-e1 — EventRepository.search() (regex escape pattern)
   */
  async search(
    userId: string,
    searchTerm: string,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResult<INote>> {
    const escaped = searchTerm.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');

    return this.findPaginated(
      page,
      limit,
      {
        user: userId,
        $or: [{ title: regex }, { content: regex }],
      },
      { sort: { createdAt: -1 } }
    );
  }

  /** Delete all notes belonging to a user (used in cascade delete). */
  async deleteByUser(userId: string): Promise<number> {
    return this.deleteWhere({ user: userId });
  }
}

// ─── Singleton ───────────────────────────────────────────────────────────────
let instance: NoteRepository | null = null;

export function getNoteRepository(): NoteRepository {
  if (!instance) instance = new NoteRepository();
  return instance;
}

export { NoteRepository };
