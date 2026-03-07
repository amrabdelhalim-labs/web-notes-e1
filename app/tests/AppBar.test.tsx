/**
 * AppBar Component Tests
 *
 * Tests theme toggle, user menu, navigation, and responsive behavior.
 */

import { render, screen, fireEvent } from '@/app/tests/utils';
import AppBar from '@/app/components/layout/AppBar';

const mockPush = vi.fn();
const mockToggleMode = vi.fn();
const mockLogout = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/app/hooks/useThemeMode', () => ({
  useThemeMode: () => ({ mode: 'light', toggleMode: mockToggleMode }),
}));

vi.mock('@/app/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      _id: 'u1',
      username: 'testuser',
      displayName: 'Test User',
      email: 'test@example.com',
      language: 'ar',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
    logout: mockLogout,
  }),
}));

vi.mock('@/app/config', () => ({
  APP_NAME_AR: 'ملاحظاتي',
}));

const defaultProps = {
  onMenuClick: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AppBar', () => {
  it('renders app name', () => {
    render(<AppBar {...defaultProps} />);
    expect(screen.getByText('ملاحظاتي')).toBeInTheDocument();
  });

  it('renders theme toggle button', () => {
    render(<AppBar {...defaultProps} />);
    expect(screen.getByLabelText('تبديل السمة')).toBeInTheDocument();
  });

  it('calls toggleMode when theme button clicked', () => {
    render(<AppBar {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('تبديل السمة'));
    expect(mockToggleMode).toHaveBeenCalledTimes(1);
  });

  it('renders user menu button', () => {
    render(<AppBar {...defaultProps} />);
    expect(screen.getByLabelText('حساب المستخدم')).toBeInTheDocument();
  });

  it('opens user menu on click', () => {
    render(<AppBar {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('حساب المستخدم'));
    expect(screen.getByText('الملف الشخصي')).toBeInTheDocument();
    expect(screen.getByText('تسجيل الخروج')).toBeInTheDocument();
  });

  it('shows display name in menu', () => {
    render(<AppBar {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('حساب المستخدم'));
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('navigates to profile when profile clicked', () => {
    render(<AppBar {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('حساب المستخدم'));
    fireEvent.click(screen.getByText('الملف الشخصي'));
    expect(mockPush).toHaveBeenCalledWith('/profile');
  });

  it('calls logout and navigates to login', () => {
    render(<AppBar {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('حساب المستخدم'));
    fireEvent.click(screen.getByText('تسجيل الخروج'));
    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('calls onMenuClick when menu icon clicked', () => {
    render(<AppBar {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('القائمة'));
    expect(defaultProps.onMenuClick).toHaveBeenCalledTimes(1);
  });
});
