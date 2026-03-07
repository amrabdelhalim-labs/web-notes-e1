/**
 * LoginPage — integration tests
 *
 * Strategy
 * ────────
 * The page is a pure client component with no server dependencies.
 * We isolate it by mocking three external seams:
 *   1. next/navigation  → useRouter  (prevent actual navigation)
 *   2. @/app/hooks/useAuth → useAuth (inject auth state + login spy)
 *   3. @/app/config    → APP_NAME_AR (stable label for queries)
 *
 * Tests are grouped by concern:
 *   • Rendering — elements are present in the DOM
 *   • Validation — client-side rules fire before any network call
 *   • Submission — happy path calls login() and redirects
 *   • Error handling — API errors are displayed to the user
 *   • Auth guard — page returns null when user is already logged in
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from './utils';
import LoginPage from '@/app/[locale]/login/page';

// ─── Module mocks ─────────────────────────────────────────────────────────────

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock('@/app/lib/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  usePathname: () => '/login',
  Link: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) =>
    React.createElement('a', { href, ...props }, children),
  redirect: vi.fn(),
}));

const mockLogin = vi.fn();

vi.mock('@/app/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/app/config', () => ({
  APP_NAME_AR: 'ملاحظاتي',
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

import { useAuth } from '@/app/hooks/useAuth';

/** Reset all spies and configure a default "logged-out, not loading" state. */
function setupAuth(overrides: Record<string, unknown> = {}) {
  mockPush.mockReset();
  mockReplace.mockReset();
  mockLogin.mockReset();
  (useAuth as Mock).mockReturnValue({
    login: mockLogin,
    register: vi.fn(),
    logout: vi.fn(),
    user: null,
    loading: false,
    ...overrides,
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('LoginPage', () => {
  describe('Rendering', () => {
    beforeEach(() => setupAuth());

    it('renders the page title', () => {
      render(<LoginPage />);
      expect(screen.getByRole('heading', { name: 'ملاحظاتي' })).toBeInTheDocument();
    });

    it('renders an email input', () => {
      render(<LoginPage />);
      expect(screen.getByLabelText(/البريد الإلكتروني/i)).toBeInTheDocument();
    });

    it('renders a password input', () => {
      render(<LoginPage />);
      expect(screen.getByLabelText(/كلمة المرور/i)).toBeInTheDocument();
    });

    it('renders the submit button', () => {
      render(<LoginPage />);
      expect(screen.getByRole('button', { name: /تسجيل الدخول/i })).toBeInTheDocument();
    });

    it('renders a link to the register page', () => {
      render(<LoginPage />);
      expect(screen.getByRole('link', { name: /إنشاء حساب جديد/i })).toBeInTheDocument();
    });
  });

  // ── Validation ─────────────────────────────────────────────────────────────

  describe('Client-side validation', () => {
    beforeEach(() => setupAuth());

    it('shows an error when email is empty and form is submitted', async () => {
      const { container } = render(<LoginPage />);

      fireEvent.submit(container.querySelector('form')!);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('البريد الإلكتروني مطلوب');
      });
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('shows an error when password is shorter than 6 characters', async () => {
      const { container } = render(<LoginPage />);

      fireEvent.change(screen.getByLabelText(/البريد الإلكتروني/i), {
        target: { value: 'user@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/كلمة المرور/i), {
        target: { value: '123' },
      });
      fireEvent.submit(container.querySelector('form')!);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(
          'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
        );
      });
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('does not show an error when inputs are valid', async () => {
      mockLogin.mockResolvedValue(undefined);
      const { container } = render(<LoginPage />);

      fireEvent.change(screen.getByLabelText(/البريد الإلكتروني/i), {
        target: { value: 'user@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/كلمة المرور/i), {
        target: { value: 'password123' },
      });
      fireEvent.submit(container.querySelector('form')!);

      await waitFor(() => expect(mockLogin).toHaveBeenCalledOnce());
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  // ── Submission ─────────────────────────────────────────────────────────────

  describe('Form submission', () => {
    beforeEach(() => setupAuth());

    it('calls login() with trimmed email and password', async () => {
      mockLogin.mockResolvedValue(undefined);
      const { container } = render(<LoginPage />);

      fireEvent.change(screen.getByLabelText(/البريد الإلكتروني/i), {
        target: { value: '  user@example.com  ' },
      });
      fireEvent.change(screen.getByLabelText(/كلمة المرور/i), {
        target: { value: 'secret123' },
      });
      fireEvent.submit(container.querySelector('form')!);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('user@example.com', 'secret123');
      });
    });

    it('redirects to /notes after a successful login', async () => {
      mockLogin.mockResolvedValue(undefined);
      const { container } = render(<LoginPage />);

      fireEvent.change(screen.getByLabelText(/البريد الإلكتروني/i), {
        target: { value: 'user@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/كلمة المرور/i), {
        target: { value: 'secret123' },
      });
      fireEvent.submit(container.querySelector('form')!);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/notes');
      });
    });
  });

  // ── Error handling ─────────────────────────────────────────────────────────

  describe('API error handling', () => {
    beforeEach(() => setupAuth());

    it('displays the error message returned by the server', async () => {
      mockLogin.mockRejectedValue(new Error('بيانات الاعتماد غير صحيحة'));
      const { container } = render(<LoginPage />);

      fireEvent.change(screen.getByLabelText(/البريد الإلكتروني/i), {
        target: { value: 'user@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/كلمة المرور/i), {
        target: { value: 'wrongpass' },
      });
      fireEvent.submit(container.querySelector('form')!);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('بيانات الاعتماد غير صحيحة');
      });
    });

    it('shows a generic fallback message for non-Error rejections', async () => {
      mockLogin.mockRejectedValue('unexpected');
      const { container } = render(<LoginPage />);

      fireEvent.change(screen.getByLabelText(/البريد الإلكتروني/i), {
        target: { value: 'user@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/كلمة المرور/i), {
        target: { value: 'secret123' },
      });
      fireEvent.submit(container.querySelector('form')!);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('فشل تسجيل الدخول');
      });
    });

    it('does not redirect to /notes when login fails', async () => {
      mockLogin.mockRejectedValue(new Error('خطأ'));
      const { container } = render(<LoginPage />);

      fireEvent.change(screen.getByLabelText(/البريد الإلكتروني/i), {
        target: { value: 'user@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/كلمة المرور/i), {
        target: { value: 'wrongpass' },
      });
      fireEvent.submit(container.querySelector('form')!);

      await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  // ── Auth guard ─────────────────────────────────────────────────────────────

  describe('Auth guard', () => {
    it('returns null while auth state is loading', () => {
      setupAuth({ loading: true });
      const { container } = render(<LoginPage />);
      expect(container.firstChild).toBeNull();
    });

    it('returns null when the user is already logged in', () => {
      setupAuth({ user: { _id: 'u1', username: 'ahmed', email: 'a@b.com' } });
      const { container } = render(<LoginPage />);
      expect(container.firstChild).toBeNull();
    });

    it('redirects via router.replace when the user is already logged in', () => {
      setupAuth({ user: { _id: 'u1', username: 'ahmed', email: 'a@b.com' } });
      render(<LoginPage />);
      // replace is called inside useEffect — flush it
      expect(mockReplace).toHaveBeenCalledWith('/notes');
    });
  });
});
