/**
 * Auth Middleware
 *
 * Extracts and verifies the JWT token from the Authorization header.
 * Returns the authenticated user's ID or a 401 error response.
 *
 * Usage in API route handlers:
 * ```ts
 * const auth = authenticateRequest(request);
 * if (auth.error) return auth.error;
 * const userId = auth.userId; // guaranteed string
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/app/lib/auth';
import { getRequestLocale, unauthorizedError } from '@/app/lib/apiErrors';
import type { ApiResponse } from '@/app/types';

interface AuthSuccess {
  userId: string;
  error?: undefined;
}

interface AuthFailure {
  userId?: undefined;
  error: NextResponse<ApiResponse<null>>;
}

export type AuthResult = AuthSuccess | AuthFailure;

/**
 * Authenticate an incoming API request via the Bearer token.
 * Returns `{ userId }` on success or `{ error }` on failure.
 */
export function authenticateRequest(request: NextRequest): AuthResult {
  const locale = getRequestLocale(request);
  const header = request.headers.get('authorization');

  if (!header || !header.startsWith('Bearer ')) {
    return { error: unauthorizedError(locale, 'tokenMissing') };
  }

  const token = header.slice(7); // strip "Bearer "

  try {
    const payload = verifyToken(token);
    return { userId: payload.id };
  } catch {
    return { error: unauthorizedError(locale, 'tokenInvalid') };
  }
}
