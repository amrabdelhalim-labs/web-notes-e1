/**
 * ProfileEditor — integration tests
 *
 * Strategy
 * ────────
 * Mock:
 *   1. @/app/hooks/useAuth  → inject user + updateUser spy
 *   2. @/app/lib/api        → updateUserApi + changePasswordApi spies
 *
 * Profile fields use inline editing:
 *   Click "تعديل <field>" icon → TextField appears → type → click "تأكيد <field>" → Dialog → click "تأكيد التغيير"
 *
 * Password section is still a form submit.
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from './utils';
import ProfileEditor from '@/app/components/profile/ProfileEditor';

// ─── Module mocks ──────────────────────────────────────────────────────────

vi.mock('@/app/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

const mockUpdateUserApi = vi.fn();
const mockChangePasswordApi = vi.fn();

vi.mock('@/app/lib/api', () => ({
  updateUserApi: (...args: unknown[]) => mockUpdateUserApi(...args),
  changePasswordApi: (...args: unknown[]) => mockChangePasswordApi(...args),
}));

import { useAuth } from '@/app/hooks/useAuth';

// ─── Fixtures ──────────────────────────────────────────────────────────────

const fakeUser = {
  _id: 'u1',
  username: 'ahmed',
  email: 'ahmed@example.com',
  displayName: 'أحمد',
  language: 'ar' as const,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const mockUpdateUser = vi.fn();

function setup() {
  mockUpdateUserApi.mockReset();
  mockChangePasswordApi.mockReset();
  mockUpdateUser.mockReset();
  (useAuth as Mock).mockReturnValue({
    user: fakeUser,
    token: 'tok',
    loading: false,
    login: vi.fn(),
    register: vi.fn(),
    updateUser: mockUpdateUser,
    logout: vi.fn(),
  });
}

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Open a field for editing by clicking its pencil icon. */
function openField(label: string) {
  fireEvent.click(screen.getByRole('button', { name: `تعديل ${label}` }));
}

/** Confirm an open field by clicking its checkmark icon. */
function confirmField(label: string) {
  fireEvent.click(screen.getByRole('button', { name: `تأكيد ${label}` }));
}

/** Cancel an open field by clicking its X icon. */
function cancelField(label: string) {
  fireEvent.click(screen.getByRole('button', { name: `إلغاء ${label}` }));
}

/** Click "تأكيد التغيير" in the confirmation dialog. */
function confirmDialog() {
  fireEvent.click(screen.getByRole('button', { name: 'تأكيد التغيير' }));
}

