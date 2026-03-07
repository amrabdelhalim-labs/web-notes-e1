'use client';

/**
 * Auth Context
 *
 * Manages JWT-based authentication state on the client side.
 * - Stores the token in localStorage
 * - Exposes login / register / logout functions
 * - Auto-loads user profile on mount if a token exists
 */

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useLocale } from 'next-intl';
import type { User, SupportedLocale } from '@/app/types';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AuthContextValue {
  /** The currently authenticated user, or null if logged out. */
  user: User | null;
  /** JWT token stored in memory. */
  token: string | null;
  /** True while loading the initial session check. */
  loading: boolean;
  /** Log in with email + password. Throws on error. */
  login: (email: string, password: string) => Promise<void>;
  /** Create a new account. Throws on error. */
  register: (username: string, email: string, password: string) => Promise<void>;
  /** Update user state in-memory after a profile change. */
  updateUser: (updated: User) => void;
  /** Clear session and redirect to /login. */
  logout: () => void;
  /**
   * Set when the logged-in user's saved language preference differs from the
   * current URL locale. A prompt should be shown asking if the user wants to
   * switch. Cleared by calling clearLocaleSuggestion().
   */
  pendingLocaleSuggestion: SupportedLocale | null;
  /** Dismiss the locale-switch suggestion without switching. */
  clearLocaleSuggestion: () => void;
}

const TOKEN_KEY = 'auth-token';

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  updateUser: () => {},
  logout: () => {},
  pendingLocaleSuggestion: null,
  clearLocaleSuggestion: () => {},
});

// ─── Fetch helper ───────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
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

// ─── Provider ───────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const locale = useLocale() as SupportedLocale;
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  });
  const [loading, setLoading] = useState(true);
  const [pendingLocaleSuggestion, setPendingLocaleSuggestion] = useState<SupportedLocale | null>(null);
  const didInit = useRef(false);

  /** Fetch /api/auth/me and update user state. */
  const loadUser = useCallback(async (jwt: string) => {
    try {
      const res = await apiFetch<{ data: User }>('/api/auth/me', {}, jwt);
      setUser(res.data);
    } catch {
      // Token invalid/expired → clear
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
    }
  }, []);

  /* Hydrate user data from stored token once. */
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    const storedToken = token;
    if (storedToken) {
      loadUser(storedToken).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiFetch<{ data: { token: string; user: User } }>(
      '/api/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) },
    );
    localStorage.setItem(TOKEN_KEY, res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    // Prompt if the user has an explicit language preference that differs from the current locale
    const pref = res.data.user.language;
    if (pref !== 'unset' && pref !== locale) {
      setPendingLocaleSuggestion(pref);
    }
  }, [locale]);

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      const res = await apiFetch<{ data: { token: string; user: User } }>(
        '/api/auth/register',
        { method: 'POST', body: JSON.stringify({ username, email, password }) },
      );
      localStorage.setItem(TOKEN_KEY, res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
    },
    [],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setPendingLocaleSuggestion(null);
  }, []);

  const clearLocaleSuggestion = useCallback(() => {
    setPendingLocaleSuggestion(null);
  }, []);

  const updateUser = useCallback((updated: User) => {
    setUser(updated);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, loading, login, register, updateUser, logout, pendingLocaleSuggestion, clearLocaleSuggestion }),
    [user, token, loading, login, register, updateUser, logout, pendingLocaleSuggestion, clearLocaleSuggestion],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
