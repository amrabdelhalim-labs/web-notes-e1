'use client';

/**
 * MainLayout
 *
 * Wraps authenticated pages with AppBar + SideBar + main content area.
 * Automatically protects children — redirects to /login if not logged in.
 */

import { useState } from 'react';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import CircularProgress from '@mui/material/CircularProgress';
import AppBar from '@/app/components/layout/AppBar';
import SideBar from '@/app/components/layout/SideBar';
import { useAuth } from '@/app/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

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
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) return null; // will redirect

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar onMenuClick={() => setDrawerOpen((o) => !o)} />
      <SideBar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          minWidth: 0, // يمنع overflow في flex
        }}
      >
        <Toolbar /> {/* spacer */}
        {children}
      </Box>
    </Box>
  );
}
