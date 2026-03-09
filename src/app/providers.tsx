'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { ThemeProviderWrapper } from '@/app/context/ThemeContext';
import { AuthProvider } from '@/app/context/AuthContext';
import LocaleSwitchPromptDialog from '@/app/components/common/LocaleSwitchPromptDialog';
import {
  PwaActivationProvider,
  usePwaActivation,
} from '@/app/context/PwaActivationContext';

type ProvidersProps = {
  children: ReactNode;
};

/**
 * PwaRuntime — invisible sibling that bridges Service Worker postMessage
 * events to the DOM only when offline mode is active.
 *
 * When Background Sync fires, the SW sends:
 *   client.postMessage({ type: 'PROCESS_OFFLINE_QUEUE' })
 * useNotes listens for the 'notes:process-offline-queue' window event.
 * Without this bridge the two never connect and the queue is never flushed
 * after a background-sync wake-up.
 *
 * Trust revocation (device:trust-revoked) is handled inside PwaActivationContext
 * which calls deactivate() — removing the manifest, unregistering the SW, and
 * clearing IndexedDB — so no duplicate handler is needed here.
 */
function PwaRuntime() {
  const { isActivated } = usePwaActivation();

  useEffect(() => {
    if (!isActivated || !('serviceWorker' in navigator)) return;
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'PROCESS_OFFLINE_QUEUE') {
        window.dispatchEvent(new CustomEvent('notes:process-offline-queue'));
      }
    };
    navigator.serviceWorker.addEventListener('message', handler);
    return () => navigator.serviceWorker.removeEventListener('message', handler);
  }, [isActivated]);

  return null;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProviderWrapper>
      <PwaActivationProvider>
        <AuthProvider>
          <PwaRuntime />
          {children}
          <LocaleSwitchPromptDialog />
        </AuthProvider>
      </PwaActivationProvider>
    </ThemeProviderWrapper>
  );
}
