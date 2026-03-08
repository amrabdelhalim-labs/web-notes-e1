/**
 * ProfilePage — integration tests
 *
 * Isolate by mocking:
 *   1. @/app/hooks/useAuth → user data
 *   2. @/app/lib/api → getNotesApi (for note count stats)
 *   3. next/navigation → useRouter
 *   4. Child components are NOT mocked — they render with their own mocks
 *
 * Groups:
 *   • Rendering — page title, stats chips, sections
 *   • Stats — note count fetched and displayed
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, waitFor } from './utils';
import ProfilePage from '@/app/[locale]/profile/page';

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('@/app/lib/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => '/profile',
  Link: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => React.createElement('a', { href, ...props }, children),
  redirect: vi.fn(),
}));

vi.mock('@/app/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

const mockGetNotesApi = vi.fn();
const mockUpdateUserApi = vi.fn();
const mockChangePasswordApi = vi.fn();
const mockDeleteUserApi = vi.fn();

vi.mock('@/app/lib/api', () => ({
  getNotesApi: (...args: unknown[]) => mockGetNotesApi(...args),
  updateUserApi: (...args: unknown[]) => mockUpdateUserApi(...args),
  changePasswordApi: (...args: unknown[]) => mockChangePasswordApi(...args),
  deleteUserApi: (...args: unknown[]) => mockDeleteUserApi(...args),
}));

vi.mock('@/app/hooks/usePushNotifications', () => ({
  usePushNotifications: () => ({
    status: 'unsupported',
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  }),
}));

vi.mock('@/app/hooks/usePwaStatus', () => ({
  usePwaStatus: () => ({
    swState: 'active',
    installState: 'not-installable',
    isReady: true,
  }),
}));

vi.mock('@/app/hooks/useOfflineStatus', () => ({
  useOfflineStatus: () => true,
}));

vi.mock('@/app/hooks/useDevices', () => ({
  useDevices: () => ({
    devices: [],
    loading: false,
    error: null,
    isTrusted: false,
    isOnline: true,
    deviceInfo: { deviceId: 'dev-001', browser: 'Chrome', os: 'Windows', name: 'Chrome — Windows' },
    trustCurrent: vi.fn(),
    removeDevice: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

import { useAuth } from '@/app/hooks/useAuth';

const fakeUser = {
  _id: 'u1',
  username: 'ahmed',
  email: 'ahmed@example.com',
  displayName: 'أحمد',
  language: 'ar' as const,
  createdAt: '2026-01-15T00:00:00.000Z',
  updatedAt: '2026-01-15T00:00:00.000Z',
};

function setup() {
  mockGetNotesApi.mockReset();
  mockUpdateUserApi.mockReset();
  mockChangePasswordApi.mockReset();
  mockDeleteUserApi.mockReset();
  mockGetNotesApi.mockResolvedValue({ data: { notes: [], count: 7, page: 1, totalPages: 1 } });
  (useAuth as Mock).mockReturnValue({
    user: fakeUser,
    token: 'tok',
    loading: false,
    login: vi.fn(),
    register: vi.fn(),
    updateUser: vi.fn(),
    logout: vi.fn(),
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ProfilePage', () => {
  describe('Rendering', () => {
    beforeEach(() => setup());

    it('renders the page title', { timeout: 15000 }, () => {
      render(<ProfilePage />);
      expect(screen.getByRole('heading', { name: /الملف الشخصي/i })).toBeInTheDocument();
    });

    it('shows the username chip', () => {
      render(<ProfilePage />);
      // displayName 'أحمد' may appear in multiple places (header chip + ProfileEditor field)
      // Assert at least one instance exists in the document
      expect(screen.getAllByText('أحمد').length).toBeGreaterThan(0);
    });

    it('shows the danger zone heading', () => {
      render(<ProfilePage />);
      expect(screen.getByText('منطقة الخطر')).toBeInTheDocument();
    });

    it('renders the profile editor section', () => {
      render(<ProfilePage />);
      expect(screen.getByText('البيانات الشخصية')).toBeInTheDocument();
    });

    it('renders the delete account button', { timeout: 10000 }, () => {
      render(<ProfilePage />);
      expect(screen.getByRole('button', { name: /حذف الحساب نهائياً/i })).toBeInTheDocument();
    });
  });

  // ── Stats ──────────────────────────────────────────────────────────────────

  describe('Stats', () => {
    beforeEach(() => setup());

    it('fetches note count on mount', async () => {
      render(<ProfilePage />);
      await waitFor(() => {
        expect(mockGetNotesApi).toHaveBeenCalledWith({ page: 1, limit: 1 });
      });
    });

    it('displays the note count', async () => {
      render(<ProfilePage />);
      await waitFor(() => {
        expect(screen.getByText('7 ملاحظة')).toBeInTheDocument();
      });
    });

    it('shows join date', () => {
      render(<ProfilePage />);
      // ar-EG format for Jan 15, 2026
      expect(screen.getByText(/انضم/i)).toBeInTheDocument();
    });
  });

  // ── Offline fallback ───────────────────────────────────────────────────────

  describe('Offline fallback', () => {
    beforeEach(() => setup());

    it('falls back to cached note count when API fails', async () => {
      mockGetNotesApi.mockRejectedValue(new Error('offline'));
      // Mock getCachedNotes to return 3 notes
      const dbModule = await import('@/app/lib/db');
      vi.spyOn(dbModule, 'getCachedNotes').mockResolvedValue([
        {
          _id: 'n1',
          title: 'A',
          type: 'text',
          user: 'u1',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
          _cachedAt: Date.now(),
        },
        {
          _id: 'n2',
          title: 'B',
          type: 'text',
          user: 'u1',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
          _cachedAt: Date.now(),
        },
        {
          _id: 'n3',
          title: 'C',
          type: 'text',
          user: 'u1',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
          _cachedAt: Date.now(),
        },
      ] as import('@/app/lib/db').CachedNote[]);

      render(<ProfilePage />);
      await waitFor(() => {
        expect(screen.getByText('3 ملاحظة')).toBeInTheDocument();
      });
    });
  });
});
