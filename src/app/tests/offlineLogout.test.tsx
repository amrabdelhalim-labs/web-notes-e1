/**
 * AuthContext — offline logout tests
 *
 * Validates that logout:
 *   1. Clears auth-token and push-subscribed from localStorage
 *   2. Clears Dexie offline database tables (fire-and-forget)
 *   3. Unregisters Service Workers
 *   4. Clears browser caches
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import arMessages from '@/messages/ar.json';
import { AuthProvider, AuthContext } from '@/app/context/AuthContext';

// ─── Mocks ──────────────────────────────────────────────────────────────────

// Dexie db mock
vi.mock('@/app/lib/db', () => ({
  db: {
    notes: { clear: vi.fn().mockResolvedValue(undefined) },
    pendingOps: { clear: vi.fn().mockResolvedValue(undefined) },
  },
}));

import { db } from '@/app/lib/db';

const mockUnregister = vi.fn().mockResolvedValue(true);
const mockGetRegistrations = vi.fn().mockResolvedValue([{ unregister: mockUnregister }]);
const mockCacheKeys = vi.fn().mockResolvedValue(['cache-v1', 'workbox-precache']);
const mockCacheDelete = vi.fn().mockResolvedValue(true);

// Service worker mock
Object.defineProperty(navigator, 'serviceWorker', {
  configurable: true,
  value: {
    getRegistrations: mockGetRegistrations,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
});

// Cache API mock
Object.defineProperty(window, 'caches', {
  configurable: true,
  value: {
    keys: mockCacheKeys,
    delete: mockCacheDelete,
  },
});

// Wrapper with i18n
function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider locale="ar" messages={arMessages}>
      <AuthProvider>{children}</AuthProvider>
    </NextIntlClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  localStorage.setItem('auth-token', 'test-token');
  localStorage.setItem('push-subscribed', 'true');
});

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('AuthContext offline logout', () => {
  it('clears auth-token from localStorage', async () => {
    const { result } = renderHook(() => React.useContext(AuthContext), { wrapper: Wrapper });

    await act(async () => {
      await result.current.logout();
    });

    expect(localStorage.getItem('auth-token')).toBeNull();
  });

  it('clears push-subscribed from localStorage', async () => {
    const { result } = renderHook(() => React.useContext(AuthContext), { wrapper: Wrapper });

    await act(async () => {
      await result.current.logout();
    });

    expect(localStorage.getItem('push-subscribed')).toBeNull();
  });

  it('sets user and token to null', async () => {
    const { result } = renderHook(() => React.useContext(AuthContext), { wrapper: Wrapper });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });

  it('clears Dexie notes and pendingOps tables', async () => {
    const { result } = renderHook(() => React.useContext(AuthContext), { wrapper: Wrapper });

    await act(async () => {
      await result.current.logout();
    });

    expect(db.notes.clear).toHaveBeenCalled();
    expect(db.pendingOps.clear).toHaveBeenCalled();
  });

  it('unregisters all Service Workers', async () => {
    const { result } = renderHook(() => React.useContext(AuthContext), { wrapper: Wrapper });

    await act(async () => {
      await result.current.logout();
    });

    await waitFor(() => {
      expect(mockGetRegistrations).toHaveBeenCalled();
      expect(mockUnregister).toHaveBeenCalled();
    });
  });

  it('clears all browser caches', async () => {
    const { result } = renderHook(() => React.useContext(AuthContext), { wrapper: Wrapper });

    await act(async () => {
      await result.current.logout();
    });

    await waitFor(() => {
      expect(mockCacheKeys).toHaveBeenCalled();
      expect(mockCacheDelete).toHaveBeenCalledWith('cache-v1');
      expect(mockCacheDelete).toHaveBeenCalledWith('workbox-precache');
    });
  });
});
