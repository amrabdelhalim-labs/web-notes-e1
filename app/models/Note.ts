/**
 * Note Model
 *
 * Mongoose schema for user notes.
 * Supports two types: text notes (with content) and voice notes (with audioData).
 */

import mongoose, { Schema } from 'mongoose';
import type { INote } from '@/app/types';

const noteSchema = new Schema<INote>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 200,
    },
    content: {
      type: String,
      trim: true,
    },
    audioData: {
      type: Buffer,
    },
    audioDuration: {
      type: Number,
      min: 0,
    },
    type: {
      type: String,
      required: true,
      enum: ['text', 'voice'],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
noteSchema.index({ user: 1, createdAt: -1 });
noteSchema.index({ user: 1, type: 1 });
noteSchema.index({ title: 'text', content: 'text' });

/**
 * Prevent model recompilation during HMR in Next.js development.
 */
export default mongoose.models.Note ??
  mongoose.model<INote>('Note', noteSchema);
