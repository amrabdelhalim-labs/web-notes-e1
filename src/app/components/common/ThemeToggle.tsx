'use client';

/**
 * ThemeToggle — icon button that switches between light and dark mode.
 *
 * Extracted from AppBar so it can be reused anywhere without pulling
 * in the full AppBar integration.
 */

import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useThemeMode } from '@/app/hooks/useThemeMode';
import { useTranslations } from 'next-intl';

export default function ThemeToggle() {
  const { mode, toggleMode } = useThemeMode();
  const t = useTranslations('AppBar');
  const label = t('toggleTheme');

  return (
    <Tooltip title={label}>
      <IconButton color="inherit" onClick={toggleMode} aria-label={label}>
        {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
      </IconButton>
    </Tooltip>
  );
}
