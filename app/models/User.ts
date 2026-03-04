/**
 * User Model
 *
 * Mongoose schema for application users.
 * Stores credentials, profile information, and language preference.
 *
 * @reference web-booking-e1 — server/src/models/user.ts
 * @reference project-chatapp-e1 — server/models/User.js (timestamps pattern)
 */

import mongoose, { Schema } from 'mongoose';
import type { IUser } from '@/app/types';

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    displayName: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    language: {
      type: String,
      enum: ['ar', 'en'],
      default: 'ar',
    },
  },
  { timestamps: true }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });

/**
 * Prevent model recompilation during HMR in Next.js development.
 */
export default mongoose.models.User ??
  mongoose.model<IUser>('User', userSchema);
