'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { ThemeProviderWrapper } from '@/app/context/ThemeContext';
import { AuthProvider } from '@/app/context/AuthContext';
import LocaleSwitchPromptDialog from '@/app/components/common/LocaleSwitchPromptDialog';
import { clearOfflineData } from '@/app/lib/db';

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  // Bridge Service Worker postMessage → DOM custom event.
  // When Background Sync fires, the SW sends:
  //   client.postMessage({ type: 'PROCESS_OFFLINE_QUEUE' })
  // useNotes listens for the 'notes:process-offline-queue' window event.
  // Without this bridge the two never connect and the queue is never flushed
  // after a background-sync wake-up.
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'PROCESS_OFFLINE_QUEUE') {
        window.dispatchEvent(new CustomEvent('notes:process-offline-queue'));
      }
    };
    navigator.serviceWorker.addEventListener('message', handler);
    return () => navigator.serviceWorker.removeEventListener('message', handler);
  }, []);

  // When useDevices detects that this device was removed from the trusted list
  // by another session, clear offline-sensitive data immediately.
  // This runs before AuthContext's 30-second poll calls logout(), closing the
  // window in which a processQueue() trigger could still sync stale pending ops.
  useEffect(() => {
    const handler = () => { clearOfflineData().catch(() => {}); };
    window.addEventListener('device:trust-revoked', handler);
    return () => window.removeEventListener('device:trust-revoked', handler);
  }, []);

  return (
    <ThemeProviderWrapper>
      <AuthProvider>
        {children}
        <LocaleSwitchPromptDialog />
      </AuthProvider>
    </ThemeProviderWrapper>
  );
}
