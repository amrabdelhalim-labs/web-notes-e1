'use client';

/**
 * Profile page — will be fully implemented in Phase 6.
 * For now, shows a simple placeholder inside MainLayout.
 */

import MainLayout from '@/app/components/layout/MainLayout';
import Typography from '@mui/material/Typography';

export default function ProfilePage() {
  return (
    <MainLayout>
      <Typography variant="h4" component="h1" gutterBottom>
        الملف الشخصي
      </Typography>
      <Typography color="text.secondary">
        سيتم بناء صفحة الملف الشخصي في المرحلة ٦.
      </Typography>
    </MainLayout>
  );
}
