/**
 * GET /api/health
 *
 * Returns application and database health status.
 * No authentication required.
 */

import { NextResponse } from 'next/server';
import { connectDB, getConnectionStatus } from '@/app/lib/mongodb';
import { getRepositoryManager } from '@/app/repositories';

export async function GET(): Promise<NextResponse> {
  try {
    await connectDB();

    const repos = getRepositoryManager();
    const health = await repos.healthCheck();

    return NextResponse.json(
      {
        status: health.status,
        database: health.database,
        repositories: health.repositories,
        timestamp: new Date().toISOString(),
      },
      { status: health.status === 'healthy' ? 200 : 503 }
    );
  } catch {
    return NextResponse.json(
      {
        status: 'error',
        database: getConnectionStatus(),
        repositories: {},
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
