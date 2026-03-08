/**
 * Device Model
 *
 * Mongoose schema for trusted devices.
 * Each record represents a device the user has explicitly trusted.
 * Only trusted devices may install the PWA or receive push notifications.
 */

import mongoose, { Schema } from 'mongoose';
import type { IDevice } from '@/app/types';

const deviceSchema = new Schema<IDevice>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    /** Client-generated UUID stored in localStorage. */
    deviceId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      trim: true,
      default: '',
    },
    browser: {
      type: String,
      trim: true,
      default: '',
    },
    os: {
      type: String,
      trim: true,
      default: '',
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
deviceSchema.index({ user: 1 });
deviceSchema.index({ user: 1, deviceId: 1 }, { unique: true });

/**
 * Prevent model recompilation during HMR in Next.js development.
 */
export default mongoose.models.Device ?? mongoose.model<IDevice>('Device', deviceSchema);
