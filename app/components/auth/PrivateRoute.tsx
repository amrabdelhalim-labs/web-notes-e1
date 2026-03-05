'use client';

/**
 * PrivateRoute
 *
 * A lightweight wrapper that redirects unauthenticated users to /login.
 * Shows a loading spinner during the initial session check.
 *
 * Usage:
 *   <PrivateRoute><NotesPage /></PrivateRoute>
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { useAuth } from '@/app/hooks/useAuth';

export default function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
