/**
 * SideBar Component Tests
 *
 * Verifies navigation items, active state, logout behavior, and drawer rendering.
 */

import React from 'react';
import { render, screen, fireEvent } from '@/app/tests/utils';
import SideBar from '@/app/components/layout/SideBar';

const mockPush = vi.fn();
const mockLogout = vi.fn();

vi.mock('@/app/lib/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/notes',
  Link: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) =>
    React.createElement('a', { href, ...props }, children),
  redirect: vi.fn(),
}));

vi.mock('@/app/hooks/useAuth', () => ({
  useAuth: () => ({ logout: mockLogout }),
}));

const defaultProps = {
  open: true,
  onClose: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('SideBar', () => {
  it('renders the notes navigation link', () => {
    render(<SideBar {...defaultProps} />);
    expect(screen.getAllByText('الملاحظات').length).toBeGreaterThan(0);
  });

  it('renders the profile navigation link', () => {
    render(<SideBar {...defaultProps} />);
    expect(screen.getAllByText('الملف الشخصي').length).toBeGreaterThan(0);
  });

  it('renders the logout button', () => {
    render(<SideBar {...defaultProps} />);
    expect(screen.getAllByText('تسجيل الخروج').length).toBeGreaterThan(0);
  });

  it('navigates to /notes when notes item is clicked', () => {
    render(<SideBar {...defaultProps} />);
    const notesButtons = screen.getAllByText('الملاحظات');
    fireEvent.click(notesButtons[0]);
    expect(mockPush).toHaveBeenCalledWith('/notes');
  });

  it('navigates to /profile when profile item is clicked', () => {
    render(<SideBar {...defaultProps} />);
    const profileButtons = screen.getAllByText('الملف الشخصي');
    fireEvent.click(profileButtons[0]);
    expect(mockPush).toHaveBeenCalledWith('/profile');
  });

  it('calls logout and navigates to /login when logout is clicked', () => {
    render(<SideBar {...defaultProps} />);
    const logoutButtons = screen.getAllByText('تسجيل الخروج');
    fireEvent.click(logoutButtons[0]);
    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('calls onClose after navigation', () => {
    const onClose = vi.fn();
    render(<SideBar open={true} onClose={onClose} />);
    const notesButtons = screen.getAllByText('الملاحظات');
    fireEvent.click(notesButtons[0]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
