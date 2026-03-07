/**
 * API Error Handling
 *
 * Centralised helpers for building consistent JSON error responses.
 * All user-facing messages are in Arabic.
 */

import { NextResponse } from 'next/server';
import type { ApiResponse } from '@/app/types';

/** Build a JSON error response with the standard ApiResponse shape. */
export function apiError(
  code: string,
  message: string,
  status: number = 400
): NextResponse<ApiResponse<null>> {
  return NextResponse.json({ error: { code, message } }, { status });
}

/** 400 — Validation error (one or more fields failed validation). */
export function validationError(messages: string[]): NextResponse<ApiResponse<null>> {
  return apiError('VALIDATION_ERROR', messages.join('، '), 400);
}

/** 401 — Authentication required or invalid credentials. */
export function unauthorizedError(
  message: string = 'غير مصرح — يرجى تسجيل الدخول'
): NextResponse<ApiResponse<null>> {
  return apiError('UNAUTHORIZED', message, 401);
}

/** 403 — Insufficient permissions. */
export function forbiddenError(
  message: string = 'ليس لديك صلاحية لتنفيذ هذا الإجراء'
): NextResponse<ApiResponse<null>> {
  return apiError('FORBIDDEN', message, 403);
}

/** 404 — Resource not found. */
export function notFoundError(
  message: string = 'العنصر المطلوب غير موجود'
): NextResponse<ApiResponse<null>> {
  return apiError('NOT_FOUND', message, 404);
}

/** 409 — Conflict (e.g., duplicate email or username). */
export function conflictError(
  message: string
): NextResponse<ApiResponse<null>> {
  return apiError('CONFLICT', message, 409);
}

/** 500 — Unexpected server error. */
export function serverError(
  message: string = 'حدث خطأ في الخادم، يرجى المحاولة لاحقاً'
): NextResponse<ApiResponse<null>> {
  return apiError('SERVER_ERROR', message, 500);
}
