/**
 * webpush.ts  (server-only)
 *
 * Configures the web-push library with VAPID credentials.
 * Call sendPushNotification() from API routes — never from client components.
 *
 * Environment variables required:
 *   VAPID_PUBLIC_KEY   — URL-safe base64 EC public key
 *   VAPID_PRIVATE_KEY  — URL-safe base64 EC private key
 *   VAPID_EMAIL        — contact email (mailto:) for push service
 *
 * Generate fresh VAPID keys once:
 *   node -e "const wp=require('web-push'); console.log(JSON.stringify(wp.generateVAPIDKeys()))"
 */

import webpush, { type PushSubscription } from 'web-push';

// ─── Initialise once ──────────────────────────────────────────────────────────

let initialised = false;

function ensureInitialised() {
  if (initialised) return;

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_EMAIL ?? 'mailto:admin@example.com';

  if (!publicKey || !privateKey) {
    throw new Error(
      'VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY must be set in environment variables. ' +
        'Generate them with: node -e "const wp=require(\'web-push\'); console.log(JSON.stringify(wp.generateVAPIDKeys()))"',
    );
  }

  webpush.setVapidDetails(email, publicKey, privateKey);
  initialised = true;
}

// ─── Push payload ─────────────────────────────────────────────────────────────

export interface PushPayload {
  title: string;
  body: string;
  /** Optional deep-link URL opened when the notification is tapped. */
  url?: string;
}

// ─── Send helper ──────────────────────────────────────────────────────────────

/**
 * Send a push notification to a single subscription.
 *
 * @returns `true` on success, `false` when the subscription has expired/gone
 *          (410 / 404 status) so the caller can remove it from the DB.
 */
export async function sendPushNotification(
  subscription: PushSubscription,
  payload: PushPayload,
): Promise<boolean> {
  ensureInitialised();

  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return true;
  } catch (err: unknown) {
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 410 || status === 404) {
      // Subscription expired or revoked — caller should delete it
      return false;
    }
    // Unexpected error — re-throw so the caller can log it
    throw err;
  }
}

/** The raw VAPID public key string, safe to expose to the client. */
export function getVapidPublicKey(): string {
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key) throw new Error('VAPID_PUBLIC_KEY not set');
  return key;
}
