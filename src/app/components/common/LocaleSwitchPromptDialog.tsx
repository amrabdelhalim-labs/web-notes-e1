'use client';

/**
 * LocaleSwitchPromptDialog
 *
 * Shown once right after login when the user's saved language preference
 * (from their profile) differs from the current URL locale.
 *
 * Confirms whether to switch the session locale to match the preference.
 * Switching navigates to the same page under the new locale prefix via
 * next-intl's router.replace — it does NOT modify the user preference in DB.
 *
 * The dialog is dismissed (without switching) by clicking "Keep current".
 * Either action calls clearLocaleSuggestion() so the dialog doesn't re-appear.
 */

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/app/lib/navigation';
import { useAuth } from '@/app/hooks/useAuth';
import type { SupportedLocale } from '@/app/types';

export default function LocaleSwitchPromptDialog() {
  const { pendingLocaleSuggestion, clearLocaleSuggestion } = useAuth();
  const t = useTranslations('LocaleSwitchPrompt');
  const router = useRouter();
  const pathname = usePathname();

  const open = pendingLocaleSuggestion !== null;
  const targetLocale = pendingLocaleSuggestion as SupportedLocale;

  const handleSwitch = () => {
    clearLocaleSuggestion();
    router.replace(pathname, { locale: targetLocale });
  };

  const handleKeep = () => {
    clearLocaleSuggestion();
  };

  if (!open) return null;

  const langLabel = targetLocale === 'ar' ? t('arabic') : t('english');

  return (
    <Dialog
      open={open}
      onClose={handleKeep}
      aria-labelledby="locale-switch-title"
      aria-describedby="locale-switch-body"
    >
      <DialogTitle id="locale-switch-title">{t('title')}</DialogTitle>
      <DialogContent>
        <DialogContentText id="locale-switch-body">
          {t('body', { lang: langLabel })}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={handleKeep} variant="outlined" color="inherit">
          {t('keepCurrent')}
        </Button>
        <Button onClick={handleSwitch} variant="contained" color="primary">
          {t('switchNow')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
