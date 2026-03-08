'use client';

/**
 * useOfflineStatus
 *
 * Two-layer connectivity detection:
 *   1. **Instant**: browser `online`/`offline` events (fast but imprecise —
 *      `navigator.onLine` can be `true` even when the server is unreachable).
 *   2. **Verified**: lightweight HEAD request to `/api/health` that runs:
 *      - Once on mount
 *      - Whenever the browser fires `online`
 *      - Whenever a page route changes (via `visibilitychange`)
 *      - Via the `connectivity:check` custom event (any component can trigger)
 *
 * The verified result is broadcast as a `connectivity:status` CustomEvent so
 * sibling hooks/components that are not React-tree neighbours stay in sync
 * without prop-drilling.
 *
 * SSR-safe: initial value is always `true` on the server.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/** Custom event name to request a connectivity re-check from anywhere. */
export const CONNECTIVITY_CHECK_EVENT = 'connectivity:check';
/** Custom event name broadcast after every verified connectivity result. */
export const CONNECTIVITY_STATUS_EVENT = 'connectivity:status';

const HEALTH_ENDPOINT = '/api/health';
const PING_TIMEOUT_MS = 5_000;

/**
 * Fire a HEAD request to the health endpoint.
 * Returns `true` if reachable, `false` otherwise.
 */
async function pingServer(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);
    const res = await fetch(HEALTH_ENDPOINT, {
      method: 'HEAD',
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

export function useOfflineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return navigator.onLine;
  });

  // Prevent overlapping pings
  const pinging = useRef(false);

  const verify = useCallback(async () => {
    // If browser is definitely offline, skip the ping
    if (!navigator.onLine) {
      setIsOnline(false);
      window.dispatchEvent(
        new CustomEvent(CONNECTIVITY_STATUS_EVENT, { detail: { online: false } })
      );
      return;
    }

    if (pinging.current) return;
    pinging.current = true;

    const reachable = await pingServer();
    pinging.current = false;

    setIsOnline(reachable);
    window.dispatchEvent(
      new CustomEvent(CONNECTIVITY_STATUS_EVENT, { detail: { online: reachable } })
    );
  }, []);

  useEffect(() => {
    // ── Browser events (instant layer) ──────────────────────────────────
    const handleOffline = () => {
      setIsOnline(false);
      window.dispatchEvent(
        new CustomEvent(CONNECTIVITY_STATUS_EVENT, { detail: { online: false } })
      );
    };

    const handleOnline = () => {
      // Browser says online — verify with a real ping
      verify();
    };

    // ── Visibility-based re-check (when user returns to tab) ────────────
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') verify();
    };

    // ── Manual trigger from any component ───────────────────────────────
    const handleCheckRequest = () => verify();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener(CONNECTIVITY_CHECK_EVENT, handleCheckRequest);

    // Initial verified check on mount
    verify();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener(CONNECTIVITY_CHECK_EVENT, handleCheckRequest);
    };
  }, [verify]);

  return isOnline;
}
