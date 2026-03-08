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
import { db } from '@/app/lib/db';

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
const TRUST_CHANGED_EVENT = 'device-trust-changed';
/** Persists the last-known user object for offline restoration. */
const USER_CACHE_KEY = 'auth-user-cache';

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
  token?: string | null
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
  const [pendingLocaleSuggestion, setPendingLocaleSuggestion] = useState<SupportedLocale | null>(
    null
  );
  const didInit = useRef(false);

  /**
   * Fetch /api/auth/me and update user state.
   *
   * On SUCCESS  → update in-memory user + refresh USER_CACHE_KEY in localStorage.
   * On 401      → token is truly invalid; clear token + cache + user.
   * On NETWORK  → network is unavailable; restore user from USER_CACHE_KEY so the
   *               app keeps working offline without redirecting to /login.
   */
  const loadUser = useCallback(async (jwt: string) => {
    try {
      const res = await apiFetch<{ data: User }>('/api/auth/me', {}, jwt);
      setUser(res.data);
      // Keep the cache fresh for the next offline session
      try {
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(res.data));
      } catch {
        /* ignore */
      }
    } catch (err) {
      const is401 =
        err instanceof Error &&
        (err.message.includes('401') ||
          err.message.includes('غير مصرح') ||
          err.message.includes('Unauthorized'));

      if (is401) {
        // Token is genuinely invalid → sign the user out
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_CACHE_KEY);
        setToken(null);
        setUser(null);
      } else {
        // Network failure — restore cached user so offline mode works
        try {
          const raw = localStorage.getItem(USER_CACHE_KEY);
          if (raw) setUser(JSON.parse(raw) as User);
          // If no cached user either, user stays null → MainLayout redirects to /login
        } catch {
          /* ignore JSON parse or storage errors */
        }
      }
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

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await apiFetch<{ data: { token: string; user: User } }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem(TOKEN_KEY, res.data.token);
      try {
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(res.data.user));
      } catch {
        /* ignore */
      }
      setToken(res.data.token);
      setUser(res.data.user);
      // Prompt if the user has an explicit language preference that differs from the current locale
      const pref = res.data.user.language;
      if (pref !== 'unset' && pref !== locale) {
        setPendingLocaleSuggestion(pref);
      }
    },
    [locale]
  );

  const register = useCallback(async (username: string, email: string, password: string) => {
    const res = await apiFetch<{ data: { token: string; user: User } }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
    localStorage.setItem(TOKEN_KEY, res.data.token);
    try {
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(res.data.user));
    } catch {
      /* ignore */
    }
    setToken(res.data.token);
    setUser(res.data.user);
  }, []);

  const logout = useCallback(async () => {
    // 1. Clear auth state
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_CACHE_KEY);
    localStorage.removeItem('push-subscribed');
    localStorage.removeItem('device-trusted');
    window.dispatchEvent(new CustomEvent(TRUST_CHANGED_EVENT, { detail: { trusted: false } }));
    setToken(null);
    setUser(null);
    setPendingLocaleSuggestion(null);

    // 2. Clear offline database (fire-and-forget)
    db.notes.clear().catch(() => {});
    db.pendingOps.clear().catch(() => {});

    // 3. Unregister Service Worker + clear caches (works offline)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => {
          for (const reg of regs) reg.unregister();
        })
        .catch(() => {});
    }
    if ('caches' in window) {
      caches
        .keys()
        .then((names) => {
          for (const name of names) caches.delete(name);
        })
        .catch(() => {});
    }
  }, []);

  const clearLocaleSuggestion = useCallback(() => {
    setPendingLocaleSuggestion(null);
  }, []);

  const updateUser = useCallback((updated: User) => {
    setUser(updated);
    try {
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(updated));
    } catch {
      /* ignore */
    }
  }, []);

  // ── Device trust watch ────────────────────────────────────────────────────
  // Poll /api/devices every 30 s (+ on tab focus) to detect remote device removal.
  // If this device was trusted but no longer appears in the server list → force logout.
  const logoutRef = useRef(logout);
  useEffect(() => {
    logoutRef.current = logout;
  }, [logout]);

  useEffect(() => {
    if (!token) return;

    const POLL_INTERVAL = 30_000;

    const checkTrust = async () => {
      const deviceId = localStorage.getItem('device-id');
      const wasTrusted = localStorage.getItem('device-trusted') === 'true';
      if (!deviceId || !wasTrusted) return; // nothing to watch

      try {
        const res = await apiFetch<{ data: Array<{ deviceId: string }> }>(
          `/api/devices?currentDeviceId=${encodeURIComponent(deviceId)}`,
          {},
          token
        );
        const stillInList = res.data.some((d) => d.deviceId === deviceId);
        if (!stillInList) {
          // Device was removed by another session — force logout immediately
          localStorage.removeItem('device-trusted');
          window.dispatchEvent(
            new CustomEvent(TRUST_CHANGED_EVENT, { detail: { trusted: false } })
          );
          logoutRef.current();
        }
      } catch {
        // Network error or unauthenticated — don't logout, let normal token
        // expiry handling deal with auth failures.
      }
    };

    checkTrust();
    const interval = setInterval(checkTrust, POLL_INTERVAL);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') checkTrust();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      updateUser,
      logout,
      pendingLocaleSuggestion,
      clearLocaleSuggestion,
    }),
    [
      user,
      token,
      loading,
      login,
      register,
      updateUser,
      logout,
      pendingLocaleSuggestion,
      clearLocaleSuggestion,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
