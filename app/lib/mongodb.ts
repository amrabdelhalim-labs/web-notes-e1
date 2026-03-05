/**
 * MongoDB Connection (Singleton)
 *
 * Manages a cached Mongoose connection for Next.js serverless environment.
 * In development, the connection is cached on `globalThis` to survive HMR reloads.
 * In production, each cold start creates a fresh connection that persists
 * for the lifetime of the serverless function instance.
 */

import mongoose from 'mongoose';

const DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.MONGODB_URI ||
  'mongodb://localhost:27017/mynotes';

/**
 * Global cache type — survives HMR in development.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var __mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = globalThis.__mongoose ?? { conn: null, promise: null };
if (!globalThis.__mongoose) globalThis.__mongoose = cached;

/**
 * Returns a cached Mongoose connection.
 * Safe to call from any API route or server component.
 *
 * @example
 * ```ts
 * import { connectDB } from '@/app/lib/mongodb';
 * await connectDB();
 * ```
 */
export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(DATABASE_URL, {
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

/**
 * Returns the current Mongoose connection state as a human-readable string.
 * Useful for the `/api/health` endpoint.
 */
export function getConnectionStatus(): string {
  const state = mongoose.connection.readyState;
  const map: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return map[state] ?? 'unknown';
}
