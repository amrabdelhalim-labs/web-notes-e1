/**
 * pushUtils
 *
 * Utilities for cleaning up Web Push subscriptions from the browser side.
 *
 * Two variants:
 *  - clearPushSubscription()   — unsubscribes from PushManager AND notifies
 *    the server (use when the server hasn't already deleted the record, e.g.
 *    during manual PWA deactivation or trust revocation).
 *  - clearLocalPushState()     — unsubscribes from PushManager without a
 *    server call (use when the server already cleaned up, e.g. after a device
 *    DELETE request that cascades to push records).
 *
 * Both functions always remove the `push-subscribed` localStorage flag in a
 * `finally` block so the UI reflects the unsubscribed state even if the
 * PushManager call throws. All errors are swallowed — push cleanup is
 * considered best-effort and must never block the calling flow.
 */

import { unsubscribePushApi } from '@/app/lib/api';

const PUSH_STORAGE_KEY = 'push-subscribed';

async function getBrowserSubscription(): Promise<PushSubscription | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null;
  const reg = await navigator.serviceWorker.getRegistration('/');
  return reg?.pushManager.getSubscription() ?? null;
}

/**
 * Unsubscribes from the browser PushManager and removes the subscription
 * record from the server. Both operations are best-effort.
 *
 * Use this when the server has NOT already cleaned up the subscription
 * (e.g. manual PWA deactivation, device trust revoked by another device).
 */
export async function clearPushSubscription(): Promise<void> {
  try {
    const sub = await getBrowserSubscription();
    if (sub) {
      const endpoint = sub.endpoint;
      await sub.unsubscribe();
      // Best-effort: remove from server; may 404 if already gone — that's fine.
      await unsubscribePushApi(endpoint).catch(() => {});
    }
  } catch {
    // Non-critical — fall through to finally
  } finally {
    localStorage.removeItem(PUSH_STORAGE_KEY);
  }
}

/**
 * Unsubscribes from the browser PushManager only (no server call).
 *
 * Use this when the server has already cleaned up the subscription record
 * (e.g. after a device removal request whose server handler cascades to
 * push subscription records).
 */
export async function clearLocalPushState(): Promise<void> {
  try {
    const sub = await getBrowserSubscription();
    if (sub) await sub.unsubscribe();
  } catch {
    // Non-critical
  } finally {
    localStorage.removeItem(PUSH_STORAGE_KEY);
  }
}
