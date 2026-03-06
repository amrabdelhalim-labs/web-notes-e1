/**
 * RegisterPage — integration tests
 *
 * Strategy
 * ────────
 * Mirrors the pattern used in login.test.tsx.
 * The page is isolated by mocking three external seams:
 *   1. next/navigation  → useRouter
 *   2. @/app/hooks/useAuth → useAuth (register spy)
 *   3. @/app/config    → APP_NAME_AR
 *
 * Tests are grouped by concern:
 *   • Rendering    — all four fields and the submit button are present
 *   • Validation   — each client-side rule fires before register() is called
 *   • Submission   — valid input calls register() and redirects to /notes
 *   • Error handling — server errors are surfaced to the user
 *   • Auth guard   — page returns null when user is already authenticated
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from './utils';
import RegisterPage from '@/app/register/page';

// ─── Module mocks ─────────────────────────────────────────────────────────────

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

const mockRegister = vi.fn();

vi.mock('@/app/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/app/config', () => ({
  APP_NAME_AR: 'ملاحظاتي',
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

import { useAuth } from '@/app/hooks/useAuth';

function setupAuth(overrides: Record<string, unknown> = {}) {
  mockPush.mockReset();
  mockReplace.mockReset();
  mockRegister.mockReset();
  (useAuth as Mock).mockReturnValue({
    login: vi.fn(),
    register: mockRegister,
    logout: vi.fn(),
    user: null,
    loading: false,
    ...overrides,
  });
}

/** Fill all four fields with valid data and return the form element. */
function fillValidForm(container: HTMLElement) {
  fireEvent.change(screen.getByLabelText(/اسم المستخدم/i), {
    target: { value: 'ahmed' },
  });
  fireEvent.change(screen.getByLabelText(/البريد الإلكتروني/i), {
    target: { value: 'ahmed@example.com' },
  });
  // password field comes before "تأكيد" so match by placeholder/label order
  const [passInput, confirmInput] = screen.getAllByLabelText(/كلمة المرور/i);
  fireEvent.change(passInput, { target: { value: 'secret123' } });
  fireEvent.change(confirmInput, { target: { value: 'secret123' } });
  return container.querySelector('form')!;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('RegisterPage', () => {
  describe('Rendering', () => {
    beforeEach(() => setupAuth());

    it('renders the page title', () => {
      render(<RegisterPage />);
      expect(screen.getByRole('heading', { name: 'ملاحظاتي' })).toBeInTheDocument();
    });

    it('renders a username input', () => {
      render(<RegisterPage />);
      expect(screen.getByLabelText(/اسم المستخدم/i)).toBeInTheDocument();
    });

    it('renders an email input', () => {
      render(<RegisterPage />);
      expect(screen.getByLabelText(/البريد الإلكتروني/i)).toBeInTheDocument();
    });

    it('renders password and confirm-password inputs', () => {
      render(<RegisterPage />);
      const passwordInputs = screen.getAllByLabelText(/كلمة المرور/i);
      expect(passwordInputs).toHaveLength(2);
    });

    it('renders the submit button', () => {
      render(<RegisterPage />);
      expect(screen.getByRole('button', { name: /إنشاء حساب/i })).toBeInTheDocument();
    });

    it('renders a link back to the login page', () => {
      render(<RegisterPage />);
      expect(screen.getByRole('link', { name: /تسجيل الدخول/i })).toBeInTheDocument();
    });
  });

  // ── Validation ─────────────────────────────────────────────────────────────

  describe('Client-side validation', () => {
    beforeEach(() => setupAuth());

    it('shows an error when username is shorter than 3 characters', async () => {
      const { container } = render(<RegisterPage />);
      fireEvent.change(screen.getByLabelText(/اسم المستخدم/i), { target: { value: 'ab' } });
      fireEvent.submit(container.querySelector('form')!);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(
          'اسم المستخدم يجب أن يكون 3 أحرف على الأقل',
        );
      });
      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('shows an error when email is empty', async () => {
      const { container } = render(<RegisterPage />);
      fireEvent.change(screen.getByLabelText(/اسم المستخدم/i), { target: { value: 'ahmed' } });
      fireEvent.submit(container.querySelector('form')!);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('البريد الإلكتروني مطلوب');
      });
      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('shows an error when password is shorter than 6 characters', async () => {
      const { container } = render(<RegisterPage />);
      fireEvent.change(screen.getByLabelText(/اسم المستخدم/i), { target: { value: 'ahmed' } });
      fireEvent.change(screen.getByLabelText(/البريد الإلكتروني/i), {
        target: { value: 'ahmed@example.com' },
      });
      const [passInput] = screen.getAllByLabelText(/كلمة المرور/i);
      fireEvent.change(passInput, { target: { value: '123' } });
      fireEvent.submit(container.querySelector('form')!);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(
          'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
        );
      });
      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('shows an error when password and confirm-password do not match', async () => {
      const { container } = render(<RegisterPage />);
      fireEvent.change(screen.getByLabelText(/اسم المستخدم/i), { target: { value: 'ahmed' } });
      fireEvent.change(screen.getByLabelText(/البريد الإلكتروني/i), {
        target: { value: 'ahmed@example.com' },
      });
      const [passInput, confirmInput] = screen.getAllByLabelText(/كلمة المرور/i);
      fireEvent.change(passInput, { target: { value: 'secret123' } });
      fireEvent.change(confirmInput, { target: { value: 'different' } });
      fireEvent.submit(container.querySelector('form')!);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(
          'كلمة المرور وتأكيدها غير متطابقتين',
        );
      });
      expect(mockRegister).not.toHaveBeenCalled();
    });
  });

  // ── Submission ─────────────────────────────────────────────────────────────

  describe('Form submission', () => {
    beforeEach(() => setupAuth());

    it('calls register() with trimmed username, email, and password', async () => {
      mockRegister.mockResolvedValue(undefined);
      const { container } = render(<RegisterPage />);
      const form = fillValidForm(container);
      // Override username with leading/trailing space to test trim
      fireEvent.change(screen.getByLabelText(/اسم المستخدم/i), {
        target: { value: '  ahmed  ' },
      });
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith('ahmed', 'ahmed@example.com', 'secret123');
      });
    });

    it('redirects to /notes after successful registration', async () => {
      mockRegister.mockResolvedValue(undefined);
      const { container } = render(<RegisterPage />);
      fireEvent.submit(fillValidForm(container));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/notes');
      });
    });
  });

  // ── Error handling ─────────────────────────────────────────────────────────

  describe('API error handling', () => {
    beforeEach(() => setupAuth());

    it('displays the error message returned by the server', async () => {
      mockRegister.mockRejectedValue(new Error('البريد الإلكتروني مستخدم بالفعل'));
      const { container } = render(<RegisterPage />);
      fireEvent.submit(fillValidForm(container));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('البريد الإلكتروني مستخدم بالفعل');
      });
    });

    it('shows a generic fallback message for non-Error rejections', async () => {
      mockRegister.mockRejectedValue('network failure');
      const { container } = render(<RegisterPage />);
      fireEvent.submit(fillValidForm(container));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('فشل إنشاء الحساب');
      });
    });

    it('does not redirect when registration fails', async () => {
      mockRegister.mockRejectedValue(new Error('خطأ'));
      const { container } = render(<RegisterPage />);
      fireEvent.submit(fillValidForm(container));

      await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  // ── Auth guard ─────────────────────────────────────────────────────────────

  describe('Auth guard', () => {
    it('returns null while auth state is loading', () => {
      setupAuth({ loading: true });
      const { container } = render(<RegisterPage />);
      expect(container.firstChild).toBeNull();
    });

    it('returns null when the user is already logged in', () => {
      setupAuth({ user: { _id: 'u1', username: 'ahmed', email: 'a@b.com' } });
      const { container } = render(<RegisterPage />);
      expect(container.firstChild).toBeNull();
    });

    it('redirects via router.replace when the user is already logged in', () => {
      setupAuth({ user: { _id: 'u1', username: 'ahmed', email: 'a@b.com' } });
      render(<RegisterPage />);
      expect(mockReplace).toHaveBeenCalledWith('/notes');
    });
  });
});
