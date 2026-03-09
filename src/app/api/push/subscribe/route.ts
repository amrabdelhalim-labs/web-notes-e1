/**
 * POST /api/push/subscribe
 *
 * Stores (or refreshes) a Web Push subscription for the authenticated user.
 * Called from the client after navigator.serviceWorker.ready.pushManager.subscribe().
 *
 * Body: { endpoint, keys: { p256dh, auth }, deviceInfo? }
 * - If the endpoint already exists in the DB it is updated (upsert).
 * - Returns { message } on success.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { connectDB } from '@/app/lib/mongodb';
import { authenticateRequest } from '@/app/middlewares/auth.middleware';
import { getSubscriptionRepository } from '@/app/repositories/subscription.repository';
import { serverError } from '@/app/lib/apiErrors';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = authenticateRequest(request);
    if (auth.error) return auth.error;
    const { userId } = auth;

    const body = await request.json();
    const { endpoint, keys, deviceId, deviceInfo } = body as {
      endpoint: string;
      keys: { p256dh: string; auth: string };
      deviceId?: string;
      deviceInfo?: string;
    };

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: { code: 'INVALID_SUBSCRIPTION', message: 'بيانات الاشتراك غير مكتملة' } },
        { status: 400 }
      );
    }

    await connectDB();
    const subRepo = getSubscriptionRepository();

    const fields = {
      keys,
      ...(deviceId && { deviceId }),
      ...(deviceInfo && { deviceInfo }),
    };

    // Upsert: update if endpoint already exists, else create
    const existing = await subRepo.findByEndpoint(endpoint);
    if (existing) {
      await subRepo.update(existing._id.toString(), fields);
    } else {
      await subRepo.create({
        user: new Types.ObjectId(userId),
        endpoint,
        ...fields,
      });
    }

    return NextResponse.json({ message: 'تم تسجيل الاشتراك بنجاح' }, { status: 201 });
  } catch (error) {
    console.error('Push subscribe error:', error);
    return serverError();
  }
}

/**
 * DELETE /api/push/subscribe
 *
 * Removes the subscription identified by its endpoint.
 * Body: { endpoint }
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = authenticateRequest(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const { endpoint } = body as { endpoint: string };

    if (!endpoint) {
      return NextResponse.json(
        { error: { code: 'MISSING_ENDPOINT', message: 'endpoint مطلوب' } },
        { status: 400 }
      );
    }

    await connectDB();
    const subRepo = getSubscriptionRepository();
    await subRepo.deleteByEndpoint(endpoint);

    return NextResponse.json({ message: 'تم إلغاء الاشتراك' }, { status: 200 });
  } catch (error) {
    console.error('Push unsubscribe error:', error);
    return serverError();
  }
}
