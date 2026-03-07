'use client';

/**
 * LanguageToggle — switches between Arabic (RTL) and English (LTR).
 *
 * Uses next-intl's locale-aware router so the URL locale prefix changes
 * (e.g. /ar/notes → /en/notes) while staying on the same page.
 * The user's preference is stored implicitly in the URL.
 */

import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/app/lib/navigation';

export default function LanguageToggle() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const nextLocale = locale === 'ar' ? 'en' : 'ar';
  const label = locale === 'ar' ? 'English' : 'العربية';

  const handleToggle = () => {
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <Tooltip title={label}>
      <IconButton
        color="inherit"
        onClick={handleToggle}
        aria-label={label}
        sx={{ fontFamily: 'inherit', minWidth: 40 }}
      >
        <Typography
          variant="button"
          component="span"
          sx={{ fontWeight: 700, fontSize: '0.8rem', lineHeight: 1 }}
        >
          {locale === 'ar' ? 'EN' : 'ع'}
        </Typography>
      </IconButton>
    </Tooltip>
  );
}
