'use client';

/**
 * Notes page — will be fully implemented in Phase 5.
 * For now, shows a simple placeholder inside MainLayout.
 */

import MainLayout from '@/app/components/layout/MainLayout';
import Typography from '@mui/material/Typography';

export default function NotesPage() {
  return (
    <MainLayout>
      <Typography variant="h4" component="h1" gutterBottom>
        الملاحظات
      </Typography>
      <Typography color="text.secondary">
        سيتم بناء واجهة الملاحظات الكاملة في المرحلة ٥.
      </Typography>
    </MainLayout>
  );
}
