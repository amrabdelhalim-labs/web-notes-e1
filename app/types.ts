import { Document, Types } from 'mongoose';

// ─── Shared Types ────────────────────────────────────────────────────────────
export type SupportedLocale = 'ar' | 'en';
export type NoteType = 'text' | 'voice';

// ─── Client-Side Types (serialisable — JSON safe) ───────────────────────────
export interface User {
  _id: string;
  username: string;
  email: string;
  displayName?: string;
  language: SupportedLocale;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  _id: string;
  title: string;
  content?: string;
  audioData?: string;
  audioDuration?: number;
  type: NoteType;
  user: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Server-Side Types (Mongoose Documents) ─────────────────────────────────
/**
 * @reference web-booking-e1 — server/src/types/index.ts
 * All Mongoose document interfaces include `_doc` for raw-doc access
 * and extend `Document` to work with the Repository pattern generics.
 */
export interface IUser extends Document {
  _doc?: Record<string, unknown>;
  username: string;
  email: string;
  password: string;
  displayName?: string;
  language: SupportedLocale;
  createdAt: Date;
  updatedAt: Date;
}

export interface INote extends Document {
  _doc?: Record<string, unknown>;
  title: string;
  content?: string;
  audioData?: Buffer;
  audioDuration?: number;
  type: NoteType;
  user: Types.ObjectId | IUser;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubscription extends Document {
  _doc?: Record<string, unknown>;
  user: Types.ObjectId | IUser;
  endpoint: string;
  keys: { p256dh: string; auth: string };
  deviceInfo?: string;
  createdAt: Date;
}

// ─── API Types ──────────────────────────────────────────────────────────────
export interface ApiError {
  code: string;
  message: string;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: ApiError;
}

export interface PaginatedResult<T> {
  rows: T[];
  count: number;
  page: number;
  totalPages: number;
}

// ─── Auth Types ─────────────────────────────────────────────────────────────
export interface JwtPayload {
  id: string;
  iat?: number;
  exp?: number;
}

// ─── Input Types (for validators) ───────────────────────────────────────────
export interface RegisterInput {
  username: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface NoteInput {
  title: string;
  content?: string;
  audioData?: string;
  audioDuration?: number;
  type: NoteType;
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
  audioData?: string;
  audioDuration?: number;
}

export interface UpdateUserInput {
  username?: string;
  email?: string;
  displayName?: string;
  language?: SupportedLocale;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
