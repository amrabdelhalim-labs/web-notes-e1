/**
 * PrivateRoute Component Tests
 *
 * Tests authentication guard: redirect, loading, and render behavior.
 */

import React from 'react';
import { render, screen, waitFor } from '@/app/tests/utils';
import PrivateRoute from '@/app/components/auth/PrivateRoute';

const mockReplace = vi.fn();

vi.mock('@/app/lib/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => '/notes',
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

let mockUser: { _id: string; username: string } | null = null;
let mockLoading = false;

vi.mock('@/app/hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser, loading: mockLoading }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockUser = null;
  mockLoading = false;
});

describe('PrivateRoute', () => {
  it('shows loading spinner while auth is loading', () => {
    mockLoading = true;
    render(
      <PrivateRoute>
        <div>Protected Content</div>
      </PrivateRoute>
    );
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('redirects to /login when user is null and loading is done', async () => {
    mockUser = null;
    mockLoading = false;
    render(
      <PrivateRoute>
        <div>Protected Content</div>
      </PrivateRoute>
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/login');
    });
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children when user is authenticated', () => {
    mockUser = { _id: 'u1', username: 'test' };
    mockLoading = false;
    render(
      <PrivateRoute>
        <div>Protected Content</div>
      </PrivateRoute>
    );
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('does not redirect while still loading', () => {
    mockLoading = true;
    mockUser = null;
    render(
      <PrivateRoute>
        <div>Content</div>
      </PrivateRoute>
    );
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
