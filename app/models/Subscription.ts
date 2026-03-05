/**
 * Subscription Model
 *
 * Mongoose schema for Web Push notification subscriptions.
 * Each record links a push endpoint to a user and device.
 */

import mongoose, { Schema } from 'mongoose';
import type { ISubscription } from '@/app/types';

const subscriptionSchema = new Schema<ISubscription>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    endpoint: {
      type: String,
      required: true,
      unique: true,
    },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    deviceInfo: {
      type: String,
      trim: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
subscriptionSchema.index({ user: 1 });
subscriptionSchema.index({ endpoint: 1 }, { unique: true });

/**
 * Prevent model recompilation during HMR in Next.js development.
 */
export default mongoose.models.Subscription ??
  mongoose.model<ISubscription>('Subscription', subscriptionSchema);
