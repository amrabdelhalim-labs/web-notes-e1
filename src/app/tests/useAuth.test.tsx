/**
 * useAuth Hook Tests
 *
 * Tests that useAuth correctly exposes the AuthContext value.
 * AuthContext itself is integration-tested via login/register page tests;
 * here we verify the hook wiring and surface-level contract.
 */

import { renderHook } from '@testing-library/react';
import React from 'react';
import { AuthContext, type AuthContextValue } from '@/app/context/AuthContext';
import { useAuth } from '@/app/hooks/useAuth';

function makeContextValue(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    user: null,
    token: null,
    loading: false,
    login: vi.fn(),
    register: vi.fn(),
    updateUser: vi.fn(),
    logout: vi.fn(),
    pendingLocaleSuggestion: null,
    clearLocaleSuggestion: vi.fn(),
    ...overrides,
  };
}

function wrapper(value: AuthContextValue) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
  };
}

describe('useAuth', () => {
  it('returns null user when unauthenticated', () => {
    const ctx = makeContextValue({ user: null });
    const { result } = renderHook(() => useAuth(), { wrapper: wrapper(ctx) });
    expect(result.current.user).toBeNull();
  });

  it('returns authenticated user', () => {
    const user = {
      _id: 'u1',
      username: 'ali',
      email: 'ali@example.com',
      language: 'ar' as const,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    const ctx = makeContextValue({ user, token: 'tok123' });
    const { result } = renderHook(() => useAuth(), { wrapper: wrapper(ctx) });
    expect(result.current.user).toEqual(user);
    expect(result.current.token).toBe('tok123');
  });

  it('exposes loading state', () => {
    const ctx = makeContextValue({ loading: true });
    const { result } = renderHook(() => useAuth(), { wrapper: wrapper(ctx) });
    expect(result.current.loading).toBe(true);
  });

  it('exposes login function', () => {
    const login = vi.fn();
    const ctx = makeContextValue({ login });
    const { result } = renderHook(() => useAuth(), { wrapper: wrapper(ctx) });
    expect(result.current.login).toBe(login);
  });

  it('exposes logout function', () => {
    const logout = vi.fn();
    const ctx = makeContextValue({ logout });
    const { result } = renderHook(() => useAuth(), { wrapper: wrapper(ctx) });
    result.current.logout();
    expect(logout).toHaveBeenCalledTimes(1);
  });

  it('exposes updateUser function', () => {
    const updateUser = vi.fn();
    const ctx = makeContextValue({ updateUser });
    const { result } = renderHook(() => useAuth(), { wrapper: wrapper(ctx) });
    expect(result.current.updateUser).toBe(updateUser);
  });

  it('exposes pendingLocaleSuggestion', () => {
    const ctx = makeContextValue({ pendingLocaleSuggestion: 'en' });
    const { result } = renderHook(() => useAuth(), { wrapper: wrapper(ctx) });
    expect(result.current.pendingLocaleSuggestion).toBe('en');
  });

  it('exposes clearLocaleSuggestion function', () => {
    const clearLocaleSuggestion = vi.fn();
    const ctx = makeContextValue({ clearLocaleSuggestion });
    const { result } = renderHook(() => useAuth(), { wrapper: wrapper(ctx) });
    result.current.clearLocaleSuggestion();
    expect(clearLocaleSuggestion).toHaveBeenCalledTimes(1);
  });
});
