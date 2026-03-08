'use client';

import { useState, useEffect, type SyntheticEvent } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/app/hooks/useAuth';
import { useRouter } from '@/app/lib/navigation';
import { Link } from '@/app/lib/navigation';
import { APP_NAME_AR } from '@/app/config';

export default function LoginPage() {
  const t = useTranslations('Login');
  const { login, user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/notes');
    }
  }, [authLoading, user, router]);

  if (authLoading || user) return null;

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError(t('errors.emailRequired'));
      return;
    }
    if (password.length < 6) {
      setError(t('errors.passwordTooShort'));
      return;
    }

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      router.push('/notes');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.failed'));
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
            {t('subtitle')}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              label={t('email')}
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
              label={t('password')}
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
              {submitting ? <CircularProgress size={24} color="inherit" /> : t('submit')}
            </Button>
          </Box>

          <Typography variant="body2" textAlign="center">
            {t('noAccount')}{' '}
            <Link href="/register" style={{ textDecoration: 'underline' }}>
              {t('registerLink')}
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
