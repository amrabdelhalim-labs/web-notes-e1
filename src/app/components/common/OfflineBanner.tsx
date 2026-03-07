'use client';

/**
 * OfflineBanner
 *
 * Renders a sticky banner at the top of the page when the user has no network
 * connection.  Uses the ARIA live region so screen readers announce the change.
 *
 * Also shows a brief "Back online — syncing…" confirmation toast when
 * connectivity is restored so the user knows their pending changes are being
 * flushed.
 */

import { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Collapse from '@mui/material/Collapse';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import WifiIcon from '@mui/icons-material/Wifi';
import { useTranslations } from 'next-intl';
import { useOfflineStatus } from '@/app/hooks/useOfflineStatus';

export default function OfflineBanner() {
  const t = useTranslations('OfflineBanner');
  const isOnline = useOfflineStatus();
  const [showReturnedOnline, setShowReturnedOnline] = useState(false);

  // Track previous online state to detect the offline → online transition
  const prevOnline = useRef<boolean>(isOnline);

  useEffect(() => {
    // Update the ref to track state changes
    const wasOffline = !prevOnline.current && isOnline;
    prevOnline.current = isOnline;

    // Use setTimeout to avoid cascading renders (setState in next tick)
    if (wasOffline) {
      const showTimer = setTimeout(() => setShowReturnedOnline(true), 0);
      const hideTimer = setTimeout(() => setShowReturnedOnline(false), 4000);
      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [isOnline]);

  return (
    <Box
      role="status"
      aria-live="polite"
      aria-atomic="true"
      sx={{ width: '100%' }}
    >
      {/* Offline banner */}
      <Collapse in={!isOnline} unmountOnExit>
        <Alert
          icon={<WifiOffIcon />}
          severity="warning"
          variant="filled"
          sx={{
            borderRadius: 0,
            '& .MuiAlert-icon': { alignItems: 'center' },
          }}
        >
          {t('offlineMessage')}
        </Alert>
      </Collapse>

      {/* Back-online toast */}
      <Collapse in={isOnline && showReturnedOnline} unmountOnExit>
        <Alert
          icon={<WifiIcon />}
          severity="success"
          variant="filled"
          sx={{
            borderRadius: 0,
            '& .MuiAlert-icon': { alignItems: 'center' },
          }}
        >
          {t('backOnlineMessage')}
        </Alert>
      </Collapse>
    </Box>
  );
}
