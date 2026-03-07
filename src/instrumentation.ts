/**
 * Next.js Instrumentation Hook
 *
 * Runs once on server startup (Node.js runtime only).
 * - Prints server URL and port
 * - Registers Mongoose connection event listeners (connected / disconnected / error / reconnected)
 * - Initiates the initial MongoDB connection so the first API request isn't delayed
 */

function maskUrl(url: string): string {
  // Hide credentials: mongodb://user:pass@host → mongodb://**:**@host
  return url.replace(/:\/\/([^@]+)@/, '://**:**@');
}

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const port = process.env.PORT ?? '3000';
  const env = process.env.NODE_ENV ?? 'development';
  console.log(`\n🚀  Next.js server started`);
  console.log(`    URL  : http://localhost:${port}`);
  console.log(`    ENV  : ${env}`);

  const mongoose = await import('mongoose');
  const { connectDB } = await import('./app/lib/mongodb');

  // Register connection lifecycle events once
  const conn = mongoose.default.connection;

  conn.once('connected', () => {
    const db = conn.db?.databaseName ?? 'unknown';
    console.log(`✅  MongoDB connected  (db: ${db}, host: ${conn.host})\n`);
  });

  conn.on('disconnected', () =>
    console.warn('⚠️   MongoDB disconnected — waiting for reconnect…'),
  );

  conn.on('reconnected', () =>
    console.log('🔄  MongoDB reconnected'),
  );

  conn.on('error', (err: Error) =>
    console.error('❌  MongoDB error:', err.message),
  );

  // Warm up the connection so the first request isn't delayed
  const DATABASE_URL =
    process.env.DATABASE_URL ||
    process.env.MONGODB_URI ||
    'mongodb://localhost:27017/mynotes';

  console.log(`🔌  Connecting to MongoDB → ${maskUrl(DATABASE_URL)}`);

  try {
    await connectDB();
  } catch (err) {
    console.error('❌  MongoDB initial connection failed:', (err as Error).message, '\n');
  }
}
