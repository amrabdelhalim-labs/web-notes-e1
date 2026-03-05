'use client';

/**
 * API Client
 *
 * Centralised HTTP layer for the client side.
 * - Auto-injects the JWT from localStorage
 * - Provides typed helpers for every API action
 * - Throws descriptive errors on non-2xx responses
 */

import type {
  User,
  Note,
  RegisterInput,
  LoginInput,
  NoteInput,
  UpdateNoteInput,
  UpdateUserInput,
  ChangePasswordInput,
} from '@/app/types';

// ─── Generic fetcher ────────────────────────────────────────────────────────

const TOKEN_KEY = 'auth-token';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export async function fetchApi<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(path, { ...options, headers });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error?.message ?? 'حدث خطأ غير متوقع');
  }
  return json as T;
}

// ─── Auth ───────────────────────────────────────────────────────────────────

export function loginApi(input: LoginInput) {
  return fetchApi<{ data: { token: string; user: User } }>(
    '/api/auth/login',
    { method: 'POST', body: JSON.stringify(input) },
  );
}

export function registerApi(input: RegisterInput) {
  return fetchApi<{ data: { token: string; user: User } }>(
    '/api/auth/register',
    { method: 'POST', body: JSON.stringify(input) },
  );
}

export function getMeApi() {
  return fetchApi<{ data: User }>('/api/auth/me');
}

// ─── Notes ──────────────────────────────────────────────────────────────────

interface NotesListResponse {
  data: { notes: Note[]; count: number; page: number; totalPages: number };
}

export function getNotesApi(params?: {
  page?: number;
  limit?: number;
  type?: string;
  q?: string;
}) {
  const sp = new URLSearchParams();
  if (params?.page) sp.set('page', String(params.page));
  if (params?.limit) sp.set('limit', String(params.limit));
  if (params?.type) sp.set('type', params.type);
  if (params?.q) sp.set('q', params.q);
  const qs = sp.toString();
  return fetchApi<NotesListResponse>(`/api/notes${qs ? `?${qs}` : ''}`);
}

export function getNoteApi(id: string) {
  return fetchApi<{ data: Note }>(`/api/notes/${id}`);
}

export function createNoteApi(input: NoteInput) {
  return fetchApi<{ data: Note; message: string }>('/api/notes', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateNoteApi(id: string, input: UpdateNoteInput) {
  return fetchApi<{ data: Note; message: string }>(`/api/notes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export function deleteNoteApi(id: string) {
  return fetchApi<{ message: string }>(`/api/notes/${id}`, {
    method: 'DELETE',
  });
}

// ─── User / Profile ─────────────────────────────────────────────────────────

export function updateUserApi(id: string, input: UpdateUserInput) {
  return fetchApi<{ data: User; message: string }>(`/api/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export function deleteUserApi(id: string) {
  return fetchApi<{ message: string }>(`/api/users/${id}`, {
    method: 'DELETE',
  });
}

export function changePasswordApi(id: string, input: ChangePasswordInput) {
  return fetchApi<{ message: string }>(`/api/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}
