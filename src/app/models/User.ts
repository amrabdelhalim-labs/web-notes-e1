/**
 * User Model
 *
 * Mongoose schema for application users.
 * Stores credentials, profile information, and language preference.
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
      enum: ['ar', 'en', 'unset'],
      default: 'unset',
    },
  },
  { timestamps: true }
);

// Indexes: `unique: true` on the field definitions already creates unique indexes.

/**
 * Prevent model recompilation during HMR in Next.js development.
 */
export default mongoose.models.User ?? mongoose.model<IUser>('User', userSchema);