/** Click "إلغاء" in the confirmation dialog. */
function cancelDialog() {
  fireEvent.click(screen.getByRole('button', { name: 'إلغاء' }));
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('ProfileEditor', () => {
  // ── Rendering ────────────────────────────────────────────────────────────

  describe('Rendering', () => {
    beforeEach(() => setup());

    it('shows the profile info heading', () => {
      render(<ProfileEditor />);
      expect(screen.getByText('البيانات الشخصية')).toBeInTheDocument();
    });

    it('shows the password change heading', () => {
      render(<ProfileEditor />);
      expect(screen.getByRole('heading', { name: 'تغيير كلمة المرور' })).toBeInTheDocument();
    });

    it('displays current username as text', () => {
      render(<ProfileEditor />);
      expect(screen.getByText('ahmed')).toBeInTheDocument();
    });

    it('displays current email as text', () => {
      render(<ProfileEditor />);
      expect(screen.getByText('ahmed@example.com')).toBeInTheDocument();
    });

    it('displays current displayName as text', () => {
      render(<ProfileEditor />);
      expect(screen.getByText('أحمد')).toBeInTheDocument();
    });

    it('shows edit icons for each field', () => {
      render(<ProfileEditor />);
      expect(screen.getByRole('button', { name: 'تعديل اسم المستخدم' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'تعديل البريد الإلكتروني' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'تعديل اسم العرض' })).toBeInTheDocument();
    });
  });

  // ── Inline field editing ──────────────────────────────────────────────────

  describe('Inline field editing', () => {
    beforeEach(() => setup());

    it('shows TextField and confirm/cancel buttons after clicking edit', () => {
      render(<ProfileEditor />);
      openField('اسم المستخدم');
      expect(screen.getByRole('textbox', { name: 'اسم المستخدم' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'تأكيد اسم المستخدم' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'إلغاء اسم المستخدم' })).toBeInTheDocument();
    });

    it('pre-fills the TextField with the current value', () => {
      render(<ProfileEditor />);
      openField('اسم المستخدم');
      expect(screen.getByRole('textbox', { name: 'اسم المستخدم' })).toHaveValue('ahmed');
    });

    it('cancel hides the TextField and does not call the API', () => {
      render(<ProfileEditor />);
      openField('اسم المستخدم');
      cancelField('اسم المستخدم');
      expect(screen.queryByRole('textbox', { name: 'اسم المستخدم' })).not.toBeInTheDocument();
      expect(mockUpdateUserApi).not.toHaveBeenCalled();
    });

    it('confirm with unchanged value closes without calling the API', async () => {
      render(<ProfileEditor />);
      openField('اسم المستخدم');
      confirmField('اسم المستخدم');
      await waitFor(() =>
        expect(screen.queryByRole('textbox', { name: 'اسم المستخدم' })).not.toBeInTheDocument(),
      );
      expect(mockUpdateUserApi).not.toHaveBeenCalled();
    });

    it('calls updateUserApi with new username and closes on success', async () => {
      const updatedUser = { ...fakeUser, username: 'ahmed2' };
      mockUpdateUserApi.mockResolvedValue({ data: updatedUser, message: 'تم' });

      render(<ProfileEditor />);
      openField('اسم المستخدم');
      fireEvent.change(screen.getByRole('textbox', { name: 'اسم المستخدم' }), {
        target: { value: 'ahmed2' },
      });
      confirmField('اسم المستخدم'); // opens dialog
      confirmDialog();               // user approves

      await waitFor(() => {
        expect(mockUpdateUserApi).toHaveBeenCalledWith('u1', {
          username: 'ahmed2',
          email: 'ahmed@example.com',
          displayName: 'أحمد',
        });
      });
      expect(mockUpdateUser).toHaveBeenCalledWith(updatedUser);
      expect(screen.queryByRole('textbox', { name: 'اسم المستخدم' })).not.toBeInTheDocument();
    });

    it('shows per-field success message after saving', async () => {
      const updatedUser = { ...fakeUser, username: 'ahmed2' };
      mockUpdateUserApi.mockResolvedValue({ data: updatedUser, message: 'تم' });

      render(<ProfileEditor />);
      openField('اسم المستخدم');
      fireEvent.change(screen.getByRole('textbox', { name: 'اسم المستخدم' }), {
        target: { value: 'ahmed2' },
      });
      confirmField('اسم المستخدم'); // opens dialog
      confirmDialog();               // user approves

      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent('تم تحديث اسم المستخدم بنجاح');
      });
    });

    it('shows inline error and stays open on API failure', { timeout: 15000 }, async () => {
      mockUpdateUserApi.mockRejectedValue(new Error('اسم المستخدم محجوز'));

      render(<ProfileEditor />);
      openField('اسم المستخدم');
      fireEvent.change(screen.getByRole('textbox', { name: 'اسم المستخدم' }), {
        target: { value: 'taken' },
      });
      confirmField('اسم المستخدم'); // opens dialog
      confirmDialog();               // user approves — API will reject

      // Error text is rendered as the TextField helperText, which is only
      // inside the editing block → its presence proves the field stayed open
      await waitFor(
        () => expect(screen.getByText('اسم المستخدم محجوز')).toBeInTheDocument(),
        { timeout: 10000 },
      );
    });

    it('dialog cancel keeps field open and does not call the API', async () => {
      render(<ProfileEditor />);
      openField('اسم المستخدم');
      fireEvent.change(screen.getByRole('textbox', { name: 'اسم المستخدم' }), {
        target: { value: 'ahmed_new' },
      });
      confirmField('اسم المستخدم'); // opens dialog

      // The dialog should be visible
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      cancelDialog(); // user changes their mind

      // Dialog closed (MUI transitions), field still in editing mode
      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
      );
      expect(screen.getByRole('button', { name: 'تأكيد اسم المستخدم' })).toBeInTheDocument();
      expect(mockUpdateUserApi).not.toHaveBeenCalled();
    });

    // ── Username validation (تحقق على العميل) ─────────────────────────────────────────

    it('rejects username shorter than 3 chars without calling API', () => {
      render(<ProfileEditor />);
      openField('اسم المستخدم');
      fireEvent.change(screen.getByRole('textbox', { name: 'اسم المستخدم' }), { target: { value: 'ab' } });
      confirmField('اسم المستخدم');
      expect(screen.getByText(/يجب أن يكون 3/)).toBeInTheDocument();
      expect(mockUpdateUserApi).not.toHaveBeenCalled();
    });

    it('rejects username with spaces without calling API', () => {
      render(<ProfileEditor />);
      openField('اسم المستخدم');
      fireEvent.change(screen.getByRole('textbox', { name: 'اسم المستخدم' }), { target: { value: 'ahmed ali' } });
      confirmField('اسم المستخدم');
      expect(screen.getByText(/لا يسمح بالمسافات/)).toBeInTheDocument();
      expect(mockUpdateUserApi).not.toHaveBeenCalled();
    });

    it('rejects username with uppercase letters without calling API', () => {
      render(<ProfileEditor />);
      openField('اسم المستخدم');
      fireEvent.change(screen.getByRole('textbox', { name: 'اسم المستخدم' }), { target: { value: 'Ahmed' } });
      confirmField('اسم المستخدم');
      expect(screen.getByText(/حروفاً صغيرة/)).toBeInTheDocument();
      expect(mockUpdateUserApi).not.toHaveBeenCalled();
    });

    it('accepts valid username with lowercase + numbers + symbols', async () => {
      const updatedUser = { ...fakeUser, username: 'ahmed_2' };
      mockUpdateUserApi.mockResolvedValue({ data: updatedUser, message: 'تم' });
      render(<ProfileEditor />);
      openField('اسم المستخدم');
      fireEvent.change(screen.getByRole('textbox', { name: 'اسم المستخدم' }), { target: { value: 'ahmed_2' } });
      confirmField('اسم المستخدم'); // opens dialog
      confirmDialog();              // user approves
      await waitFor(() => expect(mockUpdateUserApi).toHaveBeenCalled());
    });

    it('Enter key opens dialog then confirm saves', async () => {
      const updatedUser = { ...fakeUser, email: 'new@test.com' };
      mockUpdateUserApi.mockResolvedValue({ data: updatedUser, message: 'تم' });

      render(<ProfileEditor />);
      openField('البريد الإلكتروني');
      const input = screen.getByRole('textbox', { name: 'البريد الإلكتروني' });
      fireEvent.change(input, { target: { value: 'new@test.com' } });
      fireEvent.keyDown(input, { key: 'Enter' }); // opens dialog
      confirmDialog();                              // user approves

      await waitFor(() => expect(mockUpdateUserApi).toHaveBeenCalled());
    });

    it('Escape key cancels without calling the API', () => {
      render(<ProfileEditor />);
      openField('البريد الإلكتروني');
      const input = screen.getByRole('textbox', { name: 'البريد الإلكتروني' });
      fireEvent.keyDown(input, { key: 'Escape' });
      expect(screen.queryByRole('textbox', { name: 'البريد الإلكتروني' })).not.toBeInTheDocument();
      expect(mockUpdateUserApi).not.toHaveBeenCalled();
    });
  });

  // ── Password change ───────────────────────────────────────────────────────

  describe('Password change', () => {
    beforeEach(() => setup());

    function fillPasswordForm(current: string, newP: string, confirm: string) {
      const inputs = screen.getAllByLabelText(/كلمة المرور/i);
      fireEvent.change(inputs[0], { target: { value: current } });
      fireEvent.change(inputs[1], { target: { value: newP } });
      fireEvent.change(inputs[2], { target: { value: confirm } });
    }

    it('shows error when current password is empty', async () => {
      const { container } = render(<ProfileEditor />);
      fireEvent.submit(container.querySelector('form')!);
      await waitFor(() =>
        expect(screen.getByRole('alert')).toHaveTextContent('كلمة المرور الحالية مطلوبة'),
      );
    });

    it('shows error when new password is too short', async () => {
      const { container } = render(<ProfileEditor />);
      fillPasswordForm('old123', '12', '12');
      fireEvent.submit(container.querySelector('form')!);
      await waitFor(() =>
        expect(screen.getByRole('alert')).toHaveTextContent('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل'),
      );
    });

    it('shows error when passwords do not match', async () => {
      const { container } = render(<ProfileEditor />);
      fillPasswordForm('old123', 'newpass', 'different');
      fireEvent.submit(container.querySelector('form')!);
      await waitFor(() =>
        expect(screen.getByRole('alert')).toHaveTextContent('كلمة المرور الجديدة وتأكيدها غير متطابقتين'),
      );
    });

    it('shows error when new password equals current', async () => {
      const { container } = render(<ProfileEditor />);
      fillPasswordForm('samepass', 'samepass', 'samepass');
      fireEvent.submit(container.querySelector('form')!);
      await waitFor(() =>
        expect(screen.getByRole('alert')).toHaveTextContent('كلمة المرور الجديدة يجب أن تختلف عن الحالية'),
      );
    });

    it('calls changePasswordApi on valid submit', async () => {
      mockChangePasswordApi.mockResolvedValue({ message: 'تم التغيير' });
      const { container } = render(<ProfileEditor />);
      fillPasswordForm('current1', 'newpass1', 'newpass1');
      fireEvent.submit(container.querySelector('form')!);
      await waitFor(() =>
        expect(mockChangePasswordApi).toHaveBeenCalledWith('u1', {
          currentPassword: 'current1',
          newPassword: 'newpass1',
          confirmPassword: 'newpass1',
        }),
      );
    });

    it('clears password fields after successful change', async () => {
      mockChangePasswordApi.mockResolvedValue({ message: 'تم تغيير كلمة المرور بنجاح' });
      const { container } = render(<ProfileEditor />);
      fillPasswordForm('current1', 'newpass1', 'newpass1');
      fireEvent.submit(container.querySelector('form')!);
      await waitFor(() =>
        expect(screen.getByRole('alert')).toHaveTextContent('تم تغيير كلمة المرور بنجاح'),
      );
      screen.getAllByLabelText(/كلمة المرور/i).forEach((input) =>
        expect(input).toHaveValue(''),
      );
    });

    it('shows server error on API failure', async () => {
      mockChangePasswordApi.mockRejectedValue(new Error('كلمة المرور الحالية غير صحيحة'));
      const { container } = render(<ProfileEditor />);
      fillPasswordForm('wrong', 'newpass1', 'newpass1');
      fireEvent.submit(container.querySelector('form')!);
      await waitFor(() =>
        expect(screen.getByRole('alert')).toHaveTextContent('كلمة المرور الحالية غير صحيحة'),
      );
    });
  });

  // ── Null user guard ───────────────────────────────────────────────────────

  describe('Guard', () => {
    it('returns null when user is not logged in', () => {
      (useAuth as Mock).mockReturnValue({
        user: null, token: null, loading: false,
        login: vi.fn(), register: vi.fn(), updateUser: vi.fn(), logout: vi.fn(),
      });
      const { container } = render(<ProfileEditor />);
      expect(container.firstChild).toBeNull();
    });
  });
});
