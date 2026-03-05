/**
 * User Repository
 *
 * Extends BaseRepository with user-specific data access methods.
 */

import mongoose from 'mongoose';
import { BaseRepository } from './base.repository';
import User from '@/app/models/User';
import Note from '@/app/models/Note';
import Subscription from '@/app/models/Subscription';
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
   * Delete a user and all associated data (notes + subscriptions)
   * inside a single MongoDB transaction to prevent partial failures.
   *
   * If any step fails the entire operation rolls back — no orphaned data.
   */
  async deleteUserCascade(userId: string): Promise<IUser | null> {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      await Promise.all([
        Note.deleteMany({ user: userId }, { session }),
        Subscription.deleteMany({ user: userId }, { session }),
      ]);

      const deletedUser = await User.findByIdAndDelete(userId, { session });

      await session.commitTransaction();
      return deletedUser;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}

// ─── Singleton ───────────────────────────────────────────────────────────────
let instance: UserRepository | null = null;

export function getUserRepository(): UserRepository {
  if (!instance) instance = new UserRepository();
  return instance;
}

export { UserRepository };
