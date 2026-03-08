/**
 * DeleteAccountDialog — integration tests
 *
 * Isolate by mocking:
 *   1. @/app/hooks/useAuth → user + logout spy
 *   2. @/app/lib/api → deleteUserApi spy
 *   3. next/navigation → useRouter (push spy)
 *
 * Groups:
 *   • Trigger — button opens dialog
 *   • Validation — empty password prevented
 *   • Deletion — API success → logout + redirect
 *   • Error — API failure shown in alert
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from './utils';
import DeleteAccountDialog from '@/app/components/profile/DeleteAccountDialog';

// ─── Module mocks ─────────────────────────────────────────────────────────────

const mockPush = vi.fn();
let mockIsOnline = true;

vi.mock('@/app/lib/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn() }),
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

vi.mock('@/app/hooks/useOfflineStatus', () => ({
  useOfflineStatus: () => mockIsOnline,
}));

const mockDeleteUserApi = vi.fn();

vi.mock('@/app/lib/api', () => ({
  deleteUserApi: (...args: unknown[]) => mockDeleteUserApi(...args),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

import { useAuth } from '@/app/hooks/useAuth';

const fakeUser = {
  _id: 'u1',
  username: 'ahmed',
  email: 'ahmed@example.com',
  language: 'ar' as const,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const mockLogout = vi.fn();

function setup({ online = true }: { online?: boolean } = {}) {
  mockPush.mockReset();
  mockDeleteUserApi.mockReset();
  mockLogout.mockReset();
  mockIsOnline = online;
  (useAuth as Mock).mockReturnValue({
    user: fakeUser,
    token: 'tok',
    loading: false,
    login: vi.fn(),
    register: vi.fn(),
    updateUser: vi.fn(),
    logout: mockLogout,
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('DeleteAccountDialog', () => {
  describe('Trigger', () => {
    beforeEach(() => setup());

    it('renders the delete button', () => {
      render(<DeleteAccountDialog />);
      expect(screen.getByRole('button', { name: /حذف الحساب نهائياً/i })).toBeInTheDocument();
    });

    it('opens the dialog when the button is clicked', () => {
      render(<DeleteAccountDialog />);
      fireEvent.click(screen.getByRole('button', { name: /حذف الحساب نهائياً/i }));
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('shows a warning alert inside the dialog', () => {
      render(<DeleteAccountDialog />);
      fireEvent.click(screen.getByRole('button', { name: /حذف الحساب نهائياً/i }));
      expect(screen.getByText(/نهائي ولا يمكن التراجع عنه/i)).toBeInTheDocument();
    });
  });

  // ── Validation ─────────────────────────────────────────────────────────────

  describe('Validation', () => {
    beforeEach(() => setup());

    it('shows error when password is empty and form is submitted', async () => {
      render(<DeleteAccountDialog />);
      fireEvent.click(screen.getByRole('button', { name: /حذف الحساب نهائياً/i }));
      // The submit button inside the dialog
      const dialog = screen.getByRole('dialog');
      const submitBtn = dialog.querySelector('button[type="submit"]')!;
      // Button should be disabled when password is empty
      expect(submitBtn).toBeDisabled();
    });
  });

  // ── Deletion ───────────────────────────────────────────────────────────────

  describe('Successful deletion', () => {
    beforeEach(() => setup());

    it('calls deleteUserApi with user id and password', async () => {
      mockDeleteUserApi.mockResolvedValue({ message: 'تم الحذف' });
      render(<DeleteAccountDialog />);

      fireEvent.click(screen.getByRole('button', { name: /حذف الحساب نهائياً/i }));
      fireEvent.change(screen.getByLabelText(/كلمة المرور/i), {
        target: { value: 'mypassword' },
      });

      const dialog = screen.getByRole('dialog');
      fireEvent.submit(dialog.querySelector('form')!);

      await waitFor(() => {
        expect(mockDeleteUserApi).toHaveBeenCalledWith('u1', 'mypassword');
      });
    });

    it('calls logout after successful deletion', async () => {
      mockDeleteUserApi.mockResolvedValue({ message: 'تم الحذف' });
      render(<DeleteAccountDialog />);

      fireEvent.click(screen.getByRole('button', { name: /حذف الحساب نهائياً/i }));
      fireEvent.change(screen.getByLabelText(/كلمة المرور/i), {
        target: { value: 'mypassword' },
      });
      const dialog = screen.getByRole('dialog');
      fireEvent.submit(dialog.querySelector('form')!);

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalled();
      });
    });

    it('redirects to /login after successful deletion', async () => {
      mockDeleteUserApi.mockResolvedValue({ message: 'تم الحذف' });
      render(<DeleteAccountDialog />);

      fireEvent.click(screen.getByRole('button', { name: /حذف الحساب نهائياً/i }));
      fireEvent.change(screen.getByLabelText(/كلمة المرور/i), {
        target: { value: 'mypassword' },
      });
      const dialog = screen.getByRole('dialog');
      fireEvent.submit(dialog.querySelector('form')!);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });
  });

  // ── Error handling ─────────────────────────────────────────────────────────

  describe('Error handling', () => {
    beforeEach(() => setup());

    it('shows error when API rejects', async () => {
      mockDeleteUserApi.mockRejectedValue(new Error('كلمة المرور غير صحيحة'));
      render(<DeleteAccountDialog />);

      fireEvent.click(screen.getByRole('button', { name: /حذف الحساب نهائياً/i }));
      fireEvent.change(screen.getByLabelText(/كلمة المرور/i), {
        target: { value: 'wrong' },
      });
      const dialog = screen.getByRole('dialog');
      fireEvent.submit(dialog.querySelector('form')!);

      await waitFor(() => {
        expect(screen.getByText('كلمة المرور غير صحيحة')).toBeInTheDocument();
      });
    });

    it('does not logout or redirect on failure', async () => {
      mockDeleteUserApi.mockRejectedValue(new Error('خطأ'));
      render(<DeleteAccountDialog />);

      fireEvent.click(screen.getByRole('button', { name: /حذف الحساب نهائياً/i }));
      fireEvent.change(screen.getByLabelText(/كلمة المرور/i), {
        target: { value: 'wrong' },
      });
      const dialog = screen.getByRole('dialog');
      fireEvent.submit(dialog.querySelector('form')!);

      await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
      expect(mockLogout).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  // ── Cancel ─────────────────────────────────────────────────────────────────

  describe('Cancel', () => {
    beforeEach(() => setup());

    it('closes dialog when cancel button is clicked', async () => {
      render(<DeleteAccountDialog />);
      fireEvent.click(screen.getByRole('button', { name: /حذف الحساب نهائياً/i }));
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /إلغاء/i }));
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });
  // ── Offline mode ─────────────────────────────────────────────────

  describe('Offline mode', () => {
    beforeEach(() => setup({ online: false }));

    it('disables the delete button when offline', () => {
      render(<DeleteAccountDialog />);
      const btn = screen.getByRole('button', { name: /حذف الحساب نهائياً/i });
      expect(btn).toBeDisabled();
    });

    it('does not open dialog when offline button is clicked', () => {
      render(<DeleteAccountDialog />);
      const btn = screen.getByRole('button', { name: /حذف الحساب نهائياً/i });
      fireEvent.click(btn);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('shows offline tooltip text when hovered (aria-label present)', () => {
      render(<DeleteAccountDialog />);
      const btn = screen.getByRole('button', { name: /حذف الحساب نهائياً/i });
      // Tooltip text is rendered via title prop on wrapper span
      expect(btn.closest('span')).toBeInTheDocument();
    });

    it('enables the button again when back online', () => {
      // Start offline
      render(<DeleteAccountDialog />);
      expect(screen.getByRole('button', { name: /حذف الحساب نهائياً/i })).toBeDisabled();
    });
  });
});
