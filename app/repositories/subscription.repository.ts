/**
 * Subscription Repository
 *
 * Extends BaseRepository with push subscription-specific data access methods.
 *
 * @reference PWA — backend/server.js (subscription CRUD)
 * @reference web-booking-e1 — singleton pattern
 */

import { BaseRepository } from './base.repository';
import Subscription from '@/app/models/Subscription';
import type { ISubscription } from '@/app/types';

class SubscriptionRepository extends BaseRepository<ISubscription> {
  constructor() {
    super(Subscription);
  }

  /** Find all push subscriptions for a user. */
  async findByUser(userId: string): Promise<ISubscription[]> {
    return this.findAll({ user: userId });
  }

  /** Find a subscription by its push endpoint URL. */
  async findByEndpoint(endpoint: string): Promise<ISubscription | null> {
    return this.findOne({ endpoint });
  }

  /** Delete all subscriptions belonging to a user (used in cascade delete). */
  async deleteByUser(userId: string): Promise<number> {
    return this.deleteWhere({ user: userId });
  }

  /** Delete a subscription by its endpoint (e.g., when unsubscribing). */
  async deleteByEndpoint(endpoint: string): Promise<ISubscription | null> {
    return this.model.findOneAndDelete({ endpoint });
  }
}

// ─── Singleton ───────────────────────────────────────────────────────────────
let instance: SubscriptionRepository | null = null;

export function getSubscriptionRepository(): SubscriptionRepository {
  if (!instance) instance = new SubscriptionRepository();
  return instance;
}

export { SubscriptionRepository };
