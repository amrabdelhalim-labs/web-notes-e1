/**
 * API Error Handling
 *
 * Centralised helpers for building consistent JSON error responses.
 * All user-facing messages come from the i18n message files (ar.json / en.json)
 * and are resolved for the locale detected from the incoming request.
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse, SupportedLocale } from '@/app/types';
import arMessages from '@/messages/ar.json';
import enMessages from '@/messages/en.json';

// ─── Locale helpers ────────────────────────────────────────────────────────

type ServerErrorMessages = typeof arMessages.ServerErrors;
export type ServerErrorKey = keyof ServerErrorMessages;

/**
 * Extract the UI locale from the `x-locale` request header.
 * The client API layer (api.ts) sends this header on every request.
 * Falls back to `'ar'` (the project default locale) when absent.
 */
export function getRequestLocale(request: NextRequest): SupportedLocale {
  return request.headers.get('x-locale') === 'en' ? 'en' : 'ar';
}

/**
 * Resolve a server error message key to the localised string.
 * Exported so that route handlers can build translated validation arrays.
 *
 * @example
 * const locale = getRequestLocale(request);
 * return validationError([serverMsg(locale, 'textNoteAudioField')], locale);
 */
export function serverMsg(locale: SupportedLocale, key: ServerErrorKey): string {
  const messages = locale === 'en' ? enMessages : arMessages;
  return messages.ServerErrors[key] as string;
}

// ─── Response builder ──────────────────────────────────────────────────────

/** Build a JSON error response with the standard ApiResponse shape. */
export function apiError(
  code: string,
  message: string,
  status: number = 400
): NextResponse<ApiResponse<null>> {
  return NextResponse.json({ error: { code, message } }, { status });
}

// ─── Error helpers ──────────────────────────────────────────────────────────

/** 400 — Validation error (one or more fields failed validation). */
export function validationError(
  messages: string[],
  locale: SupportedLocale = 'ar'
): NextResponse<ApiResponse<null>> {
  const separator = locale === 'en' ? ', ' : '، ';
  return apiError('VALIDATION_ERROR', messages.join(separator), 400);
}

/** 401 — Authentication required or invalid credentials. */
export function unauthorizedError(
  locale: SupportedLocale = 'ar',
  key: ServerErrorKey = 'unauthorized'
): NextResponse<ApiResponse<null>> {
  return apiError('UNAUTHORIZED', serverMsg(locale, key), 401);
}

/** 403 — Insufficient permissions. */
export function forbiddenError(
  locale: SupportedLocale = 'ar'
): NextResponse<ApiResponse<null>> {
  return apiError('FORBIDDEN', serverMsg(locale, 'forbidden'), 403);
}

/** 404 — Resource not found. */
export function notFoundError(
  locale: SupportedLocale = 'ar',
  key: ServerErrorKey = 'notFound'
): NextResponse<ApiResponse<null>> {
  return apiError('NOT_FOUND', serverMsg(locale, key), 404);
}

/** 409 — Conflict (e.g., duplicate email or username). */
export function conflictError(
  locale: SupportedLocale = 'ar',
  key: ServerErrorKey = 'conflict'
): NextResponse<ApiResponse<null>> {
  return apiError('CONFLICT', serverMsg(locale, key), 409);
}

/** 500 — Unexpected server error. */
export function serverError(
  locale: SupportedLocale = 'ar'
): NextResponse<ApiResponse<null>> {
  return apiError('SERVER_ERROR', serverMsg(locale, 'serverError'), 500);
}
