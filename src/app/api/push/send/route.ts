/**
 * POST /api/push/send
 *
 * Sends a push notification to all registered devices of the authenticated user.
 * Stale subscriptions (410/404 responses from the push service) are automatically
 * removed from the database.
 *
 * Body: { title, body, url? }
 * Response: { message, sent, failed }
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import { authenticateRequest } from '@/app/middlewares/auth.middleware';
import { getSubscriptionRepository } from '@/app/repositories/subscription.repository';
import { sendPushNotification } from '@/app/lib/webpush';
import type { PushPayload } from '@/app/lib/webpush';
import { serverError } from '@/app/lib/apiErrors';
import type { PushSubscription } from 'web-push';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = authenticateRequest(request);
    if (auth.error) return auth.error;
    const { userId } = auth;

    const body = await request.json();
    const { title, body: msgBody, url } = body as Partial<PushPayload>;

    if (!title || !msgBody) {
      return NextResponse.json(
        { error: { code: 'MISSING_FIELDS', message: 'title و body مطلوبان' } },
        { status: 400 }
      );
    }

    await connectDB();
    const subRepo = getSubscriptionRepository();
    const subscriptions = await subRepo.findByUser(userId);

    if (subscriptions.length === 0) {
      return NextResponse.json({ message: 'لا توجد أجهزة مسجلة', sent: 0, failed: 0 });
    }

    const payload: PushPayload = { title: title!, body: msgBody!, url };
    let sent = 0;
    let failed = 0;

    await Promise.all(
      subscriptions.map(async (sub) => {
        const pushSub: PushSubscription = {
          endpoint: sub.endpoint,
          keys: sub.keys,
        };

        try {
          const success = await sendPushNotification(pushSub, payload);
          if (success) {
            sent++;
          } else {
            // Subscription expired — remove from DB
            failed++;
            await subRepo.deleteByEndpoint(sub.endpoint);
          }
        } catch {
          failed++;
        }
      })
    );

    return NextResponse.json({
      message: `تم إرسال ${sent} إشعار`,
      sent,
      failed,
    });
  } catch (error) {
    console.error('Push send error:', error);
    return serverError();
  }
}
