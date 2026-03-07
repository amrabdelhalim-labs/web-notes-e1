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

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, waitFor } from './utils';
import ProfilePage from '@/app/profile/page';

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => '/profile',
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

    it('renders the page title', () => {
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

    it('renders the delete account button', () => {
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
});
