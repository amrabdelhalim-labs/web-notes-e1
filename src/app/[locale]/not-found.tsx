'use client';

/**
 * not-found.tsx — [locale] level
 *
 * Rendered by Next.js when notFound() is called anywhere inside [locale]/,
 * or when the router matches no route under this locale.
 *
 * Covers two scenarios:
 *  1. Standard 404 — the requested route / resource does not exist on the server.
 *  2. Offline 404   — the page or API the user tried to reach is not cached and
 *     requires a network connection that is currently unavailable.
 *
 * No auth or MainLayout wrapper — this page must be accessible without a
 * logged-in session (e.g. if the user manually typed a wrong URL).
 */

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import HomeIcon from '@mui/icons-material/Home';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from '@/app/lib/navigation';
import { useOfflineStatus } from '@/app/hooks/useOfflineStatus';
import { useLocale } from 'next-intl';

export default function NotFound() {
  const router = useRouter();
  const isOnline = useOfflineStatus();
  const locale = useLocale();
  const isAr = locale === 'ar';

  const title = isOnline
    ? isAr
      ? '٤٠٤ — الصفحة غير موجودة'
      : '404 — Page Not Found'
    : isAr
      ? 'لا يوجد اتصال بالإنترنت'
      : 'No Internet Connection';

  const body = isOnline
    ? isAr
      ? 'الصفحة التي تبحث عنها غير موجودة أو ربما تمت إزالتها.'
      : 'The page you are looking for does not exist or may have been removed.'
    : isAr
      ? 'لا يمكن تحميل هذه الصفحة في وضع عدم الاتصال. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.'
      : 'This page cannot be loaded while offline. Please check your internet connection and try again.';

  const backLabel = isAr ? 'العودة إلى الملاحظات' : 'Back to Notes';
  const retryLabel = isAr ? 'إعادة المحاولة' : 'Retry';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        bgcolor: 'background.default',
      }}
    >
      <Paper
        elevation={0}
        variant="outlined"
        sx={{
          textAlign: 'center',
          py: { xs: 5, sm: 8 },
          px: { xs: 3, sm: 6 },
          maxWidth: 500,
          width: '100%',
          borderRadius: 3,
        }}
      >
        <Box sx={{ mb: 3 }}>
          {isOnline ? (
            <SearchOffIcon sx={{ fontSize: 80, color: 'text.disabled' }} />
          ) : (
            <WifiOffIcon sx={{ fontSize: 80, color: 'warning.main' }} />
          )}
        </Box>

        <Typography variant="h5" fontWeight={700} gutterBottom>
          {title}
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mb: 4, lineHeight: 1.7 }}
        >
          {body}
        </Typography>

        <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
          <Button
            variant="contained"
            size="large"
            startIcon={<HomeIcon />}
            onClick={() => router.push('/notes')}
          >
            {backLabel}
          </Button>

          {!isOnline && (
            <Button
              variant="outlined"
              size="large"
              startIcon={<ArrowBackIcon />}
              onClick={() => router.back()}
            >
              {retryLabel}
            </Button>
          )}
        </Stack>
      </Paper>
    </Box>
  );
}
