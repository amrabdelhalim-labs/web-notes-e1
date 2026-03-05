'use client';

/**
 * Login Page
 *
 * Email + password form with client-side validation.
 * Redirects to /notes on success.
 */

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';
import CircularProgress from '@mui/material/CircularProgress';
import NextLink from 'next/link';
import { useAuth } from '@/app/hooks/useAuth';
import { APP_NAME_AR } from '@/app/config';

export default function LoginPage() {
  const { login, user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // If already logged in, redirect
  if (!authLoading && user) {
    router.replace('/notes');
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (!email.trim()) {
      setError('البريد الإلكتروني مطلوب');
      return;
    }
    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      router.push('/notes');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تسجيل الدخول');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        p: 2,
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 420 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" component="h1" textAlign="center" fontWeight={700} gutterBottom>
            {APP_NAME_AR}
          </Typography>
          <Typography variant="body1" textAlign="center" color="text.secondary" mb={3}>
            تسجيل الدخول إلى حسابك
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              label="البريد الإلكتروني"
              type="email"
              fullWidth
              required
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={submitting}
            />
            <TextField
              label="كلمة المرور"
              type="password"
              fullWidth
              required
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={submitting}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={submitting}
              sx={{ mt: 2, mb: 2 }}
            >
              {submitting ? <CircularProgress size={24} color="inherit" /> : 'تسجيل الدخول'}
            </Button>
          </Box>

          <Typography variant="body2" textAlign="center">
            ليس لديك حساب؟{' '}
            <Link component={NextLink} href="/register" underline="hover">
              إنشاء حساب جديد
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
