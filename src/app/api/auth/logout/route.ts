/**
 * POST /api/auth/logout
 *
 * Gracefully removes the current device from the trusted-devices list and
 * cascade-deletes its push-notification subscriptions.
 *
 * Unlike DELETE /api/devices, this endpoint does NOT require a password.
 * A valid JWT is sufficient proof of identity for self-removal during logout.
 * The password gate on the public device-management endpoint protects against
 * unauthorised removal of other sessions; here the user is already
 * authenticated and explicitly ending their own session.
 *
 * Body: { deviceId: string }
 * Returns: 200 { message }
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import { authenticateRequest } from '@/app/middlewares/auth.middleware';
import { getDeviceRepository } from '@/app/repositories/device.repository';
import { getSubscriptionRepository } from '@/app/repositories/subscription.repository';
import { serverError } from '@/app/lib/apiErrors';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = authenticateRequest(request);
    if (auth.error) return auth.error;

    // Body is optional — device may never have been trusted
    const body = (await request.json().catch(() => ({}))) as { deviceId?: string };
    const { deviceId } = body;

    if (!deviceId || typeof deviceId !== 'string') {
      // No device to remove — still a clean, valid logout response
      return NextResponse.json({ message: 'تم تسجيل الخروج' });
    }

    await connectDB();
    const deviceRepo = getDeviceRepository();
    const subRepo = getSubscriptionRepository();

    // Delete the device record. No password required: JWT proves identity and
    // self-removal during logout has no security concern (the user is in control).
    await deviceRepo.deleteByDeviceId(auth.userId, deviceId);

    // Cascade: delete all push subscriptions associated with this device.
    // deviceId is stored as the leading segment of deviceInfo: "${deviceId}|…"
    // We match on both the explicit deviceId field (new records) and the
    // legacy deviceInfo string prefix (pre-existing records without the field).
    const subs = await subRepo.findByUser(auth.userId);
    await Promise.all(
      subs
        .filter(
          (s) =>
            s.deviceId === deviceId || (s.deviceInfo && s.deviceInfo.startsWith(`${deviceId}|`))
        )
        .map((s) => subRepo.deleteByEndpoint(s.endpoint))
    );

    return NextResponse.json({ message: 'تم تسجيل الخروج وإزالة الجهاز' });
  } catch (error) {
    console.error('Logout error:', error);
    return serverError();
  }
}
