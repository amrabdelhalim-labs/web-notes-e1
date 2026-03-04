/**
 * Repository Manager (Singleton)
 *
 * Central access point for all repositories.
 * Provides a single, cached instance of each entity repository
 * and a health-check helper for the `/api/health` endpoint.
 *
 * @reference web-booking-e1 — server/src/repositories/index.ts
 * @reference project-chatapp-e1 — server/repositories/index.js
 */

import mongoose from 'mongoose';
import { getUserRepository, UserRepository } from './user.repository';
import { getNoteRepository, NoteRepository } from './note.repository';
import {
  getSubscriptionRepository,
  SubscriptionRepository,
} from './subscription.repository';

class RepositoryManager {
  get user(): UserRepository {
    return getUserRepository();
  }

  get note(): NoteRepository {
    return getNoteRepository();
  }

  get subscription(): SubscriptionRepository {
    return getSubscriptionRepository();
  }

  /**
   * Perform a lightweight health check on every repository.
   * Returns overall status and per-repository availability.
   */
  async healthCheck(): Promise<{
    status: string;
    database: string;
    repositories: Record<string, boolean>;
  }> {
    const dbState = mongoose.connection.readyState;
    const dbStatus =
      dbState === 1
        ? 'connected'
        : dbState === 2
          ? 'connecting'
          : 'disconnected';

    const results: Record<string, boolean> = {};

    try {
      await this.user.count();
      results.user = true;
    } catch {
      results.user = false;
    }

    try {
      await this.note.count();
      results.note = true;
    } catch {
      results.note = false;
    }

    try {
      await this.subscription.count();
      results.subscription = true;
    } catch {
      results.subscription = false;
    }

    const allHealthy = Object.values(results).every(Boolean);

    return {
      status: allHealthy ? 'healthy' : 'degraded',
      database: dbStatus,
      repositories: results,
    };
  }
}

// ─── Singleton ───────────────────────────────────────────────────────────────
let instance: RepositoryManager | null = null;

export function getRepositoryManager(): RepositoryManager {
  if (!instance) instance = new RepositoryManager();
  return instance;
}

export { RepositoryManager };
