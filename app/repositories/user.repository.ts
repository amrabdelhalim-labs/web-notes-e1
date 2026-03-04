/**
 * User Repository
 *
 * Extends BaseRepository with user-specific data access methods.
 *
 * @reference web-booking-e1 — server/src/repositories/user.repository.ts
 * @reference project-chatapp-e1 — server/repositories/user.repository.js
 */

import { BaseRepository } from './base.repository';
import User from '@/app/models/User';
import type { IUser } from '@/app/types';

class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(User);
  }

  /** Find a user by their email address. */
  async findByEmail(email: string): Promise<IUser | null> {
    return this.findOne({ email });
  }

  /** Find a user by their username. */
  async findByUsername(username: string): Promise<IUser | null> {
    return this.findOne({ username });
  }

  /** Check if an email is already registered. */
  async emailExists(email: string): Promise<boolean> {
    return this.exists({ email });
  }

  /** Check if a username is already taken. */
  async usernameExists(username: string): Promise<boolean> {
    return this.exists({ username });
  }

  /**
   * Delete a user and all associated data (notes + subscriptions).
   * Uses the repository references to perform cascade deletion.
   */
  async deleteUserCascade(
    userId: string,
    noteRepo: { deleteByUser(userId: string): Promise<number> },
    subscriptionRepo: { deleteByUser(userId: string): Promise<number> }
  ): Promise<IUser | null> {
    await Promise.all([
      noteRepo.deleteByUser(userId),
      subscriptionRepo.deleteByUser(userId),
    ]);
    return this.delete(userId);
  }
}

// ─── Singleton ───────────────────────────────────────────────────────────────
let instance: UserRepository | null = null;

export function getUserRepository(): UserRepository {
  if (!instance) instance = new UserRepository();
  return instance;
}

export { UserRepository };
