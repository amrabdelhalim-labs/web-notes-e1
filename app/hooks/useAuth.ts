'use client';

/**
 * useAuth
 *
 * Custom hook that exposes the AuthContext value.
 * Must be used inside <AuthProvider>.
 */

import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from '@/app/context/AuthContext';

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
